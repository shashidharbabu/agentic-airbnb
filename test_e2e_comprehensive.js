#!/usr/bin/env node
/**
 * Comprehensive End-to-End Test Suite for Agentic Airbnb
 * Tests all functionality including MongoDB data verification
 */

const axios = require('axios');
const { MongoClient } = require('mongodb');

// Configuration
const CONFIG = {
  HOST_BACKEND: 'http://localhost:4000',
  TRAVELER_BACKEND: 'http://localhost:5001',
  AI_AGENT: 'http://localhost:8000',
  MONGODB: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '27017',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'change-me-in-production',
    database: process.env.DB_NAME || 'airbnb_core'
  }
};

// Test state
const testState = {
  hostCookies: null,
  travelerCookies: null,
  hostId: null,
  travelerId: null,
  propertyId: null,
  bookingId: null,
  mongoClient: null,
  mongoDb: null
};

// Colors for console output
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

function logTest(testName) {
  log(`\n🧪 Testing: ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'yellow');
}

// MongoDB connection
async function connectMongoDB() {
  try {
    // For local MongoDB without auth (common in development), use simpler connection string
    let connectionString;
    if (CONFIG.MONGODB.host === 'localhost' || CONFIG.MONGODB.host === '127.0.0.1') {
      connectionString = `mongodb://127.0.0.1:${CONFIG.MONGODB.port}/${CONFIG.MONGODB.database}`;
    } else {
      // For remote MongoDB with auth
      connectionString = `mongodb://${CONFIG.MONGODB.user}:${CONFIG.MONGODB.password}@${CONFIG.MONGODB.host}:${CONFIG.MONGODB.port}/${CONFIG.MONGODB.database}?authSource=admin`;
    }
    testState.mongoClient = new MongoClient(connectionString);
    await testState.mongoClient.connect();
    testState.mongoDb = testState.mongoClient.db(CONFIG.MONGODB.database);
    logSuccess('MongoDB connected');
    return true;
  } catch (error) {
    logError(`MongoDB connection failed: ${error.message}`);
    logInfo('Continuing tests without MongoDB verification...');
    return false;
  }
}

async function verifyMongoCollection(collectionName, description) {
  if (!testState.mongoDb) return;
  
  try {
    const collection = testState.mongoDb.collection(collectionName);
    const count = await collection.countDocuments();
    const sample = await collection.findOne();
    
    logInfo(`${description}: ${count} document(s)`);
    if (sample) {
      logInfo(`Sample document ID: ${sample._id}`);
    }
    return { count, sample };
  } catch (error) {
    logError(`Error verifying ${collectionName}: ${error.message}`);
    return null;
  }
}

// Helper: Make HTTP request with cookies
async function request(method, url, data = null, cookies = null) {
  const config = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
    validateStatus: () => true
  };
  
  if (cookies) {
    config.headers['Cookie'] = cookies;
  }
  
  if (data) {
    config.data = data;
  }
  
  const response = await axios(config);
  return response;
}

// Test: Service Health Checks
async function testHealthChecks() {
  logTest('Service Health Checks');
  
  const services = [
    { name: 'Host Backend', url: `${CONFIG.HOST_BACKEND}/health` },
    { name: 'Traveler Backend', url: `${CONFIG.TRAVELER_BACKEND}/health` },
    { name: 'AI Agent', url: `${CONFIG.AI_AGENT}/health` }
  ];
  
  for (const service of services) {
    try {
      const response = await request('GET', service.url);
      if (response.status === 200) {
        logSuccess(`${service.name} is healthy`);
      } else {
        logError(`${service.name} returned status ${response.status}`);
      }
    } catch (error) {
      logError(`${service.name} is not reachable: ${error.message}`);
    }
  }
}

