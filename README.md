<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:0f172a,35:1d4ed8,70:06b6d4,100:10b981&text=Smart%20Auto-Scaling%20System&fontAlignY=40&desc=Incident%20Response%20%7C%20Self-Healing%20%7C%20Observability&descAlignY=62&fontColor=ffffff&animation=fadeIn" alt="Header banner" />

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=24&pause=900&color=10B981&center=true&vCenter=true&width=900&lines=Live+Node.js+incident-response+dashboard;Prometheus+metrics+%2B+Grafana+visualization;Minikube+autoscaling+lab+for+local+Kubernetes+testing;GitHub+Actions+CI%2FCD+with+Docker+Hub+and+Render+deploys" alt="Typing animation" />

<br />

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-10B981?style=for-the-badge&logo=render&logoColor=white)](https://smart-autoscale-incident-response.onrender.com)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Minikube%20Lab-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-Monitoring-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-Dashboards-F46800?style=for-the-badge&logo=grafana&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

<br />

> A portfolio-ready DevOps project that combines a live Node.js dashboard, Prometheus instrumentation, Grafana visualization, Docker packaging, and a local Kubernetes autoscaling lab.

[Live Demo](https://smart-autoscale-incident-response.onrender.com) | [Quick Start](#quick-start-docker-compose) | [Render Deploy](#deploy-to-render) | [Kubernetes Lab](#kubernetes-lab-minikube) | [Monitoring](#monitoring) | [CI/CD](#cicd-pipeline)

</div>

---

## Live Demo

Production app:

`https://smart-autoscale-incident-response.onrender.com`

Try these endpoints:

- `/` for the dashboard UI
- `/healthz` for a health check
- `/status` for memory and uptime
- `/api/info` for service metadata
- `/load?duration=5000&intensity=100` to simulate CPU pressure

## What This Project Shows

| Area | What it demonstrates |
|---|---|
| Application | Express service with health, readiness, metrics, and load-simulation endpoints |
| Observability | Prometheus metrics via `prom-client`, structured logs via `winston`, Grafana dashboards |
| Containers | Multi-stage Docker build with a production runtime target |
| Local platform lab | Minikube deployment, service exposure, HPA-based autoscaling, self-healing probes |
| CI/CD | GitHub Actions pipeline for test, Docker image build, Docker Hub push, and Render deployment trigger |
| Portfolio value | A single repo that shows app engineering, ops thinking, and production delivery flow |

## Architecture

### Production path

```text
Browser
  -> Render web service
  -> Node.js / Express app
  -> /metrics, /healthz, /status, /api/info, /load
```

### Local observability + autoscaling lab

```text
Browser
  -> Node.js app or Minikube service
  -> Prometheus scrapes /metrics
  -> Grafana visualizes dashboards
  -> Alertmanager forwards alerts to local webhook receiver
  -> HPA scales pods in Minikube during load tests
```

### CI/CD flow

```text
git push
  -> GitHub Actions test job
  -> Docker image build
  -> Docker Hub push
  -> Render deploy hook
```

## Project Structure

```text
smart-autoscale-project/
├── app/
│   ├── src/
│   │   ├── __tests__/app.test.js
│   │   ├── public/index.html
│   │   └── index.js
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
├── k8s/
│   ├── deployment.yaml
│   ├── hpa.yaml
│   ├── namespace.yaml
│   └── service.yaml
├── monitoring/
│   ├── grafana/
│   ├── prometheus/
│   └── webhook/
├── .github/workflows/ci-cd.yml
├── docker-compose.yml
├── load-test.sh
└── README.md
```

## Prerequisites

Required for the core app:

- Node.js 20+
- npm
- Docker Desktop

Optional for the full local platform lab:

- Minikube
- `kubectl`

Quick version check:

```bash
node --version
npm --version
docker --version
minikube version
kubectl version --client
```

## Quick Start (Docker Compose)

This is the fastest way to run the full local stack with the app, Prometheus, Grafana, Alertmanager, and the webhook receiver.

```bash
git clone https://github.com/YOUR_USERNAME/smart-autoscale-incident-response.git
cd smart-autoscale-incident-response
docker-compose up -d
docker-compose ps
```

Local services:

| Service | URL | Notes |
|---|---|---|
| App UI | http://localhost:3000 | Main dashboard |
| Prometheus | http://localhost:9090 | Metrics explorer |
| Grafana | http://localhost:3001 | `admin / smartscale123` |
| Alertmanager | http://localhost:9093 | Alert routing |
| Alert webhook history | http://localhost:5001/history | Alert payload viewer |

Stop the stack:

```bash
docker-compose down
```

Reset volumes too:

```bash
docker-compose down -v
```

## Deploy to Render

The live app is already deployed on Render, and this repo is a great fit for that setup because the Express app is self-contained and serves on port `3000`.

### Option 1: Deploy from the Render dashboard

1. Create a new Web Service in Render.
2. Connect your GitHub repo.
3. Use these settings:

| Field | Value |
|---|---|
| Root Directory | `app` |
| Runtime | `Node` |
| Build Command | `npm ci` |
| Start Command | `node src/index.js` |
| Environment Variable | `NODE_ENV=production` |
| Environment Variable | `PORT=3000` |

4. Deploy and open the generated Render URL.

### Option 2: Auto-deploy from GitHub Actions

Your intended deployment flow is:

```text
push to main -> GitHub Actions -> Docker Hub image push -> Render deploy hook
```

Add this GitHub secret in your repository settings:

| Secret | Purpose |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Triggers a new Render deployment after CI passes |

Get it from:

`Render dashboard -> your service -> Settings -> Deploy Hook`

## Kubernetes Lab (Minikube)

Render hosts the live app, but the Kubernetes manifests in this repo still make the project strong as a local autoscaling and self-healing demo.

### 1. Build and push your image

```bash
docker login
docker build -t YOUR_DOCKERHUB_USERNAME/smartscale-app:latest ./app
docker push YOUR_DOCKERHUB_USERNAME/smartscale-app:latest
```

### 2. Update the deployment image

Edit `k8s/deployment.yaml` and set the image to your Docker Hub repository:

```yaml
image: YOUR_DOCKERHUB_USERNAME/smartscale-app:latest
imagePullPolicy: Always
```

### 3. Start Minikube

```bash
minikube start --cpus=4 --memory=4096 --driver=docker
minikube addons enable metrics-server
```

### 4. Apply the manifests

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
```

### 5. Watch the rollout

```bash
kubectl get pods -n smartscale -w
```

### 6. Open the service

```bash
minikube service smartscale-app-svc -n smartscale
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | Dashboard UI |
| `GET /healthz` | Health probe |
| `GET /ready` | Readiness probe |
| `GET /api/info` | Service metadata |
| `GET /status` | Runtime, memory, and uptime information |
| `GET /load?duration=5000&intensity=100` | CPU load simulation |
| `GET /metrics` | Prometheus metrics |

## Load Testing

For the Kubernetes demo, open separate terminals and watch scaling happen while you generate traffic.

Watch HPA:

```bash
kubectl get hpa -n smartscale -w
```

Watch pods:

```bash
kubectl get pods -n smartscale -w
```

Run Linux or macOS load:

```bash
chmod +x load-test.sh
./load-test.sh http://$(minikube ip):30080 20 120
```

Run Windows PowerShell load:

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
Write-Host "Load running. Watch HPA and pods in the other terminals."
```

## Monitoring

### Prometheus

Open:

`http://localhost:9090`

Useful queries:

```promql
sum(rate(http_requests_total{job="smartscale-app"}[1m]))
```

```promql
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

```promql
active_connections{job="smartscale-app"}
```

### Grafana

Open:

`http://localhost:3001`

Login:

`admin / smartscale123`

The dashboard is auto-provisioned from the files in `monitoring/grafana/`.

### Alert Webhook

Open:

`http://localhost:5001/history`

This shows the alert payloads received from Alertmanager.

## CI/CD Pipeline

The README now reflects the updated deployment direction: Render for the live app, Docker Hub for container publishing, and Minikube as a local lab rather than a CI deployment target.

Expected stages:

```text
test -> build Docker image -> push to Docker Hub -> trigger Render deploy
```

Repository secrets you said you are using:

| Secret | Purpose |
|---|---|
| `SECRET` | Docker Hub username |
| `DOCKERTOKEN` | Docker Hub access token |
| `KUBECONFIGSECRET` | Optional kubeconfig for manual or experimental cluster-based deploys |
| `RENDER_DEPLOY_HOOK_URL` | Render deployment trigger |

If you keep the Kubernetes section in the workflow later, use it only for a real remote cluster, not a local Minikube kubeconfig from your laptop.

## Troubleshooting

<details>
<summary><b>ESLint fails in CI</b></summary>

`app/package.json` has a lint script, but `eslint` is not currently listed in `devDependencies`. Either add ESLint properly or remove the lint step from the workflow until you want to enforce linting.
</details>

<details>
<summary><b>Minikube image pull fails</b></summary>

Make sure `k8s/deployment.yaml` points to the exact Docker Hub image you pushed and that `imagePullPolicy` is `Always`.
</details>

<details>
<summary><b>Render deploy works locally but not from CI</b></summary>

Double-check that `RENDER_DEPLOY_HOOK_URL` is added in GitHub Actions secrets and that the service is configured with `app` as the root directory.
</details>

<details>
<summary><b>GitHub Actions fails immediately on workflow parsing</b></summary>

Do not reference `secrets.*` directly inside a job-level `if:` expression. Validate secrets inside steps instead.
</details>

<details>
<summary><b>Local kubeconfig fails in GitHub Actions</b></summary>

A Minikube kubeconfig from Windows usually contains local certificate file paths that do not exist on the GitHub-hosted Linux runner. Use a real remote cluster config if you add cluster deploys to CI.
</details>

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20, Express |
| Metrics | `prom-client` |
| Logging | `winston` |
| Testing | Jest |
| Containers | Docker |
| Orchestration lab | Kubernetes, Minikube, HPA |
| Monitoring | Prometheus, Grafana, Alertmanager |
| Automation | GitHub Actions |
| Hosting | Render |
| Registry | Docker Hub |

---

<div align="center">

### Built as a DevOps portfolio project

Node.js | Docker | Kubernetes | Prometheus | Grafana | GitHub Actions | Render

If this project helped you, a star on the repo goes a long way.

</div>
