#!/usr/bin/env node
/**
 * Script to create SVG data URI placeholders for properties without images
 * This works offline and doesn't require external services
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airbnb_core';
const DB_NAME = 'airbnb_core';

// Create an SVG data URI placeholder
function createSVGPlaceholder(propertyName, color) {
  const name = propertyName ? propertyName.substring(0, 20) : 'Property';
  const svg = `
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color}dd;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#grad)"/>
  <text x="400" y="280" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">🏠</text>
  <text x="400" y="340" font-family="Arial, sans-serif" font-size="32" font-weight="600" fill="white" text-anchor="middle">${name}</text>
</svg>`.trim();
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function fixPlaceholderImages() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const propertyPhotosCollection = db.collection('property_photos');
    const propertiesCollection = db.collection('properties');
    
    // Find all photos with placeholder URLs (any external URL that's not a local upload)
    const placeholderPhotos = await propertyPhotosCollection.find({
      $or: [
        { file_path: { $regex: /^https:\/\// } },
        { file_path: { $regex: /^http:\/\// } }
      ]
    }).toArray();
    
    console.log(`🖼️  Found ${placeholderPhotos.length} external placeholder photos to update`);
    
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
    
    // Color palette for placeholders
    const colors = [
      '#4A90E2', '#50C878', '#FF6B6B', '#FFA07A', '#20B2AA', 
      '#9370DB', '#FFD700', '#FF69B4', '#00CED1', '#32CD32'
    ];
    
    // Replace with SVG data URI placeholders
    let updated = 0;
    for (const photo of placeholderPhotos) {
      try {
        const propId = photo.property_id.toString();
        const propertyName = propertyMap[propId] || 'Property';
        const colorIndex = parseInt(propId.slice(-1), 16) % colors.length;
        const color = colors[colorIndex];
        const dataUri = createSVGPlaceholder(propertyName, color);
        
        await propertyPhotosCollection.updateOne(
          { _id: photo._id },
          { $set: { file_path: dataUri, updated_at: new Date(), is_placeholder: true } }
        );
        console.log(`  ✅ Updated photo for: ${propertyName}`);
        updated++;
      } catch (err) {
        console.error(`  ❌ Failed to update photo ${photo._id}:`, err.message);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updated} placeholder images!`);
    console.log('💡 Using SVG data URIs - works offline, no external dependencies');
    
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

