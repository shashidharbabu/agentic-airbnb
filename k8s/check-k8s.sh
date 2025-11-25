#!/bin/bash
# Script to check if Kubernetes is ready

echo "=== Checking Kubernetes Status ==="
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed."
    echo "Docker Desktop should install it automatically."
    echo "If not, install with: brew install kubectl"
    exit 1
fi

# Check if cluster is available
if kubectl cluster-info &> /dev/null; then
    echo "✅ Kubernetes cluster is running!"
    echo ""
    echo "Cluster info:"
    kubectl cluster-info | head -1
    echo ""
    echo "Nodes:"
    kubectl get nodes
    echo ""
    echo "✅ Ready to deploy!"
    echo ""
    echo "Next step: Run ./deploy.sh to deploy all services"
    exit 0
else
    echo "⏳ Kubernetes is not ready yet."
    echo ""
    echo "Please ensure:"
    echo "  1. Docker Desktop is open"
    echo "  2. Kubernetes is enabled in Settings → Kubernetes"
    echo "  3. Wait for the green indicator showing Kubernetes is running"
    echo ""
    echo "Then run this script again: ./check-k8s.sh"
    exit 1
fi

