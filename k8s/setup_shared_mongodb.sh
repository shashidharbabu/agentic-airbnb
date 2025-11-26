#!/bin/bash

# Setup Shared MongoDB for Kubernetes Testing
# This script sets up port-forwarding and syncs data

set -e

echo "🔧 Setting up Shared MongoDB for Kubernetes Testing"
echo "===================================================="
echo ""

# Check if port-forwards are already running
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 4000 already in use (host-backend)"
else
    echo "📡 Starting port-forward for Host Backend..."
    kubectl port-forward -n airbnb-system svc/host-backend-service 4000:4000 > /tmp/host-backend-pf.log 2>&1 &
    echo $! > /tmp/host-backend-pf.pid
    echo "✅ Host Backend port-forward started (PID: $(cat /tmp/host-backend-pf.pid))"
fi

if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 5001 already in use (traveller-backend)"
else
    echo "📡 Starting port-forward for Traveler Backend..."
    kubectl port-forward -n airbnb-system svc/traveller-backend-service 5001:5001 > /tmp/traveller-backend-pf.log 2>&1 &
    echo $! > /tmp/traveller-backend-pf.pid
    echo "✅ Traveler Backend port-forward started (PID: $(cat /tmp/traveller-backend-pf.pid))"
fi

if lsof -Pi :27018 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 27018 already in use (mongodb)"
else
    echo "📡 Starting port-forward for MongoDB..."
    kubectl port-forward -n airbnb-system svc/mongodb-service 27018:27017 > /tmp/mongodb-pf.log 2>&1 &
    echo $! > /tmp/mongodb-pf.pid
    echo "✅ MongoDB port-forward started (PID: $(cat /tmp/mongodb-pf.pid))"
    sleep 3
fi

echo ""
echo "🔄 Syncing data from local MongoDB to Kubernetes MongoDB..."
cd "$(dirname "$0")/.."

node -e "
const { MongoClient } = require('mongodb');
(async () => {
  try {
    const local = new MongoClient('mongodb://127.0.0.1:27017/airbnb_core');
    await local.connect();
    const localDb = local.db('airbnb_core');
    
    const k8s = new MongoClient('mongodb://admin:change-me-in-production@localhost:27018/airbnb_core?authSource=admin');
    await k8s.connect();
    const k8sDb = k8s.db('airbnb_core');
    
    // Sync owners
    const localOwners = await localDb.collection('owners').find({}).toArray();
    console.log('Syncing', localOwners.length, 'owners...');
    for (const owner of localOwners) {
      const exists = await k8sDb.collection('owners').findOne({ email: owner.email });
      if (!exists) {
        await k8sDb.collection('owners').insertOne(owner);
        console.log('  ✅ Synced owner:', owner.email);
      }
    }
    
    // Build owner email to k8s ID map
    const k8sOwners = await k8sDb.collection('owners').find({}).toArray();
    const emailToK8sId = {};
    k8sOwners.forEach(o => emailToK8sId[o.email] = o._id);
    
    // Sync properties with correct owner_id
    const localProps = await localDb.collection('properties').find({}).toArray();
    console.log('Syncing', localProps.length, 'properties...');
    for (const prop of localProps) {
      const localOwner = await localDb.collection('owners').findOne({ _id: prop.owner_id });
      if (localOwner && emailToK8sId[localOwner.email]) {
        prop.owner_id = emailToK8sId[localOwner.email];
      }
      const exists = await k8sDb.collection('properties').findOne({ name: prop.name, owner_id: prop.owner_id });
      if (!exists) {
        delete prop._id; // Let MongoDB generate new ID
        await k8sDb.collection('properties').insertOne(prop);
        console.log('  ✅ Synced property:', prop.name);
      }
    }
    
    console.log('✅ Sync complete!');
    console.log('  K8s MongoDB has:');
    console.log('    -', await k8sDb.collection('owners').countDocuments(), 'owners');
    console.log('    -', await k8sDb.collection('properties').countDocuments(), 'properties');
    
    await local.close();
    await k8s.close();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🔗 Access Points:"
echo "  Host Backend: http://localhost:4000"
echo "  Traveler Backend: http://localhost:5001"
echo "  MongoDB: localhost:27018"
echo ""
echo "📝 To stop port-forwards:"
echo "  kill \$(cat /tmp/host-backend-pf.pid) \$(cat /tmp/traveller-backend-pf.pid) \$(cat /tmp/mongodb-pf.pid)"

