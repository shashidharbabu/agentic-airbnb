#!/usr/bin/env node
/**
 * MySQL to MongoDB Migration Script
 * Migrates all data from MySQL to MongoDB for testing
 */

// Try to load dotenv, but don't fail if it's not available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, use environment variables directly
}

const mysql = require('mysql2/promise');
const { MongoClient, ObjectId } = require('mongodb');

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10),
  user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_DB || process.env.DB_NAME || 'airbnb_core'
};

const MONGODB_CONFIG = {
  host: process.env.MONGODB_HOST || 'localhost',
  port: process.env.MONGODB_PORT || '27018',
  user: process.env.MONGODB_USER || 'admin',
  password: process.env.MONGODB_PASSWORD || 'change-me-in-production',
  database: process.env.MONGODB_DB || process.env.DB_NAME || 'airbnb_core'
};

function getMongoConnectionString() {
  const { host, port, user, password, database } = MONGODB_CONFIG;
  // Always use authentication if credentials are provided (Kubernetes MongoDB requires auth)
  if (user && password) {
    return `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=admin`;
  }
  // Fallback to no auth only if no credentials provided
  return `mongodb://${host}:${port}/${database}`;
}

async function migrateOwners(mysqlConn, mongoDb) {
  console.log('\n📦 Migrating owners...');
  const [owners] = await mysqlConn.query('SELECT * FROM owners ORDER BY id');
  console.log(`  Found ${owners.length} owners in MySQL`);
  
  const ownersCollection = mongoDb.collection('owners');
  const ownerIdMap = {}; // MySQL ID -> MongoDB ObjectId
  
  for (const owner of owners) {
    // Check if owner already exists by email
    const existing = await ownersCollection.findOne({ email: owner.email });
    if (existing) {
      console.log(`  ⏭️  Owner ${owner.email} already exists, skipping`);
      ownerIdMap[owner.id] = existing._id;
      continue;
    }
    
    const ownerDoc = {
      email: owner.email,
      password_hash: owner.password_hash,
      name: owner.name,
      phone: owner.phone || null,
      location: owner.location || null,
      about: owner.about || null,
      avatar_url: owner.avatar_url || null,
      google_id: owner.google_id || null,
      auth_provider: owner.auth_provider || 'email',
      created_at: owner.created_at || new Date(),
      updated_at: owner.updated_at || new Date()
    };
    
    const result = await ownersCollection.insertOne(ownerDoc);
    ownerIdMap[owner.id] = result.insertedId;
    console.log(`  ✅ Migrated owner: ${owner.email} (${owner.id} -> ${result.insertedId})`);
  }
  
  return ownerIdMap;
}

async function migrateProperties(mysqlConn, mongoDb, ownerIdMap) {
  console.log('\n📦 Migrating properties...');
  const [properties] = await mysqlConn.query('SELECT * FROM properties ORDER BY id');
  console.log(`  Found ${properties.length} properties in MySQL`);
  
  const propertiesCollection = mongoDb.collection('properties');
  const propertyIdMap = {}; // MySQL ID -> MongoDB ObjectId
  
  for (const prop of properties) {
    // Check if property already exists by name and owner
    const mongoOwnerId = ownerIdMap[prop.owner_id];
    if (!mongoOwnerId) {
      console.log(`  ⚠️  Property ${prop.name} has invalid owner_id ${prop.owner_id}, skipping`);
      continue;
    }
    
    const existing = await propertiesCollection.findOne({ 
      name: prop.name,
      owner_id: mongoOwnerId
    });
    if (existing) {
      console.log(`  ⏭️  Property "${prop.name}" already exists, skipping`);
      propertyIdMap[prop.id] = existing._id;
      continue;
    }
    
    const propertyDoc = {
      owner_id: mongoOwnerId,
      name: prop.name,
      description: prop.description || null,
      location: prop.location,
      address: prop.address || null,
      price_per_night: parseFloat(prop.price_per_night) || 0,
      bedrooms: prop.bedrooms || 0,
      bathrooms: prop.bathrooms || 0,
      amenities: prop.amenities ? (typeof prop.amenities === 'string' ? JSON.parse(prop.amenities) : prop.amenities) : [],
      property_type: prop.property_type || null,
      privacy_type: prop.privacy_type || null,
      max_guests: prop.max_guests || null,
      beds: prop.beds || null,
      latitude: prop.latitude ? parseFloat(prop.latitude) : null,
      longitude: prop.longitude ? parseFloat(prop.longitude) : null,
      street: prop.street || null,
      unit: prop.unit || null,
      city: prop.city || null,
      state: prop.state || null,
      zip: prop.zip || null,
      country: prop.country || null,
      highlights: prop.highlights ? (typeof prop.highlights === 'string' ? JSON.parse(prop.highlights) : prop.highlights) : [],
      safety: prop.safety ? (typeof prop.safety === 'string' ? JSON.parse(prop.safety) : prop.safety) : [],
      weekend_premium_percent: prop.weekend_premium_percent ? parseFloat(prop.weekend_premium_percent) : 0,
      discounts: prop.discounts ? (typeof prop.discounts === 'string' ? JSON.parse(prop.discounts) : prop.discounts) : {},
      average_rating: prop.average_rating ? parseFloat(prop.average_rating) : null,
      reviews_count: prop.reviews_count || 0,
      views_last_90d: prop.views_last_90d || 0,
      booking_mode: prop.booking_mode || 'APPROVAL',
      availability_start: prop.availability_start || null,
      availability_end: prop.availability_end || null,
      created_at: prop.created_at || new Date(),
      updated_at: prop.updated_at || new Date()
    };
    
    const result = await propertiesCollection.insertOne(propertyDoc);
    propertyIdMap[prop.id] = result.insertedId;
    console.log(`  ✅ Migrated property: ${prop.name} (${prop.id} -> ${result.insertedId})`);
  }
  
  return propertyIdMap;
}

