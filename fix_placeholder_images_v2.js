#!/usr/bin/env node
/**
 * Script to replace placeholder URLs with a more reliable service
 * Using via.placeholder.com which is very reliable and fast
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airbnb_core';
const DB_NAME = 'airbnb_core';

// Use via.placeholder.com - very reliable placeholder service
function getPlaceholderUrl(propertyId, propertyName) {
  // Create a simple colored placeholder with text
  // Format: https://via.placeholder.com/WIDTHxHEIGHT/COLOR/TEXT_COLOR?text=TEXT
  const seed = propertyId.toString().slice(-6);
  const colors = [
    '4A90E2', '50C878', 'FF6B6B', 'FFA07A', '20B2AA', 
    '9370DB', 'FFD700', 'FF69B4', '00CED1', '32CD32'
  ];
  const color = colors[parseInt(seed, 16) % colors.length];
  const name = propertyName ? propertyName.substring(0, 15) : 'Property';
  return `https://via.placeholder.com/800x600/${color}/FFFFFF?text=${encodeURIComponent(name)}`;
}

async function fixPlaceholderImages() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const propertyPhotosCollection = db.collection('property_photos');
    const propertiesCollection = db.collection('properties');
    
    // Find all photos with placeholder URLs (picsum or unsplash)
    const placeholderPhotos = await propertyPhotosCollection.find({
      $or: [
        { file_path: { $regex: /^https:\/\/source\.unsplash\.com/ } },
        { file_path: { $regex: /^https:\/\/picsum\.photos/ } }
      ]
    }).toArray();
    
    console.log(`🖼️  Found ${placeholderPhotos.length} placeholder photos to update`);
    
    if (placeholderPhotos.length === 0) {
      console.log('✅ No placeholder URLs to fix!');
      return;
    }
    
    // Get property names for better placeholders
    const propertyIds = [...new Set(placeholderPhotos.map(p => p.property_id))];
    const properties = await propertiesCollection.find({
      _id: { $in: propertyIds.map(id => typeof id === 'string' ? new ObjectId(id) : id) }
    }).toArray();
    
    const propertyMap = {};
    properties.forEach(p => {
      propertyMap[p._id.toString()] = p.name;
    });
    
    // Replace with via.placeholder.com URLs
    let updated = 0;
    for (const photo of placeholderPhotos) {
      try {
        const propId = photo.property_id.toString();
        const propertyName = propertyMap[propId] || 'Property';
        const newUrl = getPlaceholderUrl(photo.property_id, propertyName);
        
        await propertyPhotosCollection.updateOne(
          { _id: photo._id },
          { $set: { file_path: newUrl, updated_at: new Date() } }
        );
        console.log(`  ✅ Updated photo for: ${propertyName}`);
        updated++;
      } catch (err) {
        console.error(`  ❌ Failed to update photo ${photo._id}:`, err.message);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updated} placeholder images!`);
    console.log('💡 Using via.placeholder.com for reliable placeholder images');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  fixPlaceholderImages().catch(console.error);
}

module.exports = { fixPlaceholderImages };