// Test: Host Authentication
async function testHostAuth() {
  logTest('Host Authentication');
  
  const timestamp = Date.now();
  const hostEmail = `host_${timestamp}@test.com`;
  const hostPassword = 'TestPassword123!';
  const hostName = `Test Host ${timestamp}`;
  const hostPhone = `+1${timestamp.toString().slice(-10)}`; // Use timestamp for unique phone
  
  // Signup
  logInfo('Testing host signup...');
  const signupResponse = await request('POST', `${CONFIG.HOST_BACKEND}/auth/signup`, {
    email: hostEmail,
    password: hostPassword,
    name: hostName,
    phone: hostPhone,
    location: 'San Francisco, CA'
  });
  
  if (signupResponse.status === 201 || signupResponse.status === 200) {
    logSuccess('Host signup successful');
    testState.hostId = signupResponse.data.owner?.id || signupResponse.data.id;
    
    // Extract cookies
    const setCookieHeaders = signupResponse.headers['set-cookie'];
    if (setCookieHeaders) {
      testState.hostCookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
    }
  } else {
    logError(`Host signup failed: ${signupResponse.status} - ${JSON.stringify(signupResponse.data)}`);
    return false;
  }
  
  // Verify in MongoDB
  await verifyMongoCollection('owners', 'Host owners collection');
  
  // Login
  logInfo('Testing host login...');
  const loginResponse = await request('POST', `${CONFIG.HOST_BACKEND}/auth/login`, {
    email: hostEmail,
    password: hostPassword
  }, testState.hostCookies);
  
  if (loginResponse.status === 200) {
    logSuccess('Host login successful');
    // Update cookies
    const setCookieHeaders = loginResponse.headers['set-cookie'];
    if (setCookieHeaders) {
      testState.hostCookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
    }
  } else {
    logError(`Host login failed: ${loginResponse.status}`);
    return false;
  }
  
  // Verify session in MongoDB
  await verifyMongoCollection('sessions', 'Sessions collection');
  
  return true;
}

// Test: Traveler Authentication
async function testTravelerAuth() {
  logTest('Traveler Authentication');
  
  const timestamp = Date.now();
  const travelerEmail = `traveler_${timestamp}@test.com`;
  const travelerPassword = 'TestPassword123!';
  const travelerName = `Test Traveler ${timestamp}`;
  
  // Signup
  logInfo('Testing traveler signup...');
  const signupResponse = await request('POST', `${CONFIG.TRAVELER_BACKEND}/api/auth/signup`, {
    email: travelerEmail,
    password: travelerPassword,
    name: travelerName
  });
  
  if (signupResponse.status === 201 || signupResponse.status === 200) {
    logSuccess('Traveler signup successful');
    testState.travelerId = signupResponse.data.user?.id || signupResponse.data.id;
    
    // Extract cookies
    const setCookieHeaders = signupResponse.headers['set-cookie'];
    if (setCookieHeaders) {
      testState.travelerCookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
    }
  } else {
    logError(`Traveler signup failed: ${signupResponse.status} - ${JSON.stringify(signupResponse.data)}`);
    return false;
  }
  
  // Verify in MongoDB
  await verifyMongoCollection('users', 'Traveler users collection');
  
  // Login
  logInfo('Testing traveler login...');
  const loginResponse = await request('POST', `${CONFIG.TRAVELER_BACKEND}/api/auth/login`, {
    email: travelerEmail,
    password: travelerPassword
  }, testState.travelerCookies);
  
  if (loginResponse.status === 200) {
    logSuccess('Traveler login successful');
    // Update cookies
    const setCookieHeaders = loginResponse.headers['set-cookie'];
    if (setCookieHeaders) {
      testState.travelerCookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
    }
  } else {
    logError(`Traveler login failed: ${loginResponse.status}`);
    return false;
  }
  
  return true;
}

