#!/bin/bash
# Deployment script for Airbnb Kubernetes cluster

set -e

echo "=== Airbnb Kubernetes Deployment ==="
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install it first."
    exit 1
fi

# Check if cluster is available
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Kubernetes cluster is not available."
    echo "Please set up a cluster first:"
    echo "  - Docker Desktop: Enable Kubernetes in Settings"
    echo "  - Minikube: minikube start"
    echo "  - Kind: kind create cluster"
    exit 1
fi

echo "✅ Kubernetes cluster is available"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Step 1: Create namespace
echo "📦 Step 1: Creating namespace..."
kubectl apply -f "${SCRIPT_DIR}/namespace.yaml"
echo "✅ Namespace created"
echo ""

# Step 2: Create ConfigMaps
echo "📦 Step 2: Creating ConfigMaps..."
kubectl apply -f "${SCRIPT_DIR}/configmap-host-backend.yaml"
kubectl apply -f "${SCRIPT_DIR}/configmap-traveller-backend.yaml"
kubectl apply -f "${SCRIPT_DIR}/configmap-ai-agent.yaml"
kubectl apply -f "${SCRIPT_DIR}/configmap-kafka.yaml"
kubectl apply -f "${SCRIPT_DIR}/configmap-mongodb.yaml"
echo "✅ ConfigMaps created"
echo ""

# Step 3: Create Secrets
echo "📦 Step 3: Creating Secrets..."
kubectl apply -f "${SCRIPT_DIR}/secret-session.yaml"
kubectl apply -f "${SCRIPT_DIR}/secret-ai-agent.yaml"
kubectl apply -f "${SCRIPT_DIR}/secret-mongodb.yaml"
echo "✅ Secrets created"
echo ""

# Step 4: Deploy MongoDB (if not exists)
echo "📦 Step 4: Deploying MongoDB..."
if kubectl get deployment mongodb -n airbnb-system &> /dev/null; then
    echo "⚠️  MongoDB already exists, skipping..."
else
    kubectl apply -f "${SCRIPT_DIR}/deployment-mongodb.yaml"
    kubectl apply -f "${SCRIPT_DIR}/service-mongodb.yaml"
    echo "✅ MongoDB deployed"
fi
echo ""

# Step 5: Deploy Zookeeper (for Kafka)
echo "📦 Step 5: Deploying Zookeeper..."
kubectl apply -f "${SCRIPT_DIR}/statefulset-zookeeper.yaml"
kubectl apply -f "${SCRIPT_DIR}/service-zookeeper.yaml"
echo "✅ Zookeeper deployed"
echo ""

# Step 6: Deploy Kafka
echo "📦 Step 6: Deploying Kafka..."
kubectl apply -f "${SCRIPT_DIR}/statefulset-kafka.yaml"
kubectl apply -f "${SCRIPT_DIR}/service-kafka.yaml"
echo "✅ Kafka deployed"
echo ""

# Step 7: Create Application Deployments
echo "📦 Step 7: Creating Application Deployments..."
kubectl apply -f "${SCRIPT_DIR}/deployment-host-backend.yaml"
kubectl apply -f "${SCRIPT_DIR}/deployment-traveller-backend.yaml"
kubectl apply -f "${SCRIPT_DIR}/deployment-ai-agent.yaml"
kubectl apply -f "${SCRIPT_DIR}/deployment-host-frontend.yaml"
kubectl apply -f "${SCRIPT_DIR}/deployment-traveller-frontend.yaml"
echo "✅ Application Deployments created"
echo ""

# Step 8: Create Services
echo "📦 Step 8: Creating Services..."
kubectl apply -f "${SCRIPT_DIR}/service-host-backend.yaml"
kubectl apply -f "${SCRIPT_DIR}/service-traveller-backend.yaml"
kubectl apply -f "${SCRIPT_DIR}/service-ai-agent.yaml"
kubectl apply -f "${SCRIPT_DIR}/service-host-frontend.yaml"
kubectl apply -f "${SCRIPT_DIR}/service-traveller-frontend.yaml"
echo "✅ Services created"
echo ""

# Wait for infrastructure pods to be ready
echo "⏳ Waiting for infrastructure pods to be ready..."
echo "  Waiting for Zookeeper..."
kubectl wait --for=condition=ready pod -l app=zookeeper -n airbnb-system --timeout=180s || true
echo "  Waiting for Kafka..."
kubectl wait --for=condition=ready pod -l app=kafka -n airbnb-system --timeout=180s || true
echo "  Waiting for MongoDB..."
kubectl wait --for=condition=ready pod -l app=mongodb -n airbnb-system --timeout=120s || true

# Wait for application pods to be ready
echo "⏳ Waiting for application pods to be ready..."
kubectl wait --for=condition=ready pod -l app=host-backend -n airbnb-system --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=traveller-backend -n airbnb-system --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=ai-agent -n airbnb-system --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=host-frontend -n airbnb-system --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=traveller-frontend -n airbnb-system --timeout=120s || true

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "📊 Status:"
kubectl get pods -n airbnb-system
echo ""
echo "🌐 Services:"
kubectl get svc -n airbnb-system
echo ""
echo "🔗 Access Points:"
echo "  Host Frontend: http://localhost:30074"
echo "  Traveler Frontend: http://localhost:30073"
echo ""
echo "💡 To access backend services, use port-forwarding:"
echo "  kubectl port-forward -n airbnb-system svc/host-backend-service 4000:4000"
echo "  kubectl port-forward -n airbnb-system svc/traveller-backend-service 5001:5001"
echo "  kubectl port-forward -n airbnb-system svc/ai-agent-service 8000:8000"
echo "  kubectl port-forward -n airbnb-system svc/kafka-service 9092:9092"
echo ""
echo "📊 Kafka Status:"
echo "  Kafka Broker: kafka-service:9092 (internal)"
echo "  Zookeeper: zookeeper-service:2181 (internal)"

