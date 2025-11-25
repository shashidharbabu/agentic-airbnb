#!/bin/bash
# Setup script for Kubernetes cluster

echo "=== Kubernetes Cluster Setup ==="
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install it first."
    exit 1
fi

echo "✅ kubectl is installed"

# Check for existing cluster
if kubectl cluster-info &> /dev/null; then
    echo "✅ Kubernetes cluster is already running"
    kubectl cluster-info
    exit 0
fi

echo ""
echo "No Kubernetes cluster detected. Choose an option:"
echo ""
echo "1. Use Docker Desktop Kubernetes (Recommended - easiest)"
echo "2. Use Minikube"
echo "3. Use Kind"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📦 Docker Desktop Kubernetes Setup:"
        echo "1. Open Docker Desktop"
        echo "2. Go to Settings > Kubernetes"
        echo "3. Enable Kubernetes"
        echo "4. Click 'Apply & Restart'"
        echo "5. Wait for Kubernetes to start"
        echo ""
        echo "After enabling, run this script again or:"
        echo "  kubectl get nodes"
        ;;
    2)
        echo ""
        echo "📦 Installing Minikube..."
        if ! command -v minikube &> /dev/null; then
            echo "Installing minikube..."
            brew install minikube
        fi
        echo "Starting minikube..."
        minikube start
        echo "✅ Minikube started"
        kubectl get nodes
        ;;
    3)
        echo ""
        echo "📦 Installing Kind..."
        if ! command -v kind &> /dev/null; then
            echo "Installing kind..."
            brew install kind
        fi
        echo "Creating kind cluster..."
        kind create cluster --name airbnb-cluster
        echo "✅ Kind cluster created"
        kubectl get nodes
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

