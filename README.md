<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=28&pause=1000&color=00E5A0&center=true&vCenter=true&width=700&lines=Smart+Auto-Scaling+System;Incident+Response+%2B+Self+Healing;Kubernetes+%2B+Prometheus+%2B+Grafana" alt="Typing SVG" />

<br/>

![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-HPA%20Autoscaling-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-Monitoring-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-Dashboards-F46800?style=for-the-badge&logo=grafana&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

<br/>

> A **production-grade, self-healing Kubernetes system** that monitors a Node.js application, detects high CPU load, automatically scales pods, and fires alerts — all with a live web dashboard.

<br/>

[🚀 Quick Start](#-quick-start-docker-compose) • [☸️ Kubernetes Deploy](#️-kubernetes-deploy-minikube) • [📊 Monitoring](#-monitoring) • [⚡ Load Testing](#-load-testing--auto-scaling) • [🔧 CI/CD](#-cicd-pipeline) • [🛠️ Troubleshooting](#️-common-issues--fixes)

</div>

---

## 📌 What This Project Does

| Feature | Details |
|---|---|
| **Live Web UI** | Dashboard at `/` showing pod name, uptime, memory, response time charts |
| **Auto-Scaling** | HPA scales pods from 2 → 10 when CPU exceeds 50% |
| **Self-Healing** | Kubernetes restarts crashed pods automatically via liveness probes |
| **Zero-Downtime Deploys** | Rolling update strategy with `maxUnavailable: 0` |
| **Metrics** | Prometheus scrapes `/metrics` every 15 seconds |
| **Dashboards** | Grafana auto-provisioned with CPU, replica, latency panels |
| **Alerting** | 6 alert rules → Alertmanager → local webhook receiver |
| **CI/CD** | GitHub Actions: test → build → push Docker Hub → deploy to K8s |

---

## 🏗️ Architecture

```
                        ┌─────────────────────────────────┐
                        │         Your Browser             │
                        └──────────────┬──────────────────┘
                                       │ http://IP:30080
                        ┌──────────────▼──────────────────┐
                        │   Kubernetes Service (NodePort)  │
                        └──────────────┬──────────────────┘
                                       │
               ┌───────────────────────▼───────────────────────┐
               │           Deployment: smartscale-app           │
               │                                               │
               │  ┌─────────────┐  ┌─────────────┐  ┌──────┐  │
               │  │   Pod 1     │  │   Pod 2     │  │ ...  │  │
               │  │ Node.js App │  │ Node.js App │  │      │  │
               │  └─────────────┘  └─────────────┘  └──────┘  │
               └───────────────────────┬───────────────────────┘
                                       │
               ┌───────────────────────▼───────────────────────┐
               │   HPA — scales 2→10 pods when CPU > 50%       │
               └───────────────────────────────────────────────┘
                                       │
          ┌────────────────────────────▼────────────────────────┐
          │                  /metrics endpoint                   │
          └────────────┬──────────────────────────┬─────────────┘
                       │                          │
          ┌────────────▼──────────┐  ┌────────────▼──────────────┐
          │      Prometheus       │  │       Alertmanager         │
          │  scrapes every 15s    │  │  routes alerts → webhook   │
          └────────────┬──────────┘  └───────────────────────────┘
                       │
          ┌────────────▼──────────┐
          │        Grafana        │
          │  auto-provisioned     │
          │  dashboards           │
          └───────────────────────┘
```

**CI/CD Flow:**
```
git push → GitHub Actions → npm test → docker build → docker push → kubectl apply → rollout ✓
```

---

## 📁 Project Structure

```
smart-autoscale/
├── app/
│   ├── src/
│   │   ├── index.js              # Express app + Prometheus metrics
│   │   └── public/
│   │       └── index.html        # Live web dashboard UI
│   ├── package.json
│   ├── Dockerfile                # Multi-stage, non-root, optimized
│   └── .dockerignore
├── k8s/
│   ├── namespace.yaml            # smartscale namespace
│   ├── deployment.yaml           # Pods with probes + resource limits
│   ├── service.yaml              # NodePort (30080)
│   └── hpa.yaml                  # CPU/memory autoscaler (2–10 pods)
├── monitoring/
│   ├── prometheus/
│   │   ├── prometheus-local.yml  # ← Use this for Docker Compose
│   │   ├── prometheus.yml        # For Kubernetes (K8s service discovery)
│   │   ├── alertmanager.yml      # Webhook-only routing (no SMTP needed)
│   │   └── rules/alerts.yaml     # 6 alerting rules
│   ├── grafana/
│   │   ├── dashboard.json        # Pre-built dashboard (auto-loaded)
│   │   └── provisioning/         # Auto-configures datasource + dashboard
│   └── webhook/server.js         # Local alert receiver (simulates Slack)
├── .github/workflows/ci-cd.yml   # GitHub Actions pipeline
├── docker-compose.yml            # Full local stack
├── load-test.sh                  # Traffic simulator (Linux/Mac)
└── README.md
```

---

## ✅ Prerequisites

| Tool | Version | Download |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org |
| Docker Desktop | Latest | https://docker.com/products/docker-desktop |
| Git | Any | https://git-scm.com |
| Minikube | Latest | https://minikube.sigs.k8s.io/docs/start |
| kubectl | 1.28+ | https://kubernetes.io/docs/tasks/tools |

Verify installs:
```bash
node --version      # v20.x.x
docker --version    # 24.x or higher
minikube version    # v1.32.x
kubectl version --client
```

---

## 🚀 Quick Start (Docker Compose)

Runs the full stack locally — no Kubernetes needed.

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/smart-autoscale-incident-response.git
cd smart-autoscale-incident-response

# 2. Start everything
docker-compose up -d

# 3. Wait 30 seconds, then verify all containers show "Up"
docker-compose ps
```

| Service | URL | Credentials |
|---|---|---|
| **Web UI + App** | http://localhost:3000 | — |
| **Prometheus** | http://localhost:9090 | — |
| **Grafana** | http://localhost:3001 | admin / smartscale123 |
| **Alertmanager** | http://localhost:9093 | — |
| **Alert Webhook** | http://localhost:5001/history | — |

```bash
# Stop everything
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

---

## ☸️ Kubernetes Deploy (Minikube)

> **Windows users:** Do NOT use `minikube docker-env` or `minikube image load` — these have known issues with Docker Desktop on Windows. Use the Docker Hub approach below instead. It's also how real production pipelines work.

### Step 1 — Push your image to Docker Hub

```bash
# Log in to Docker Hub (create free account at hub.docker.com if needed)
docker login

# Build and push — replace YOUR_USERNAME with your Docker Hub username
docker build -t YOUR_USERNAME/smartscale-app:latest ./app
docker push YOUR_USERNAME/smartscale-app:latest
```

### Step 2 — Update k8s/deployment.yaml

Open the file and update these two lines:

```yaml
containers:
  - name: smartscale-app
    image: YOUR_USERNAME/smartscale-app:latest   # ← your Docker Hub image
    imagePullPolicy: Always                       # ← must be Always, not Never
```

### Step 3 — Start Minikube

```bash
minikube start --cpus=4 --memory=4096 --driver=docker
minikube addons enable metrics-server
```

### Step 4 — Deploy to Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
```

### Step 5 — Wait for pods to be Running

```bash
kubectl get pods -n smartscale -w
```

Wait until both pods show `1/1 Running`:

```
NAME                              READY   STATUS              RESTARTS   AGE
smartscale-app-xxxxxxx-xxxxx     0/1     ContainerCreating   0          8s
smartscale-app-xxxxxxx-xxxxx     1/1     Running             0          25s
smartscale-app-xxxxxxx-xxxxx     1/1     Running             0          26s
```

Press `Ctrl+C` when both show Running.

### Step 6 — Open the app

```bash
minikube service smartscale-app-svc -n smartscale
```

Your browser opens to the **live dashboard UI**.

---

## 🔄 Every Time You Restart Your Computer

```bash
# 1. Start Minikube
minikube start

# 2. Check pod status
kubectl get pods -n smartscale

# 3a. If pods show Running — get the URL
minikube service smartscale-app-svc -n smartscale

# 3b. If pods are missing — redeploy
kubectl apply -f k8s/
```

## 🔄 After Changing App Code

```bash
# Rebuild and push new image
docker build -t YOUR_USERNAME/smartscale-app:latest ./app
docker push YOUR_USERNAME/smartscale-app:latest

# Rolling restart (zero downtime)
kubectl rollout restart deployment/smartscale-app -n smartscale
kubectl rollout status deployment/smartscale-app -n smartscale
```

---

## 🌐 API Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | **Live web dashboard UI** |
| `GET /api/info` | Service name, pod, version (JSON) |
| `GET /status` | Memory, heap, uptime, PID (JSON) |
| `GET /load?duration=5000&intensity=100` | CPU burn — triggers HPA scaling |
| `GET /healthz` | Liveness probe → `{"status":"ok"}` |
| `GET /ready` | Readiness probe → `{"ready":true}` |
| `GET /metrics` | Prometheus metrics (scraped every 15s) |

---

## ⚡ Load Testing & Auto-Scaling

Open **3 terminals side by side** to watch scaling happen live.

**Terminal 1 — Watch HPA:**
```bash
kubectl get hpa -n smartscale -w
```

**Terminal 2 — Watch pods:**
```bash
kubectl get pods -n smartscale -w
```

**Terminal 3 — Run load (Linux/Mac):**
```bash
chmod +x load-test.sh
./load-test.sh http://$(minikube ip):30080 20 120
```

**Terminal 3 — Run load (Windows PowerShell):**
```powershell
$IP = minikube ip
1..15 | ForEach-Object {
  Start-Job -ScriptBlock {
    param($ip)
    for ($i = 0; $i -lt 20; $i++) {
      try {
        Invoke-WebRequest -Uri "http://$ip`:30080/load?duration=5000&intensity=100" -UseBasicParsing | Out-Null
      } catch {}
    }
  } -ArgumentList $IP
}
Write-Host "Load running — watch Terminal 1 for HPA scaling!"
```

**Or use the built-in UI** — go to `http://IP:30080`, scroll to "Load Simulator" and click **Run load test**.

### Expected scaling behavior:

```
NAME             TARGETS     MINPODS   MAXPODS   REPLICAS
smartscale-hpa   18%/50%     2         10        2        ← idle
smartscale-hpa   74%/50%     2         10        2        ← load hits
smartscale-hpa   74%/50%     2         10        4        ← HPA adds 2 pods
smartscale-hpa   89%/50%     2         10        6        ← still high
smartscale-hpa   41%/50%     2         10        6        ← cooling
smartscale-hpa   18%/50%     2         10        2        ← scaled back (5m window)
```

---

## 📊 Monitoring

### Prometheus (http://localhost:9090)

Click **Status → Targets** — `smartscale-app` should show state **UP**.

Useful queries to try:
```promql
# Request rate per second
sum(rate(http_requests_total{job="smartscale-app"}[1m]))

# P95 response latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Active connections
active_connections{job="smartscale-app"}

# Total requests by endpoint
http_requests_total{job="smartscale-app"}
```

### Grafana (http://localhost:3001)

Login: `admin` / `smartscale123`

The **SmartScale - Incident Response Dashboard** loads automatically. No manual setup. Panels include:
- Active pods count
- Request rate (req/s)
- Error rate (%)
- HPA replica count over time
- CPU usage per pod
- Memory usage per pod
- P95 latency by route
- Active connections

### Alert Webhook (http://localhost:5001/history)

View all alerts that Alertmanager has fired. Each entry shows severity, alert name, description, and timestamp.

---

## 🚨 Alert Rules

| Alert | Condition | Severity |
|---|---|---|
| `HighCPUUsage` | CPU > 80% for 1 minute | ⚠️ warning |
| `PodCrashLooping` | > 3 restarts in 5 minutes | 🔴 critical |
| `AppDown` | Target unreachable for 1 minute | 🔴 critical |
| `HighRequestLatency` | P95 > 2s for 2 minutes | ⚠️ warning |
| `HPAMaxReplicasReached` | At max replicas for 5 minutes | ⚠️ warning |
| `HighErrorRate` | 5xx rate > 5% for 2 minutes | 🔴 critical |

---

## 🔧 CI/CD Pipeline

### Required GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | How to get it |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub → Account Settings → Security → New Access Token |
| `KUBECONFIG_BASE64` | See command below |

**Get kubeconfig as base64:**
```bash
# Mac/Linux
cat ~/.kube/config | base64

# Windows PowerShell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("$env:USERPROFILE\.kube\config"))
```

### Trigger the pipeline

```bash
git add .
git commit -m "feat: trigger CI pipeline"
git push origin main
```

Go to your repo → **Actions tab** to watch it run.

### Pipeline stages

```
[test]        npm ci → lint → jest tests
     ↓
[build-push]  docker buildx (amd64 + arm64) → push to Docker Hub
     ↓
[deploy]      kubectl apply → rollout status → verify pods healthy
```

---

## 🛠️ Common Issues & Fixes

<details>
<summary><b>🔴 ErrImageNeverPull</b></summary>

**Cause:** `imagePullPolicy: Never` is set but the image isn't inside Minikube's internal Docker daemon.

**Fix:** Change `imagePullPolicy` to `Always` in `k8s/deployment.yaml`, push your image to Docker Hub, and redeploy:
```bash
kubectl apply -f k8s/deployment.yaml
kubectl delete pods -n smartscale --all
```
</details>

<details>
<summary><b>🔴 ImagePullBackOff</b></summary>

**Cause:** The image name in `deployment.yaml` doesn't match what was pushed to Docker Hub.

**Fix:** Check your exact repo name on hub.docker.com and update:
```yaml
image: YOUR_EXACT_USERNAME/YOUR_EXACT_REPO_NAME:latest
```
Then: `kubectl apply -f k8s/deployment.yaml && kubectl delete pods -n smartscale --all`
</details>

<details>
<summary><b>🔴 SVC_UNREACHABLE — no running pod found</b></summary>

**Cause:** You ran `minikube service` before pods reached `Running` state.

**Fix:** Always check pods first:
```bash
kubectl get pods -n smartscale
# Wait for 1/1 Running, THEN run:
minikube service smartscale-app-svc -n smartscale
```
</details>

<details>
<summary><b>🔴 Alertmanager keeps restarting</b></summary>

**Cause:** Old config had an email (SMTP) receiver pointing at Gmail with fake credentials.

**Fix:** The `alertmanager.yml` in this repo uses webhook-only receivers — no email config needed. Make sure you have the latest file, then:
```bash
docker-compose down -v
docker-compose up -d
```
</details>

<details>
<summary><b>🔴 App container is "unhealthy"</b></summary>

**Cause:** Old Dockerfile used `wget` for the healthcheck, which isn't installed in `node:20-alpine`.

**Fix:** The `Dockerfile` in this repo uses `node -e "require('http').get(...)"` instead. Rebuild:
```bash
docker-compose down
docker-compose up -d --build
```
</details>

<details>
<summary><b>🔴 minikube image load fails on Windows</b></summary>

**Cause:** Docker Desktop on Windows uses the containerd image store, which is incompatible with `minikube image load` and `minikube docker-env`.

**Fix:** Use Docker Hub (see [Kubernetes Deploy](#️-kubernetes-deploy-minikube) section). Set `imagePullPolicy: Always` and push your image — Kubernetes will pull it directly.
</details>

<details>
<summary><b>🔴 HPA shows "unknown" for CPU target</b></summary>

**Cause:** The metrics-server addon isn't running.

**Fix:**
```bash
minikube addons enable metrics-server
kubectl rollout restart deployment/metrics-server -n kube-system
# Wait 60 seconds, then check:
kubectl get hpa -n smartscale
```
</details>

---

## 🧰 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Application | Node.js 20 + Express | REST API + web dashboard UI |
| Metrics | prom-client | Prometheus metrics exposure |
| Logging | winston (JSON structured) | Searchable logs |
| Container | Docker (multi-stage) | Optimized, non-root image (144MB) |
| Orchestration | Kubernetes via Minikube | Pod scheduling + self-healing |
| Autoscaling | HPA v2 (CPU + memory) | 2→10 pods on load |
| Monitoring | Prometheus 2.48 | Metrics collection + alerting |
| Alerting | Alertmanager 0.26 | Alert routing + deduplication |
| Dashboards | Grafana 10.2 | Visualization |
| CI/CD | GitHub Actions | Automated build + deploy pipeline |
| Registry | Docker Hub | Public image storage |

---

## 📸 Add Your Screenshots Here

> Take screenshots while the project is running and add them to this section. Recruiters love visuals.
>
> Suggested screenshots:
> - Web dashboard UI at `http://IP:30080`
> - `kubectl get hpa -n smartscale -w` showing pods scaling 2 → 6
> - Grafana dashboard with live data
> - Prometheus targets page showing app as UP
> - GitHub Actions showing green pipeline

---

<div align="center">

### Built as a DevOps portfolio project

Node.js · Docker · Kubernetes · Prometheus · Grafana · GitHub Actions

**⭐ Star this repo if it helped you learn DevOps!**

</div>
