#!/usr/bin/env node
/**
 * MongoDB Data Verification Script
 * Verifies all collections and data integrity after operations
 */

const { MongoClient } = require('mongodb');

const CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '27017',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'change-me-in-production',
  database: process.env.DB_NAME || 'airbnb_core'
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function verifyMongoDB() {
  logSection('MongoDB Data Verification');
  
  const connectionString = `mongodb://${CONFIG.user}:${CONFIG.password}@${CONFIG.host}:${CONFIG.port}/${CONFIG.database}?authSource=admin`;
  
  let client;
  try {
    log('Connecting to MongoDB...', 'blue');
    client = new MongoClient(connectionString);
    await client.connect();
    log('✅ Connected to MongoDB', 'green');
    
    const db = client.db(CONFIG.database);
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    log(`\nFound ${collections.length} collection(s):`, 'blue');
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      
      log(`\n📊 Collection: ${collectionName}`, 'yellow');
      log(`   Documents: ${count}`, count > 0 ? 'green' : 'yellow');
      
      if (count > 0) {
        // Get sample documents
        const samples = await collection.find().limit(3).toArray();
        log(`   Sample documents:`, 'blue');
        
        samples.forEach((doc, index) => {
          log(`   [${index + 1}] ID: ${doc._id}`, 'blue');
          
          // Show key fields based on collection
          if (collectionName === 'owners') {
            log(`       Email: ${doc.email || 'N/A'}, Name: ${doc.name || 'N/A'}`, 'blue');
          } else if (collectionName === 'users') {
            log(`       Email: ${doc.email || 'N/A'}, Name: ${doc.name || 'N/A'}`, 'blue');
          } else if (collectionName === 'properties') {
            log(`       Name: ${doc.name || 'N/A'}, Location: ${doc.location || 'N/A'}`, 'blue');
          } else if (collectionName === 'bookings') {
            log(`       Property ID: ${doc.property_id || 'N/A'}, Status: ${doc.status || 'N/A'}`, 'blue');
          } else if (collectionName === 'favorites') {
            log(`       Property ID: ${doc.property_id || 'N/A'}, Traveler ID: ${doc.traveler_id || 'N/A'}`, 'blue');
          } else if (collectionName === 'sessions') {
            log(`       Session ID: ${doc._id}`, 'blue');
          } else if (collectionName === 'traveler_profiles') {
            log(`       Traveler ID: ${doc.traveler_id || 'N/A'}, City: ${doc.city || 'N/A'}`, 'blue');
          }
        });
        
        // Collection-specific statistics
        if (collectionName === 'bookings') {
          const statusCounts = await collection.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ]).toArray();
          log(`   Status breakdown:`, 'blue');
          statusCounts.forEach(stat => {
            log(`     ${stat._id || 'N/A'}: ${stat.count}`, 'blue');
          });
        }
        
        if (collectionName === 'properties') {
          const cityCounts = await collection.aggregate([
            { $group: { _id: '$city', count: { $sum: 1 } } }
          ]).toArray();
          log(`   Cities:`, 'blue');
          cityCounts.forEach(stat => {
            log(`     ${stat._id || 'N/A'}: ${stat.count}`, 'blue');
          });
        }
      }
    }
    
    // Verify relationships
    logSection('Data Relationship Verification');
    
    // Check bookings -> properties relationship
    const bookings = await db.collection('bookings').find().toArray();
    const properties = await db.collection('properties').find().toArray();
    const propertyIds = new Set(properties.map(p => p._id.toString()));
    
    let validBookings = 0;
    let invalidBookings = 0;
    
    for (const booking of bookings) {
      if (booking.property_id && propertyIds.has(booking.property_id.toString())) {
        validBookings++;
      } else {
        invalidBookings++;
        log(`⚠️  Booking ${booking._id} references invalid property_id: ${booking.property_id}`, 'yellow');
      }
    }
    
    if (bookings.length > 0) {
      log(`\nBookings → Properties: ${validBookings}/${bookings.length} valid`, validBookings === bookings.length ? 'green' : 'yellow');
    }
    
    // Check favorites -> properties relationship
    const favorites = await db.collection('favorites').find().toArray();
    let validFavorites = 0;
    let invalidFavorites = 0;
    
    for (const favorite of favorites) {
      if (favorite.property_id && propertyIds.has(favorite.property_id.toString())) {
        validFavorites++;
      } else {
        invalidFavorites++;
        log(`⚠️  Favorite ${favorite._id} references invalid property_id: ${favorite.property_id}`, 'yellow');
      }
    }
    
    if (favorites.length > 0) {
      log(`Favorites → Properties: ${validFavorites}/${favorites.length} valid`, validFavorites === favorites.length ? 'green' : 'yellow');
    }
    
    // Check bookings -> users relationship
    const users = await db.collection('users').find().toArray();
    const userIds = new Set(users.map(u => u._id.toString()));
    
    let validTravelerBookings = 0;
    let invalidTravelerBookings = 0;
    
    for (const booking of bookings) {
      if (booking.traveler_id && userIds.has(booking.traveler_id.toString())) {
        validTravelerBookings++;
      } else {
        invalidTravelerBookings++;
        log(`⚠️  Booking ${booking._id} references invalid traveler_id: ${booking.traveler_id}`, 'yellow');
      }
    }
    
    if (bookings.length > 0) {
      log(`Bookings → Users: ${validTravelerBookings}/${bookings.length} valid`, validTravelerBookings === bookings.length ? 'green' : 'yellow');
    }
    
    // Check properties -> owners relationship
    const owners = await db.collection('owners').find().toArray();
    const ownerIds = new Set(owners.map(o => o._id.toString()));
    
    let validProperties = 0;
    let invalidProperties = 0;
    
    for (const property of properties) {
      if (property.owner_id && ownerIds.has(property.owner_id.toString())) {
        validProperties++;
      } else {
        invalidProperties++;
        log(`⚠️  Property ${property._id} references invalid owner_id: ${property.owner_id}`, 'yellow');
      }
    }
    
    if (properties.length > 0) {
      log(`Properties → Owners: ${validProperties}/${properties.length} valid`, validProperties === properties.length ? 'green' : 'yellow');
    }
    
    logSection('Verification Complete');
    log('✅ MongoDB verification completed!', 'green');
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      log('\nMongoDB connection closed', 'blue');
    }
  }
}

// Run verification
if (require.main === module) {
  verifyMongoDB().catch(console.error);
}

module.exports = { verifyMongoDB };