// Test: Property Creation
async function testPropertyCreation() {
  logTest('Property Creation');
  
  if (!testState.hostCookies) {
    logError('Host not authenticated. Skipping property creation.');
    return false;
  }
  
  const property = {
    name: 'Beautiful Test Property',
    description: 'A wonderful test property for end-to-end testing',
    location: 'San Francisco, CA',
    address: '123 Test Street',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    price_per_night: 150,
    bedrooms: 2,
    bathrooms: 1,
    max_guests: 4,
    amenities: ['WiFi', 'Kitchen', 'Parking']
  };
  
  logInfo('Creating property listing...');
  const response = await request('POST', `${CONFIG.HOST_BACKEND}/properties`, property, testState.hostCookies);
  
  if (response.status === 201 || response.status === 200) {
    logSuccess('Property created successfully');
    testState.propertyId = response.data.property?.id || response.data.id;
    logInfo(`Property ID: ${testState.propertyId}`);
    
    // Verify in MongoDB
    await verifyMongoCollection('properties', 'Properties collection');
    
    return true;
  } else {
    logError(`Property creation failed: ${response.status} - ${JSON.stringify(response.data)}`);
    return false;
  }
}

// Test: Property Search
async function testPropertySearch() {
  logTest('Property Search');
  
  // Search all properties
  logInfo('Searching all properties...');
  const allResponse = await request('GET', `${CONFIG.TRAVELER_BACKEND}/api/properties/search`);
  
  if (allResponse.status === 200) {
    const properties = allResponse.data.properties || allResponse.data;
    logSuccess(`Found ${properties.length} properties`);
  } else {
    logError(`Property search failed: ${allResponse.status}`);
  }
  
  // Search with filters
  logInfo('Searching with filters (city: San Francisco)...');
  const filteredResponse = await request('GET', `${CONFIG.TRAVELER_BACKEND}/api/properties/search?city=San Francisco`);
  
  if (filteredResponse.status === 200) {
    const properties = filteredResponse.data.properties || filteredResponse.data;
    logSuccess(`Found ${properties.length} properties in San Francisco`);
  } else {
    logError(`Filtered search failed: ${filteredResponse.status}`);
  }
  
  // Get property details
  if (testState.propertyId) {
    logInfo(`Getting property details for ID: ${testState.propertyId}`);
    const detailsResponse = await request('GET', `${CONFIG.TRAVELER_BACKEND}/api/properties/${testState.propertyId}`);
    
    if (detailsResponse.status === 200) {
      logSuccess('Property details retrieved');
      logInfo(`Property: ${detailsResponse.data.property?.name || detailsResponse.data.name}`);
    } else {
      logError(`Property details failed: ${detailsResponse.status}`);
    }
  }
  
  return true;
}

// Test: Booking Creation
async function testBookingCreation() {
  logTest('Booking Creation');
  
  if (!testState.travelerCookies || !testState.propertyId) {
    logError('Traveler not authenticated or property not created. Skipping booking creation.');
    return false;
  }
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 3);
  
  const booking = {
    property_id: testState.propertyId,
    start_date: tomorrow.toISOString().split('T')[0],
    end_date: dayAfter.toISOString().split('T')[0],
    guests: 2,
    special_requests: 'Test booking for E2E testing'
  };
  
  logInfo('Creating booking...');
  const response = await request('POST', `${CONFIG.TRAVELER_BACKEND}/api/bookings`, booking, testState.travelerCookies);
  
  if (response.status === 201 || response.status === 200) {
    logSuccess('Booking created successfully');
    testState.bookingId = response.data.booking?.id || response.data.id;
    logInfo(`Booking ID: ${testState.bookingId}`);
    logInfo(`Booking Status: ${response.data.booking?.status || response.data.status}`);
    
    // Verify in MongoDB
    await verifyMongoCollection('bookings', 'Bookings collection');
    
    return true;
  } else {
    logError(`Booking creation failed: ${response.status} - ${JSON.stringify(response.data)}`);
    return false;
  }
}

