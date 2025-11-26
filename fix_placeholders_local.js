#!/usr/bin/env node
/**
 * Fix placeholders by using a local placeholder image file
 * This is the most reliable approach - no external dependencies, no data URI issues
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airbnb_core';
const DB_NAME = 'airbnb_core';

// Use a simple local placeholder path - we'll create the actual file
// For now, use a path that the backend can serve
const PLACEHOLDER_PATH = '/uploads/property-photos/placeholder-house.jpg';

async function fixPlaceholders() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const propertyPhotosCollection = db.collection('property_photos');
    
    // Find all photos with data URIs or external URLs (placeholders)
    const placeholderPhotos = await propertyPhotosCollection.find({
      $or: [
        { file_path: { $regex: /^data:image/ } },
        { file_path: { $regex: /^https:\/\// } },
        { file_path: { $regex: /^http:\/\// } },
        { is_placeholder: true }
      ]
    }).toArray();
    
    console.log(`🖼️  Found ${placeholderPhotos.length} placeholder photos to update`);
    
    if (placeholderPhotos.length === 0) {
      console.log('✅ No placeholder URLs to fix!');
      return;
    }
    
    // For now, let's use a simple approach: use an existing image or create a default
    // Actually, let's check if there are any real images we can use as a default
    const realPhotos = await propertyPhotosCollection.find({
      file_path: { $regex: /^\/uploads\/property-photos\// },
      is_placeholder: { $ne: true }
    }).limit(1).toArray();
    
    let defaultImagePath = PLACEHOLDER_PATH;
    if (realPhotos.length > 0) {
      // Use the first real photo as a template/placeholder
      defaultImagePath = realPhotos[0].file_path;
      console.log(`📸 Using existing image as placeholder: ${defaultImagePath}`);
    } else {
      console.log(`📸 Will use placeholder path: ${defaultImagePath}`);
      console.log('   (You may need to add an actual placeholder image file later)');
    }
    
    // Update all placeholders to use the local path
    let updated = 0;
    for (const photo of placeholderPhotos) {
      try {
        await propertyPhotosCollection.updateOne(
          { _id: photo._id },
          { $set: { file_path: defaultImagePath, updated_at: new Date(), is_placeholder: true } }
        );
        updated++;
      } catch (err) {
        console.error(`  ❌ Failed: ${err.message}`);
      }
    }
    
    console.log(`\n✅ Updated ${updated} placeholder images to use local path`);
    console.log(`💡 Using: ${defaultImagePath}`);
    console.log('⚠️  Note: If placeholder file doesn\'t exist, you may see broken images');
    console.log('   Consider uploading a default placeholder image to that path');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  fixPlaceholders().catch(console.error);
}

module.exports = { fixPlaceholders };

