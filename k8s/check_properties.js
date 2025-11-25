const { MongoClient } = require('mongodb');

const CONFIG = {
  MONGODB: 'mongodb://admin:change-me-in-production@localhost:27018/airbnb_core?authSource=admin'
};

async function checkProperties() {
  const client = new MongoClient(CONFIG.MONGODB);
  try {
    await client.connect();
    const db = client.db('airbnb_core');
    
    const props = await db.collection('properties').find({}).toArray();
    console.log(`\n📊 Properties in shared MongoDB: ${props.length}\n`);
    
    props.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   ID: ${p._id}`);
      console.log(`   Owner ID: ${p.owner_id}`);
      console.log(`   Location: ${p.location || 'N/A'}`);
      console.log(`   Price: $${p.price_per_night || 0}/night`);
      console.log(`   Created: ${p.created_at || 'N/A'}`);
      console.log('');
    });
    
    // Check photos for properties
    const photos = await db.collection('property_photos').find({}).toArray();
    const propsWithPhotos = new Set(photos.map(p => p.property_id.toString()));
    const propsWithoutPhotos = props.filter(p => !propsWithPhotos.has(p._id.toString()));
    
    console.log(`\n📸 Photo Summary:`);
    console.log(`   Total photos: ${photos.length}`);
    console.log(`   Properties with photos: ${propsWithPhotos.size}`);
    console.log(`   Properties without photos: ${propsWithoutPhotos.length}`);
    if (propsWithoutPhotos.length > 0) {
      console.log(`\n   Properties without photos:`);
      propsWithoutPhotos.slice(0, 5).forEach(p => {
        console.log(`     - ${p.name}`);
      });
      if (propsWithoutPhotos.length > 5) {
        console.log(`     ... and ${propsWithoutPhotos.length - 5} more`);
      }
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.close();
  }
}

checkProperties();