// Test: Booking Management (Host)
async function testBookingManagement() {
  logTest('Booking Management (Host)');
  
  if (!testState.hostCookies) {
    logError('Host not authenticated. Skipping booking management.');
    return false;
  }
  
  // Get all bookings
  logInfo('Fetching all bookings...');
  const allBookingsResponse = await request('GET', `${CONFIG.HOST_BACKEND}/bookings`, null, testState.hostCookies);
  
  if (allBookingsResponse.status === 200) {
    const bookings = allBookingsResponse.data.bookings || allBookingsResponse.data;
    logSuccess(`Found ${Array.isArray(bookings) ? bookings.length : 0} bookings`);
  } else {
    logError(`Failed to fetch bookings: ${allBookingsResponse.status}`);
  }
  
  // Accept booking if we have one
  if (testState.bookingId) {
    logInfo(`Accepting booking ${testState.bookingId}...`);
    const acceptResponse = await request('PUT', `${CONFIG.HOST_BACKEND}/bookings/${testState.bookingId}/accept`, null, testState.hostCookies);
    
    if (acceptResponse.status === 200) {
      logSuccess('Booking accepted successfully');
      
      // Verify booking status in MongoDB
      if (testState.mongoDb) {
        const booking = await testState.mongoDb.collection('bookings').findOne({ _id: testState.bookingId });
        if (booking) {
          logInfo(`MongoDB booking status: ${booking.status}`);
        }
      }
    } else {
      logError(`Booking acceptance failed: ${acceptResponse.status} - ${JSON.stringify(acceptResponse.data)}`);
    }
  }
  
  return true;
}

// Test: Favorites
async function testFavorites() {
  logTest('Favorites Functionality');
  
  if (!testState.travelerCookies || !testState.propertyId) {
    logError('Traveler not authenticated or property not available. Skipping favorites test.');
    return false;
  }
  
  // Add to favorites
  logInfo(`Adding property ${testState.propertyId} to favorites...`);
  const addResponse = await request('POST', `${CONFIG.TRAVELER_BACKEND}/api/favorites`, {
    property_id: testState.propertyId
  }, testState.travelerCookies);
  
  if (addResponse.status === 201 || addResponse.status === 200) {
    logSuccess('Property added to favorites');
    
    // Verify in MongoDB
    await verifyMongoCollection('favorites', 'Favorites collection');
  } else {
    logError(`Add to favorites failed: ${addResponse.status}`);
  }
  
  // Get favorites
  logInfo('Fetching favorites...');
  const getResponse = await request('GET', `${CONFIG.TRAVELER_BACKEND}/api/favorites`, null, testState.travelerCookies);
  
  if (getResponse.status === 200) {
    const favorites = getResponse.data.favorites || getResponse.data;
    logSuccess(`Found ${Array.isArray(favorites) ? favorites.length : 0} favorites`);
  } else {
    logError(`Get favorites failed: ${getResponse.status}`);
  }
  
  return true;
}

