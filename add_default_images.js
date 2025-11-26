#!/usr/bin/env node
/**
 * Script to add default placeholder images for properties without photos
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airbnb_core';
const DB_NAME = 'airbnb_core';

// Default placeholder image - using a simple house icon as data URI
// Or we can use a placeholder service URL
const DEFAULT_IMAGE_PATH = '/uploads/property-photos/default-placeholder.jpg';

// Alternative: Use a placeholder service
const PLACEHOLDER_SERVICE_URL = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop';

async function addDefaultImages() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const propertiesCollection = db.collection('properties');
    const propertyPhotosCollection = db.collection('property_photos');
    
    // Get all properties
    const properties = await propertiesCollection.find().toArray();
    console.log(`📋 Found ${properties.length} properties`);
    
    // Get all existing photos
    const existingPhotos = await propertyPhotosCollection.find().toArray();
    const photoMap = {};
    existingPhotos.forEach(photo => {
      const propId = photo.property_id.toString();
      if (!photoMap[propId]) photoMap[propId] = [];
      photoMap[propId].push(photo);
    });
    
    // Find properties without photos
    const propertiesWithoutPhotos = properties.filter(prop => {
      const propId = prop._id.toString();
      return !photoMap[propId] || photoMap[propId].length === 0;
    });
    
    console.log(`🖼️  Found ${propertiesWithoutPhotos.length} properties without photos`);
    
    if (propertiesWithoutPhotos.length === 0) {
      console.log('✅ All properties already have photos!');
      return;
    }
    
    // Add placeholder images using a placeholder service URL
    // We'll store the URL in the database, and the frontend can use it directly
    let added = 0;
    for (const property of propertiesWithoutPhotos) {
      try {
        // Use a placeholder service that provides house images
        // Using Unsplash Source API for consistent placeholder images
        const placeholderUrl = `https://source.unsplash.com/800x600/?house,home,apartment&sig=${property._id.toString().slice(-6)}`;
        
        // Store as a URL path that the frontend can use
        // The frontend will handle URLs starting with http/https
        await propertyPhotosCollection.insertOne({
          property_id: property._id,
          file_path: placeholderUrl, // Store the full URL
          is_placeholder: true,
          created_at: new Date()
        });
        
        console.log(`  ✅ Added placeholder for: ${property.name}`);
        added++;
      } catch (err) {
        console.error(`  ❌ Failed to add placeholder for ${property.name}:`, err.message);
      }
    }
    
    console.log(`\n✅ Successfully added ${added} placeholder images!`);
    console.log('💡 Note: These are placeholder URLs from Unsplash. For production, upload actual property photos.');
    
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
  addDefaultImages().catch(console.error);
}

module.exports = { addDefaultImages };

