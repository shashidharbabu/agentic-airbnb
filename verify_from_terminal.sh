#!/bin/bash
# Quick Terminal Verification Script

echo "🔍 Terminal Verification - Properties & Images"
echo "=============================================="
echo ""

echo "1️⃣  API Health Check:"
curl -s http://localhost:5001/health | jq '.' || echo "❌ API not accessible"
echo ""

echo "2️⃣  Properties Count:"
TOTAL=$(curl -s "http://localhost:5001/api/properties/search?page=1&limit=1" | jq -r '.pagination.total // 0')
echo "   Total Properties: $TOTAL"
echo ""

echo "3️⃣  Properties with Photos:"
curl -s "http://localhost:5001/api/properties/search?page=1&limit=100" | jq '[.properties[] | select(.main_photo != null)] | length' | xargs echo "   Properties with photos:"
echo ""

echo "4️⃣  Sample Properties:"
curl -s "http://localhost:5001/api/properties/search?page=1&limit=5" | jq '.properties[] | {name, location, price: .price_per_night, has_photo: (.main_photo != null)}'
echo ""

echo "5️⃣  MongoDB Direct Check:"
node -e "
const {MongoClient}=require('mongodb');
(async()=>{
  const c=new MongoClient('mongodb://admin:change-me-in-production@localhost:27018/airbnb_core?authSource=admin');
  await c.connect();
  const db=c.db('airbnb_core');
  const props=await db.collection('properties').countDocuments();
  const photos=await db.collection('property_photos').countDocuments();
  const propsWithPhotos=await db.collection('property_photos').distinct('property_id');
  console.log('   Properties in MongoDB:',props);
  console.log('   Photos in MongoDB:',photos);
  console.log('   Properties with photos:',propsWithPhotos.length);
  await c.close();
})();
"
echo ""

echo "✅ Verification complete!"




