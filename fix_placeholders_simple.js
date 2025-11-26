#!/usr/bin/env node
/**
 * Fix placeholders with simpler, more reliable SVG data URIs
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airbnb_core';
const DB_NAME = 'airbnb_core';

// Create a very simple SVG data URI - minimal and reliable
function createSimpleSVGPlaceholder(propertyName, color) {
  const name = (propertyName || 'Property').substring(0, 15).replace(/[<>]/g, '');
  // Very simple SVG - URL encode the text to avoid issues
  const encodedName = encodeURIComponent(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="${color}"/><text x="400" y="280" font-family="Arial" font-size="72" fill="white" text-anchor="middle" font-weight="bold">🏠</text><text x="400" y="360" font-family="Arial" font-size="36" fill="white" text-anchor="middle" font-weight="600">${name}</text></svg>`;
  
  // Use URL encoding instead of base64 for simpler, more reliable data URIs
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function fixPlaceholders() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const propertyPhotosCollection = db.collection('property_photos');
    const propertiesCollection = db.collection('properties');
    
    // Find all photos with data URIs (to replace with simpler ones) or external URLs
    const placeholderPhotos = await propertyPhotosCollection.find({
      $or: [
        { file_path: { $regex: /^data:image/ } },
        { file_path: { $regex: /^https:\/\// } },
        { file_path: { $regex: /^http:\/\// } }
      ]
    }).toArray();
    
    console.log(`🖼️  Found ${placeholderPhotos.length} placeholder photos to update`);
    
    if (placeholderPhotos.length === 0) {
      console.log('✅ No placeholder URLs to fix!');
      return;
    }
    
    // Get property names
    const propertyIds = [...new Set(placeholderPhotos.map(p => p.property_id))];
    const properties = await propertiesCollection.find({
      _id: { $in: propertyIds.map(id => typeof id === 'string' ? new ObjectId(id) : id) }
    }).toArray();
    
    const propertyMap = {};
    properties.forEach(p => {
      propertyMap[p._id.toString()] = p.name;
    });
    
    // Color palette
    const colors = [
      '#4A90E2', '#50C878', '#FF6B6B', '#FFA07A', '#20B2AA', 
      '#9370DB', '#FFD700', '#FF69B4', '#00CED1', '#32CD32'
    ];
    
    // Replace with simpler SVG data URIs
    let updated = 0;
    for (const photo of placeholderPhotos) {
      try {
        const propId = photo.property_id.toString();
        const propertyName = propertyMap[propId] || 'Property';
        const colorIndex = parseInt(propId.slice(-1), 16) % colors.length;
        const color = colors[colorIndex];
        const dataUri = createSimpleSVGPlaceholder(propertyName, color);
        
        await propertyPhotosCollection.updateOne(
          { _id: photo._id },
          { $set: { file_path: dataUri, updated_at: new Date(), is_placeholder: true } }
        );
        console.log(`  ✅ Updated: ${propertyName}`);
        updated++;
      } catch (err) {
        console.error(`  ❌ Failed: ${err.message}`);
      }
    }
    
    console.log(`\n✅ Updated ${updated} placeholder images with simpler SVG data URIs`);
    console.log('💡 Using URL-encoded SVG (more reliable than base64)');
    
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

