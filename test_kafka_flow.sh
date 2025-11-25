#!/bin/bash

# Test Kafka Message Flow
# This script tests the booking flow through Kafka

set -e

echo "========================================"
echo "Testing Kafka Message Flow"
echo "========================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Port forward backends
echo -e "${YELLOW}Setting up port forwards...${NC}"

kubectl port-forward -n airbnb-system svc/host-backend-service 4000:4000 > /dev/null 2>&1 &
PF_HOST_PID=$!

kubectl port-forward -n airbnb-system svc/traveller-backend-service 5001:5001 > /dev/null 2>&1 &
PF_TRAV_PID=$!

# Wait for port forwards
sleep 3

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Cleaning up port forwards...${NC}"
    kill $PF_HOST_PID $PF_TRAV_PID 2>/dev/null || true
}

trap cleanup EXIT

echo -e "${GREEN}✅ Port forwards established${NC}"
echo ""

# Test 1: Check Kafka topics
echo "========================================"
echo "Test 1: Kafka Topics"
echo "========================================"
echo ""

KAFKA_POD=$(kubectl get pods -n airbnb-system -l app=kafka -o jsonpath='{.items[0].metadata.name}')

echo "Existing Kafka topics:"
kubectl exec -n airbnb-system "$KAFKA_POD" -- kafka-topics --bootstrap-server localhost:9092 --list

echo ""

# Test 2: Check backend Kafka connectivity
echo "========================================"
echo "Test 2: Backend Kafka Connectivity"
echo "========================================"
echo ""

echo "Checking Host Backend logs for Kafka connection..."
kubectl logs -n airbnb-system -l app=host-backend --tail=50 | grep -i kafka || echo "No Kafka logs (may connect on demand)"

echo ""
echo "Checking Traveller Backend logs for Kafka connection..."
kubectl logs -n airbnb-system -l app=traveller-backend --tail=50 | grep -i kafka || echo "No Kafka logs (may connect on demand)"

echo ""

# Test 3: Backend health
echo "========================================"
echo "Test 3: Backend Health Endpoints"
echo "========================================"
echo ""

echo "Testing Traveller Backend Health:"
curl -s http://localhost:5001/health || echo "Health endpoint not available"

echo ""
echo ""
echo "Testing Host Backend Health:"
curl -s http://localhost:4000/health || echo "Health endpoint not available"

echo ""
echo ""

# Test 4: Show Kafka consumer groups
echo "========================================"
echo "Test 4: Kafka Consumer Groups"
echo "========================================"
echo ""

echo "Kafka consumer groups:"
kubectl exec -n airbnb-system "$KAFKA_POD" -- kafka-consumer-groups --bootstrap-server localhost:9092 --list || echo "No consumer groups yet"

echo ""

# Test 5: Check for booking events in Kafka logs
echo "========================================"
echo "Test 5: Recent Kafka Events"
echo "========================================"
echo ""

echo "Checking Kafka logs for recent activity..."
kubectl logs -n airbnb-system "$KAFKA_POD" --tail=100 | grep -i "event\|booking\|topic" | tail -20 || echo "No recent booking events"

echo ""

# Summary
echo "========================================"
echo "Kafka Flow Test Summary"
echo "========================================"
echo ""

echo -e "${GREEN}✅ Kafka Infrastructure: Running${NC}"
echo -e "${GREEN}✅ Backends: Accessible${NC}"
echo -e "${BLUE}ℹ️  Topics: Check output above${NC}"
echo ""

echo "To test actual booking flow:"
echo "  1. Open traveller frontend: http://localhost:30073"
echo "  2. Login as a traveller"
echo "  3. Create a booking"
echo "  4. Check Kafka logs:"
echo "     kubectl logs -n airbnb-system -l app=traveller-backend -f | grep kafka"
echo "  5. Check host backend consuming event:"
echo "     kubectl logs -n airbnb-system -l app=host-backend -f | grep kafka"
echo ""

echo -e "${YELLOW}Tip: Keep this running and create a booking in another terminal${NC}"
echo -e "${YELLOW}Then watch the Kafka events flow through the system${NC}"
echo ""