// Test: AI Agent Conversations
async function testAIAgent() {
  logTest('AI Agent Conversations');
  
  if (!testState.travelerId || !testState.bookingId) {
    logInfo('No booking available. Testing AI agent without booking context...');
  }
  
  const testQueries = [
    'Hello! Can you help me plan my trip?',
    'What activities do you recommend?',
    'What restaurants should I try?',
    'What should I pack for my trip?'
  ];
  
  for (const query of testQueries) {
    logInfo(`Testing query: "${query}"`);
    
    const requestData = {
      message: query,
      traveler_id: testState.travelerId,
      booking_id: testState.bookingId,
      conversation_history: []
    };
    
    try {
      const response = await request('POST', `${CONFIG.AI_AGENT}/api/ai-agent/chat`, requestData);
      
      if (response.status === 200) {
        logSuccess(`AI Agent responded to: "${query}"`);
        if (response.data.response) {
          logInfo(`Response preview: ${response.data.response.substring(0, 100)}...`);
        }
      } else {
        logError(`AI Agent query failed: ${response.status} - ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      logError(`AI Agent request error: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return true;
}

// Test: Profile Management
async function testProfileManagement() {
  logTest('Profile Management');
  
  // Host profile
  if (testState.hostCookies) {
    logInfo('Testing host profile update...');
    const hostProfileUpdate = {
      name: 'Updated Host Name',
      phone: '555-0100',
      location: 'San Francisco, CA',
      bio: 'Updated bio for testing'
    };
    
    const hostResponse = await request('PUT', `${CONFIG.HOST_BACKEND}/owners/profile`, hostProfileUpdate, testState.hostCookies);
    
    if (hostResponse.status === 200) {
      logSuccess('Host profile updated');
    } else {
      logError(`Host profile update failed: ${hostResponse.status}`);
    }
  }
  
  // Traveler profile
  if (testState.travelerCookies) {
    logInfo('Testing traveler profile update...');
    const travelerProfileUpdate = {
      name: 'Updated Traveler Name',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      about_me: 'Updated about me for testing'
    };
    
    const travelerResponse = await request('PUT', `${CONFIG.TRAVELER_BACKEND}/api/traveler/profile`, travelerProfileUpdate, testState.travelerCookies);
    
    if (travelerResponse.status === 200) {
      logSuccess('Traveler profile updated');
      
      // Verify in MongoDB
      await verifyMongoCollection('traveler_profiles', 'Traveler profiles collection');
    } else {
      logError(`Traveler profile update failed: ${travelerResponse.status}`);
    }
  }
  
  return true;
}

// Final MongoDB Verification
async function finalMongoVerification() {
  logSection('Final MongoDB Data Verification');
  
  if (!testState.mongoDb) {
    logInfo('MongoDB not connected. Skipping final verification.');
    return;
  }
  
  const collections = [
    { name: 'owners', description: 'Host owners' },
    { name: 'users', description: 'Traveler users' },
    { name: 'properties', description: 'Properties' },
    { name: 'bookings', description: 'Bookings' },
    { name: 'favorites', description: 'Favorites' },
    { name: 'traveler_profiles', description: 'Traveler profiles' },
    { name: 'sessions', description: 'Sessions' }
  ];
  
  for (const collection of collections) {
    await verifyMongoCollection(collection.name, collection.description);
  }
  
  // Verify specific test data
  if (testState.hostId) {
    logInfo(`\nVerifying host with ID: ${testState.hostId}`);
    const host = await testState.mongoDb.collection('owners').findOne({ _id: testState.hostId });
    if (host) {
      logSuccess(`Host found: ${host.email}`);
    } else {
      logError('Host not found in MongoDB');
    }
  }
  
  if (testState.travelerId) {
    logInfo(`\nVerifying traveler with ID: ${testState.travelerId}`);
    const traveler = await testState.mongoDb.collection('users').findOne({ _id: testState.travelerId });
    if (traveler) {
      logSuccess(`Traveler found: ${traveler.email}`);
    } else {
      logError('Traveler not found in MongoDB');
    }
  }
  
  if (testState.propertyId) {
    logInfo(`\nVerifying property with ID: ${testState.propertyId}`);
    const property = await testState.mongoDb.collection('properties').findOne({ _id: testState.propertyId });
    if (property) {
      logSuccess(`Property found: ${property.name}`);
    } else {
      logError('Property not found in MongoDB');
    }
  }
  
  if (testState.bookingId) {
    logInfo(`\nVerifying booking with ID: ${testState.bookingId}`);
    const booking = await testState.mongoDb.collection('bookings').findOne({ _id: testState.bookingId });
    if (booking) {
      logSuccess(`Booking found: Status = ${booking.status}`);
    } else {
      logError('Booking not found in MongoDB');
    }
  }
}

// Main test runner
async function runAllTests() {
  logSection('Agentic Airbnb - Comprehensive E2E Test Suite');
  logInfo('Starting comprehensive end-to-end testing...\n');
  
  // Connect to MongoDB
  await connectMongoDB();
  
  try {
    // Run all tests
    await testHealthChecks();
    await testHostAuth();
    await testTravelerAuth();
    await testPropertyCreation();
    await testPropertySearch();
    await testBookingCreation();
    await testBookingManagement();
    await testFavorites();
    await testProfileManagement();
    await testAIAgent();
    
    // Final verification
    await finalMongoVerification();
    
    logSection('Test Suite Complete');
    logSuccess('All tests completed!');
    
  } catch (error) {
    logError(`Test suite error: ${error.message}`);
    console.error(error);
  } finally {
    // Close MongoDB connection
    if (testState.mongoClient) {
      await testState.mongoClient.close();
      logInfo('MongoDB connection closed');
    }
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };

