#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Full local deploy: Minikube + K8s + Monitoring
# Run: chmod +x deploy.sh && ./deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

NAMESPACE="smartscale"
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

step() { echo -e "\n${CYAN}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
fail() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo -e "${YELLOW}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   SmartScale — Automated Deployment Script       ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── Check prerequisites ───────────────────────────────────────────────────────
step "Checking prerequisites"
for cmd in docker minikube kubectl; do
  command -v $cmd &>/dev/null && ok "$cmd found" || fail "$cmd not installed"
done

# ── Start Minikube ────────────────────────────────────────────────────────────
step "Starting Minikube"
if minikube status | grep -q "Running"; then
  ok "Minikube already running"
else
  minikube start \
    --cpus=4 \
    --memory=4096 \
    --driver=docker \
    --addons=metrics-server,ingress
  ok "Minikube started"
fi

# Enable metrics-server (needed for HPA)
minikube addons enable metrics-server 2>/dev/null || true
ok "metrics-server enabled"

# ── Point Docker to Minikube's daemon ─────────────────────────────────────────
step "Configuring Docker to use Minikube's daemon"
eval $(minikube docker-env)
ok "Docker env configured"

# ── Build Docker image inside Minikube ────────────────────────────────────────
step "Building Docker image"
docker build -t smartscale-app:latest ./app
ok "Image built: smartscale-app:latest"

# Update deployment.yaml to use local image (no registry pull)
sed -i.bak \
  's|image: .*smartscale-app:.*|image: smartscale-app:latest|' \
  k8s/deployment.yaml
sed -i.bak \
  's|imagePullPolicy: Always|imagePullPolicy: Never|' \
  k8s/deployment.yaml

# ── Deploy to Kubernetes ──────────────────────────────────────────────────────
step "Deploying to Kubernetes"
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
ok "K8s manifests applied"

# ── Wait for rollout ──────────────────────────────────────────────────────────
step "Waiting for pods to be ready"
kubectl rollout status deployment/smartscale-app -n $NAMESPACE --timeout=90s
ok "Deployment ready"

# ── Deploy Prometheus via Helm ────────────────────────────────────────────────
step "Installing Prometheus + Grafana (Helm)"
if ! command -v helm &>/dev/null; then
  warn "Helm not found. Skipping Prometheus/Grafana Helm install."
  warn "Run Docker Compose for local monitoring: docker-compose up -d"
else
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
  helm repo update

  helm upgrade --install kube-prometheus prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --create-namespace \
    --set grafana.adminPassword=smartscale123 \
    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
    --wait --timeout 5m

  ok "Prometheus + Grafana deployed via Helm"
fi

# ── Get access URLs ───────────────────────────────────────────────────────────
step "Fetching access info"
MINIKUBE_IP=$(minikube ip)
APP_URL="http://${MINIKUBE_IP}:30080"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Deployment Complete! 🚀                        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  App URL      : ${CYAN}${APP_URL}${NC}"
echo -e "  Metrics      : ${CYAN}${APP_URL}/metrics${NC}"
echo -e "  Health       : ${CYAN}${APP_URL}/healthz${NC}"
echo ""
echo -e "  To port-forward Grafana: ${YELLOW}kubectl port-forward svc/kube-prometheus-grafana 3001:80 -n monitoring${NC}"
echo -e "  Grafana login: admin / smartscale123"
echo ""
echo -e "  Watch scaling: ${YELLOW}kubectl get hpa -n $NAMESPACE -w${NC}"
echo -e "  Run load test: ${YELLOW}./load-test.sh ${APP_URL}${NC}"
echo ""
