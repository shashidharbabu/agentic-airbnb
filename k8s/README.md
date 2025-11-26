# Kubernetes Deployment Guide

This directory contains all Kubernetes manifests for the Airbnb application.

## Prerequisites

1. **Kubernetes cluster** (minikube, kind, or Docker Desktop Kubernetes)
2. **kubectl** installed and configured
3. **Docker images** built locally (or pushed to a registry)

## Quick Start

### 1. Build Docker Images (if not already built)

```bash
# Build all images
cd backend/host && docker build -t airbnb-host-backend:latest .
cd ../traveller && docker build -t airbnb-traveller-backend:latest .
cd ../../agent && docker build -t airbnb-ai-agent:latest .
cd ../frontend/host && docker build -t airbnb-host-frontend:latest .
cd ../traveller && docker build -t airbnb-traveller-frontend:latest .
```

### 2. Load Images into Kubernetes (for local clusters)

**For minikube:**
```bash
minikube image load airbnb-host-backend:latest
minikube image load airbnb-traveller-backend:latest
minikube image load airbnb-ai-agent:latest
minikube image load airbnb-host-frontend:latest
minikube image load airbnb-traveller-frontend:latest
```

**For kind:**
```bash
kind load docker-image airbnb-host-backend:latest
kind load docker-image airbnb-traveller-backend:latest
kind load docker-image airbnb-ai-agent:latest
kind load docker-image airbnb-host-frontend:latest
kind load docker-image airbnb-traveller-frontend:latest
```

**For Docker Desktop:**
Images are automatically available if built locally.

### 3. Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f namespace.yaml
kubectl apply -f configmap-*.yaml
kubectl apply -f secret-*.yaml
kubectl apply -f deployment-*.yaml
kubectl apply -f service-*.yaml
```

Or apply all at once:
```bash
kubectl apply -f .
```

### 4. Check Deployment Status

```bash
# Check pods
kubectl get pods -n airbnb-system

# Check services
kubectl get svc -n airbnb-system

# Check deployments
kubectl get deployments -n airbnb-system
```

### 5. Access Services

**Frontend Services (NodePort):**
- Host Frontend: http://localhost:30074 (or http://<node-ip>:30074)
- Traveler Frontend: http://localhost:30073 (or http://<node-ip>:30073)

**Backend Services (ClusterIP - internal only):**
- Host Backend: `host-backend-service:4000`
- Traveler Backend: `traveller-backend-service:5001`
- AI Agent: `ai-agent-service:8000`

**Port Forwarding (for local access to backends):**
```bash
kubectl port-forward -n airbnb-system svc/host-backend-service 4000:4000
kubectl port-forward -n airbnb-system svc/traveller-backend-service 5001:5001
kubectl port-forward -n airbnb-system svc/ai-agent-service 8000:8000
```

## File Structure

```
k8s/
├── namespace.yaml                    # Namespace definition
├── configmap-*.yaml                  # Configuration maps
├── secret-*.yaml                     # Secrets (API keys, etc.)
├── deployment-*.yaml                 # Deployment manifests
├── service-*.yaml                     # Service manifests
└── README.md                          # This file
```

## Configuration

### Environment Variables

Update ConfigMaps to change environment variables:
- `configmap-host-backend.yaml`
- `configmap-traveller-backend.yaml`
- `configmap-ai-agent.yaml`

### Secrets

Update Secrets for sensitive data:
- `secret-ai-agent.yaml` - OpenAI and Tavily API keys
- `secret-session.yaml` - Session secrets

**Important:** Change default secrets before production deployment!

## Scaling

To scale services:
```bash
kubectl scale deployment host-backend -n airbnb-system --replicas=3
kubectl scale deployment traveller-backend -n airbnb-system --replicas=3
```

## Troubleshooting

### Check Pod Logs
```bash
kubectl logs -n airbnb-system <pod-name>
kubectl logs -n airbnb-system -l app=host-backend
```

### Describe Pod
```bash
kubectl describe pod -n airbnb-system <pod-name>
```

### Check Events
```bash
kubectl get events -n airbnb-system --sort-by='.lastTimestamp'
```

### Delete and Redeploy
```bash
kubectl delete -f .
kubectl apply -f .
```

## Cleanup

To remove all resources:
```bash
kubectl delete namespace airbnb-system
```