async function migratePropertyPhotos(mysqlConn, mongoDb, propertyIdMap) {
  console.log('\n📦 Migrating property photos...');
  const [photos] = await mysqlConn.query('SELECT * FROM property_photos ORDER BY id');
  console.log(`  Found ${photos.length} photos in MySQL`);
  
  const photosCollection = mongoDb.collection('property_photos');
  let migrated = 0;
  let skipped = 0;
  
  for (const photo of photos) {
    const mongoPropertyId = propertyIdMap[photo.property_id];
    if (!mongoPropertyId) {
      console.log(`  ⚠️  Photo ${photo.id} has invalid property_id ${photo.property_id}, skipping`);
      skipped++;
      continue;
    }
    
    // Check if photo already exists
    const existing = await photosCollection.findOne({
      property_id: mongoPropertyId,
      file_path: photo.file_path
    });
    if (existing) {
      skipped++;
      continue;
    }
    
    const photoDoc = {
      property_id: mongoPropertyId,
      file_path: photo.file_path,
      created_at: photo.created_at || new Date()
    };
    
    await photosCollection.insertOne(photoDoc);
    migrated++;
    console.log(`  ✅ Migrated photo: ${photo.file_path} for property ${photo.property_id}`);
  }
  
  console.log(`  ✅ Migrated ${migrated} photos, skipped ${skipped}`);
}

async function migrateUsers(mysqlConn, mongoDb) {
  console.log('\n📦 Migrating users (travelers)...');
  const [users] = await mysqlConn.query('SELECT * FROM users WHERE role = "TRAVELER" ORDER BY id');
  console.log(`  Found ${users.length} travelers in MySQL`);
  
  const usersCollection = mongoDb.collection('users');
  const userIdMap = {}; // MySQL ID -> MongoDB ObjectId
  
  for (const user of users) {
    // Check if user already exists by email
    const existing = await usersCollection.findOne({ email: user.email });
    if (existing) {
      console.log(`  ⏭️  User ${user.email} already exists, skipping`);
      userIdMap[user.id] = existing._id;
      continue;
    }
    
    const userDoc = {
      email: user.email,
      password_hash: user.password_hash,
      name: user.name,
      role: user.role || 'TRAVELER',
      created_at: user.created_at || new Date(),
      updated_at: user.updated_at || new Date()
    };
    
    const result = await usersCollection.insertOne(userDoc);
    userIdMap[user.id] = result.insertedId;
    console.log(`  ✅ Migrated user: ${user.email} (${user.id} -> ${result.insertedId})`);
  }
  
  return userIdMap;
}

async function migrateTravelerProfiles(mysqlConn, mongoDb, userIdMap) {
  console.log('\n📦 Migrating traveler profiles...');
  const [profiles] = await mysqlConn.query('SELECT * FROM traveler_profiles ORDER BY traveler_id');
  console.log(`  Found ${profiles.length} profiles in MySQL`);
  
  const profilesCollection = mongoDb.collection('traveler_profiles');
  let migrated = 0;
  
  for (const profile of profiles) {
    const mongoUserId = userIdMap[profile.traveler_id];
    if (!mongoUserId) {
      console.log(`  ⚠️  Profile for traveler_id ${profile.traveler_id} has invalid user, skipping`);
      continue;
    }
    
    // Check if profile already exists
    const existing = await profilesCollection.findOne({ traveler_id: mongoUserId });
    if (existing) {
      console.log(`  ⏭️  Profile for ${profile.traveler_id} already exists, skipping`);
      continue;
    }
    
    const profileDoc = {
      traveler_id: mongoUserId,
      phone: profile.phone || null,
      about: profile.about || null,
      city: profile.city || null,
      country: profile.country || null,
      state_abbr: profile.state_abbr || null,
      languages: profile.languages || null,
      gender: profile.gender || null,
      profile_image_url: profile.profile_image_url || null,
      created_at: profile.created_at || new Date(),
      updated_at: profile.updated_at || new Date()
    };
    
    await profilesCollection.insertOne(profileDoc);
    migrated++;
    console.log(`  ✅ Migrated profile for traveler ${profile.traveler_id}`);
  }
  
  console.log(`  ✅ Migrated ${migrated} profiles`);
}

