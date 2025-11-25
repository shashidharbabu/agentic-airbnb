#!/usr/bin/env node
/**
 * Sync properties from local MongoDB to Kubernetes MongoDB
 */

const { MongoClient, ObjectId } = require('mongodb');

const LOCAL_MONGO = 'mongodb://127.0.0.1:27017/airbnb_core';
const K8S_MONGO = 'mongodb://admin:change-me-in-production@mongodb-service:27017/airbnb_core?authSource=admin';

async function syncProperties() {
  console.log('🔄 Syncing properties from local MongoDB to Kubernetes MongoDB...\n');
  
  // Connect to local MongoDB
  console.log('1. Connecting to local MongoDB...');
  const localClient = new MongoClient(LOCAL_MONGO);
  await localClient.connect();
  const localDb = localClient.db('airbnb_core');
  console.log('✅ Connected to local MongoDB\n');
  
  // Connect to Kubernetes MongoDB (via port-forward or direct)
  console.log('2. Connecting to Kubernetes MongoDB...');
  console.log('   Note: This requires port-forwarding: kubectl port-forward -n airbnb-system svc/mongodb-service 27018:27017');
  console.log('   Using: mongodb://admin:***@localhost:27018/airbnb_core\n');
  
  // Try k8s connection (might need port-forward)
  let k8sClient;
  let k8sDb;
  
  try {
    // First try direct connection (if running in k8s cluster)
    k8sClient = new MongoClient(K8S_MONGO, {
      serverSelectionTimeoutMS: 5000
    });
    await k8sClient.connect();
    k8sDb = k8sClient.db('airbnb_core');
    console.log('✅ Connected to Kubernetes MongoDB (direct)\n');
  } catch (err) {
    console.log('⚠️  Direct connection failed, trying port-forwarded connection...');
    try {
      const portForwardMongo = 'mongodb://admin:change-me-in-production@localhost:27018/airbnb_core?authSource=admin';
      k8sClient = new MongoClient(portForwardMongo, {
        serverSelectionTimeoutMS: 5000
      });
      await k8sClient.connect();
      k8sDb = k8sClient.db('airbnb_core');
      console.log('✅ Connected to Kubernetes MongoDB (via port-forward)\n');
    } catch (err2) {
      console.error('❌ Failed to connect to Kubernetes MongoDB');
      console.error('   Please run: kubectl port-forward -n airbnb-system svc/mongodb-service 27018:27017');
      await localClient.close();
      process.exit(1);
    }
  }
  
  // Get properties from local
  console.log('3. Fetching properties from local MongoDB...');
  const localProperties = await localDb.collection('properties').find({}).toArray();
  console.log(`   Found ${localProperties.length} properties\n`);
  
  if (localProperties.length === 0) {
    console.log('⚠️  No properties to sync');
    await localClient.close();
    await k8sClient.close();
    return;
  }
  
  // Get owners from local
  console.log('4. Fetching owners from local MongoDB...');
  const localOwners = await localDb.collection('owners').find({}).toArray();
  console.log(`   Found ${localOwners.length} owners\n`);
  
  // Sync owners first
  if (localOwners.length > 0) {
    console.log('5. Syncing owners to Kubernetes MongoDB...');
    for (const owner of localOwners) {
      const existing = await k8sDb.collection('owners').findOne({ email: owner.email });
      if (!existing) {
        await k8sDb.collection('owners').insertOne(owner);
        console.log(`   ✅ Synced owner: ${owner.email}`);
      } else {
        console.log(`   ⏭️  Owner already exists: ${owner.email}`);
      }
    }
    console.log('');
  }
  
  // Sync properties
  console.log('6. Syncing properties to Kubernetes MongoDB...');
  let synced = 0;
  let skipped = 0;
  
  for (const prop of localProperties) {
    // Check if property exists (by name and owner_id)
    const existing = await k8sDb.collection('properties').findOne({
      name: prop.name,
      owner_id: prop.owner_id
    });
    
    if (!existing) {
      await k8sDb.collection('properties').insertOne(prop);
      console.log(`   ✅ Synced property: ${prop.name}`);
      synced++;
    } else {
      console.log(`   ⏭️  Property already exists: ${prop.name}`);
      skipped++;
    }
  }
  
  console.log(`\n✅ Sync complete!`);
  console.log(`   Synced: ${synced}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total in k8s: ${await k8sDb.collection('properties').countDocuments()}`);
  
  // Close connections
  await localClient.close();
  await k8sClient.close();
  console.log('\n✅ Done!');
}

syncProperties().catch(console.error);

