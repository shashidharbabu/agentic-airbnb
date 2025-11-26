#!/bin/bash

# Rebuild and Deploy Both Backends to Kubernetes
# This script rebuilds Docker images and redeploys both backends

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔨 Rebuilding and Deploying Backends to Kubernetes"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Build Host Backend Image
echo -e "${BLUE}📦 Building Host Backend Docker image...${NC}"
cd "$PROJECT_ROOT/backend/host"
docker build -t airbnb-host-backend:latest .
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Host Backend image built successfully${NC}"
else
    echo -e "${YELLOW}❌ Host Backend build failed${NC}"
    exit 1
fi
echo ""

# 2. Build Traveler Backend Image
echo -e "${BLUE}📦 Building Traveler Backend Docker image...${NC}"
cd "$PROJECT_ROOT/backend/traveller"
docker build -t airbnb-traveller-backend:latest .
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Traveler Backend image built successfully${NC}"
else
    echo -e "${YELLOW}❌ Traveler Backend build failed${NC}"
    exit 1
fi
echo ""

# 3. Restart Host Backend Deployment
echo -e "${BLUE}🚀 Restarting Host Backend deployment...${NC}"
kubectl rollout restart deployment/host-backend -n airbnb-system
kubectl rollout status deployment/host-backend -n airbnb-system --timeout=120s
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Host Backend restarted successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Host Backend restart had issues${NC}"
fi
echo ""

# 4. Restart Traveler Backend Deployment
echo -e "${BLUE}🚀 Restarting Traveler Backend deployment...${NC}"
kubectl rollout restart deployment/traveller-backend -n airbnb-system
kubectl rollout status deployment/traveller-backend -n airbnb-system --timeout=120s
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Traveler Backend restarted successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Traveler Backend restart had issues${NC}"
fi
echo ""

# 5. Wait a bit for pods to be ready
echo -e "${BLUE}⏳ Waiting for pods to be ready...${NC}"
sleep 10

# 6. Check pod status
echo -e "${BLUE}📊 Pod Status:${NC}"
kubectl get pods -n airbnb-system -l app=host-backend
kubectl get pods -n airbnb-system -l app=traveller-backend
echo ""

# 7. Check logs for MongoDB connection
echo -e "${BLUE}🔍 Checking MongoDB connections...${NC}"
echo "Host Backend:"
kubectl logs -n airbnb-system -l app=host-backend --tail=5 | grep -E "MongoDB|Session" || echo "  (No MongoDB logs yet)"
echo ""
echo "Traveler Backend:"
kubectl logs -n airbnb-system -l app=traveller-backend --tail=5 | grep -E "MongoDB|connected" || echo "  (No MongoDB logs yet)"
echo ""

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🔗 Access Points:"
echo "  Host Backend: kubectl port-forward -n airbnb-system svc/host-backend-service 4000:4000"
echo "  Traveler Backend: kubectl port-forward -n airbnb-system svc/traveller-backend-service 5001:5001"
echo "  MongoDB: kubectl port-forward -n airbnb-system svc/mongodb-service 27018:27017"
echo ""