async function migrateBookings(mysqlConn, mongoDb, propertyIdMap, userIdMap) {
  console.log('\n📦 Migrating bookings...');
  const [bookings] = await mysqlConn.query('SELECT * FROM bookings ORDER BY id');
  console.log(`  Found ${bookings.length} bookings in MySQL`);
  
  const bookingsCollection = mongoDb.collection('bookings');
  let migrated = 0;
  let skipped = 0;
  
  for (const booking of bookings) {
    const mongoPropertyId = propertyIdMap[booking.property_id];
    const mongoTravelerId = userIdMap[booking.traveler_id];
    
    if (!mongoPropertyId || !mongoTravelerId) {
      console.log(`  ⚠️  Booking ${booking.id} has invalid IDs, skipping`);
      skipped++;
      continue;
    }
    
    // Check if booking already exists
    const existing = await bookingsCollection.findOne({
      property_id: mongoPropertyId,
      traveler_id: mongoTravelerId,
      start_date: booking.start_date,
      end_date: booking.end_date
    });
    if (existing) {
      skipped++;
      continue;
    }
    
    const bookingDoc = {
      property_id: mongoPropertyId,
      traveler_id: mongoTravelerId,
      start_date: booking.start_date,
      end_date: booking.end_date,
      guests: booking.guests || 1,
      status: booking.status || 'PENDING',
      total_price: booking.total_price ? parseFloat(booking.total_price) : null,
      created_at: booking.created_at || new Date(),
      updated_at: booking.updated_at || new Date()
    };
    
    await bookingsCollection.insertOne(bookingDoc);
    migrated++;
    console.log(`  ✅ Migrated booking ${booking.id}`);
  }
  
  console.log(`  ✅ Migrated ${migrated} bookings, skipped ${skipped}`);
}

async function migrateFavorites(mysqlConn, mongoDb, propertyIdMap, userIdMap) {
  console.log('\n📦 Migrating favorites...');
  const [favorites] = await mysqlConn.query('SELECT * FROM favorites ORDER BY id');
  console.log(`  Found ${favorites.length} favorites in MySQL`);
  
  const favoritesCollection = mongoDb.collection('favorites');
  let migrated = 0;
  let skipped = 0;
  
  for (const fav of favorites) {
    const mongoPropertyId = propertyIdMap[fav.property_id];
    const mongoTravelerId = userIdMap[fav.traveler_id];
    
    if (!mongoPropertyId || !mongoTravelerId) {
      skipped++;
      continue;
    }
    
    // Check if favorite already exists
    const existing = await favoritesCollection.findOne({
      property_id: mongoPropertyId,
      traveler_id: mongoTravelerId
    });
    if (existing) {
      skipped++;
      continue;
    }
    
    const favoriteDoc = {
      property_id: mongoPropertyId,
      traveler_id: mongoTravelerId,
      created_at: fav.created_at || new Date()
    };
    
    await favoritesCollection.insertOne(favoriteDoc);
    migrated++;
  }
  
  console.log(`  ✅ Migrated ${migrated} favorites, skipped ${skipped}`);
}

async function main() {
  console.log('🚀 Starting MySQL to MongoDB Migration');
  console.log('=====================================\n');
  
  console.log('MySQL Config:', {
    host: MYSQL_CONFIG.host,
    port: MYSQL_CONFIG.port,
    database: MYSQL_CONFIG.database
  });
  
  console.log('MongoDB Config:', {
    host: MONGODB_CONFIG.host,
    port: MONGODB_CONFIG.port,
    database: MONGODB_CONFIG.database
  });
  
  let mysqlConn, mongoClient, mongoDb;
  
  try {
    // Connect to MySQL
    console.log('\n📡 Connecting to MySQL...');
    mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ MySQL connected');
    
    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    const mongoUrl = getMongoConnectionString();
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGODB_CONFIG.database);
    console.log('✅ MongoDB connected');
    
    // Migrate in order (respecting foreign key dependencies)
    const ownerIdMap = await migrateOwners(mysqlConn, mongoDb);
    const propertyIdMap = await migrateProperties(mysqlConn, mongoDb, ownerIdMap);
    await migratePropertyPhotos(mysqlConn, mongoDb, propertyIdMap);
    const userIdMap = await migrateUsers(mysqlConn, mongoDb);
    await migrateTravelerProfiles(mysqlConn, mongoDb, userIdMap);
    await migrateBookings(mysqlConn, mongoDb, propertyIdMap, userIdMap);
    await migrateFavorites(mysqlConn, mongoDb, propertyIdMap, userIdMap);
    
    console.log('\n✅ Migration complete!');
    console.log('\n📊 Summary:');
    console.log(`  Owners: ${Object.keys(ownerIdMap).length}`);
    console.log(`  Properties: ${Object.keys(propertyIdMap).length}`);
    console.log(`  Users: ${Object.keys(userIdMap).length}`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (mysqlConn) await mysqlConn.end();
    if (mongoClient) await mongoClient.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };

