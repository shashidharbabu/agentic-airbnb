#!/usr/bin/env node
/**
 * Script to replace broken Unsplash placeholder URLs with working placeholder images
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airbnb_core';
const DB_NAME = 'airbnb_core';

// Use a reliable placeholder service - picsum.photos with seed for consistency
// Or use via.placeholder.com for simple colored placeholders
function getPlaceholderUrl(propertyId) {
  // Using picsum.photos with a seed based on property ID for consistent images
  const seed = propertyId.toString().slice(-6);
  return `https://picsum.photos/seed/${seed}/800/600`;
}

async function fixPlaceholderImages() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const propertyPhotosCollection = db.collection('property_photos');
    
    // Find all photos with Unsplash URLs
    const unsplashPhotos = await propertyPhotosCollection.find({
      file_path: { $regex: /^https:\/\/source\.unsplash\.com/ }
    }).toArray();
    
    console.log(`🖼️  Found ${unsplashPhotos.length} photos with Unsplash URLs`);
    
    if (unsplashPhotos.length === 0) {
      console.log('✅ No Unsplash URLs to fix!');
      return;
    }
    
    // Replace with picsum.photos URLs
    let updated = 0;
    for (const photo of unsplashPhotos) {
      try {
        const newUrl = getPlaceholderUrl(photo.property_id);
        await propertyPhotosCollection.updateOne(
          { _id: photo._id },
          { $set: { file_path: newUrl, updated_at: new Date() } }
        );
        console.log(`  ✅ Updated photo for property ${photo.property_id.toString().slice(-6)}`);
        updated++;
      } catch (err) {
        console.error(`  ❌ Failed to update photo ${photo._id}:`, err.message);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updated} placeholder images!`);
    console.log('💡 Using picsum.photos for reliable placeholder images');
    
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

