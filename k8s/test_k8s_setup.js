#!/usr/bin/env node
/**
 * Test Kubernetes Setup with Shared MongoDB
 * Tests both backends are working correctly with shared MongoDB
 */

const axios = require('axios');
const { MongoClient } = require('mongodb');

// Helper to parse cookies from Set-Cookie header
function parseCookies(setCookieHeaders) {
  if (!setCookieHeaders || setCookieHeaders.length === 0) return '';
  return setCookieHeaders.map(header => header.split(';')[0]).join('; ');
}

const CONFIG = {
  HOST_BACKEND: 'http://localhost:4000',
  TRAVELER_BACKEND: 'http://localhost:5001',
  AI_AGENT: 'http://localhost:8000',
  MONGODB: 'mongodb://admin:change-me-in-production@localhost:27018/airbnb_core?authSource=admin'
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

// Test: Service Health
async function testHealth() {
  logTest('Service Health Checks');
  
  try {
    const hostHealth = await axios.get(`${CONFIG.HOST_BACKEND}/health`);
    if (hostHealth.status === 200) {
      logSuccess('Host Backend is healthy');
    }
  } catch (e) {
    logError(`Host Backend health check failed: ${e.message}`);
  }
  
  try {
    const travelerHealth = await axios.get(`${CONFIG.TRAVELER_BACKEND}/health`);
    if (travelerHealth.status === 200) {
      logSuccess('Traveler Backend is healthy');
    }
  } catch (e) {
    logError(`Traveler Backend health check failed: ${e.message}`);
  }
}

// Test: MongoDB Connection
async function testMongoDB() {
  logTest('MongoDB Connection (Shared)');
  
  try {
    const client = new MongoClient(CONFIG.MONGODB);
    await client.connect();
    const db = client.db('airbnb_core');
    
    const collections = await db.listCollections().toArray();
    logInfo(`Connected to shared MongoDB`);
    logInfo(`Collections: ${collections.map(c => c.name).join(', ')}`);
    
    const ownersCount = await db.collection('owners').countDocuments();
    const propertiesCount = await db.collection('properties').countDocuments();
    const bookingsCount = await db.collection('bookings').countDocuments();
    const sessionsCount = await db.collection('sessions').countDocuments();
    
    logInfo(`Owners: ${ownersCount}`);
    logInfo(`Properties: ${propertiesCount}`);
    logInfo(`Bookings: ${bookingsCount}`);
    logInfo(`Sessions: ${sessionsCount}`);
    
    await client.close();
    logSuccess('MongoDB connection verified');
  } catch (e) {
    logError(`MongoDB connection failed: ${e.message}`);
    logInfo('Make sure port-forward is running: kubectl port-forward -n airbnb-system svc/mongodb-service 27018:27017');
  }
}

// Test: Host Authentication
async function testHostAuth() {
  logTest('Host Authentication');
  
  const email = 'testhost@example.com';
  const password = 'TestPassword123!';
  
  // Create axios instance with cookie support
  const axiosInstance = axios.create({
    withCredentials: true,
    maxRedirects: 0,
    validateStatus: () => true
  });
  
  try {
    const response = await axiosInstance.post(`${CONFIG.HOST_BACKEND}/auth/login`, {
      email,
      password
    });
    
    if (response.status === 200) {
      logSuccess('Host login successful');
      logInfo(`Logged in as: ${response.data.owner?.name || email}`);
      
      // Extract cookies from response
      const setCookieHeaders = response.headers['set-cookie'] || [];
      if (setCookieHeaders.length > 0) {
        logInfo(`Cookie received: ${setCookieHeaders[0].split(';')[0]}`);
        return { axiosInstance, cookies: setCookieHeaders.join('; ') };
      } else {
        logError('No cookie received from login');
        return { axiosInstance, cookies: null };
      }
    } else {
      logError(`Host login failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (e) {
    logError(`Host login error: ${e.message}`);
  }
  
  return { axiosInstance: null, cookies: null };
}

// Test: Property Search
async function testPropertySearch() {
  logTest('Property Search (Traveler Backend)');
  
  try {
    const response = await axios.get(`${CONFIG.TRAVELER_BACKEND}/api/properties/search?page=1&limit=10`);
    
    if (response.status === 200) {
      const properties = response.data.properties || [];
      logSuccess(`Found ${properties.length} properties`);
      
      if (properties.length > 0) {
        properties.forEach((p, i) => {
          logInfo(`${i + 1}. ${p.name} - ${p.location} - $${p.price_per_night}/night`);
          if (p.owner_name) {
            logInfo(`   Owner: ${p.owner_name}`);
          }
        });
      } else {
        logError('No properties found in shared MongoDB');
      }
    } else {
      logError(`Property search failed: ${response.status}`);
    }
  } catch (e) {
    logError(`Property search error: ${e.message}`);
  }
}

// Test: Create Property (Host)
async function testCreateProperty(authResult) {
  logTest('Create Property (Host Backend)');
  
  if (!authResult || !authResult.cookies) {
    logError('Not authenticated, skipping property creation');
    return null;
  }
  
  const property = {
    name: 'K8s Test Property',
    description: 'Test property created in Kubernetes environment',
    location: 'San Francisco, CA',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    price_per_night: 200,
    bedrooms: 3,
    bathrooms: 2,
    max_guests: 6,
    property_type: 'House',
    amenities: ['WiFi', 'Kitchen', 'Parking', 'Pool']
  };
  
  try {
    // Use the same axios instance that has the cookie
    const response = await authResult.axiosInstance.post(
      `${CONFIG.HOST_BACKEND}/properties`,
      property,
      {
        validateStatus: () => true,
        headers: {
          'Cookie': authResult.cookies
        }
      }
    );
    
    if (response.status === 200 || response.status === 201) {
      logSuccess('Property created successfully');
      logInfo(`Property ID: ${response.data.id}`);
      return response.data.id;
    } else {
      logError(`Property creation failed: ${response.status} - ${JSON.stringify(response.data)}`);
      if (response.status === 401) {
        logError('Authentication failed - session may have expired or cookie not properly set');
      }
    }
  } catch (e) {
    logError(`Property creation error: ${e.message}`);
    if (e.response) {
      logError(`Response status: ${e.response.status}`);
      logError(`Response data: ${JSON.stringify(e.response.data)}`);
    }
  }
  
  return null;
}

// Test: Verify Property in Traveler Search
async function testPropertyVisible(propertyId) {
  logTest('Verify Property Visible to Traveler');
  
  if (!propertyId) {
    logInfo('Skipping - no property ID');
    return;
  }
  
  try {
    const response = await axios.get(`${CONFIG.TRAVELER_BACKEND}/api/properties/search?page=1&limit=20`);
    
    if (response.status === 200) {
      const properties = response.data.properties || [];
      const found = properties.find(p => p.id === propertyId || p.name === 'K8s Test Property');
      
      if (found) {
        logSuccess('Property is visible to traveler backend');
        logInfo(`Found: ${found.name} - ${found.location}`);
      } else {
        logError('Property not found in traveler search');
        logInfo(`Searched ${properties.length} properties`);
      }
    }
  } catch (e) {
    logError(`Verification error: ${e.message}`);
  }
}

// Main test runner
async function runTests() {
  logSection('Kubernetes Setup Testing - Shared MongoDB');
  logInfo('Testing both backends with shared MongoDB in Kubernetes\n');
  
  // Check port-forwards
  logInfo('Make sure port-forwards are running:');
  logInfo('  kubectl port-forward -n airbnb-system svc/host-backend-service 4000:4000');
  logInfo('  kubectl port-forward -n airbnb-system svc/traveller-backend-service 5001:5001');
  logInfo('  kubectl port-forward -n airbnb-system svc/mongodb-service 27018:27017');
  logInfo('');
  
  await testHealth();
  await testMongoDB();
  const authResult = await testHostAuth();
  await testPropertySearch();
  const propertyId = await testCreateProperty(authResult);
  await testPropertyVisible(propertyId);
  
  logSection('Test Complete');
  logSuccess('All tests completed!');
  logInfo('\nNext steps:');
  logInfo('1. Test booking creation');
  logInfo('2. Test AI agent conversations');
  logInfo('3. Test favorites functionality');
  logInfo('4. Verify all data persists in shared MongoDB');
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };

