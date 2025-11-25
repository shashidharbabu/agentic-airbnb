/**
 * Test Kafka Booking Flow
 * Tests the complete event-driven booking workflow:
 * 1. Create booking → sends booking-created event
 * 2. Accept booking → sends booking-accepted event
 */

const http = require('http');

const CONFIG = {
  TRAVELER_BACKEND: 'http://localhost:5001',
  HOST_BACKEND: 'http://localhost:4000',
  KAFKA_BROKER: process.env.KAFKA_BROKER || 'localhost:9092'
};

// Helper function to make HTTP requests
function request(method, url, data = null, cookies = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testKafkaBookingFlow() {
  console.log('🧪 Testing Kafka Booking Flow...\n');
  
  const timestamp = Date.now();
  let hostCookies = null;
  let travelerCookies = null;
  let propertyId = null;
  let bookingId = null;

  try {
    // Step 1: Host signup and login
    console.log('1. Setting up host account...');
    const hostEmail = `kafka_test_host_${timestamp}@test.com`;
    const hostPassword = 'TestPassword123!';
    
    const hostSignup = await request('POST', `${CONFIG.HOST_BACKEND}/auth/signup`, {
      email: hostEmail,
      password: hostPassword,
      name: `Kafka Test Host ${timestamp}`,
      phone: `123-555-${timestamp.toString().slice(-4)}`,
      location: `Test City ${timestamp}`
    });
    
    if (hostSignup.status !== 201 && hostSignup.status !== 200) {
      throw new Error(`Host signup failed: ${hostSignup.status} - ${JSON.stringify(hostSignup.data)}`);
    }
    console.log('   ✅ Host signed up');
    
    const hostLogin = await request('POST', `${CONFIG.HOST_BACKEND}/auth/login`, {
      email: hostEmail,
      password: hostPassword
    });
    
    if (hostLogin.status !== 200) {
      throw new Error(`Host login failed: ${hostLogin.status}`);
    }
    hostCookies = hostLogin.headers['set-cookie']?.join('; ') || null;
    console.log('   ✅ Host logged in\n');

    // Step 2: Create property
    console.log('2. Creating property...');
    const property = {
      name: `Kafka Test Property ${timestamp}`,
      description: 'Test property for Kafka integration',
      location: 'Test Location',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      country: 'USA',
      property_type: 'APARTMENT',
      bedrooms: 2,
      bathrooms: 2,
      max_guests: 4,
      price_per_night: 100,
      amenities: ['WiFi', 'Kitchen']
    };
    
    const createProperty = await request('POST', `${CONFIG.HOST_BACKEND}/properties`, property, hostCookies);
    
    if (createProperty.status !== 201 && createProperty.status !== 200) {
      throw new Error(`Property creation failed: ${createProperty.status} - ${JSON.stringify(createProperty.data)}`);
    }
    // Handle both response formats: {property: {id}} or {id}
    propertyId = createProperty.data.property?.id || createProperty.data.id;
    if (!propertyId) {
      throw new Error(`Property ID not found in response: ${JSON.stringify(createProperty.data)}`);
    }
    console.log(`   ✅ Property created: ${propertyId}\n`);

    // Step 3: Traveler signup and login
    console.log('3. Setting up traveler account...');
    const travelerEmail = `kafka_test_traveler_${timestamp}@test.com`;
    const travelerPassword = 'TestPassword123!';
    
    const travelerSignup = await request('POST', `${CONFIG.TRAVELER_BACKEND}/api/auth/signup`, {
      email: travelerEmail,
      password: travelerPassword,
      name: `Kafka Test Traveler ${timestamp}`
    });
    
    if (travelerSignup.status !== 201 && travelerSignup.status !== 200) {
      throw new Error(`Traveler signup failed: ${travelerSignup.status} - ${JSON.stringify(travelerSignup.data)}`);
    }
    console.log('   ✅ Traveler signed up');
    
    const travelerLogin = await request('POST', `${CONFIG.TRAVELER_BACKEND}/api/auth/login`, {
      email: travelerEmail,
      password: travelerPassword
    });
    
    if (travelerLogin.status !== 200) {
      throw new Error(`Traveler login failed: ${travelerLogin.status}`);
    }
    travelerCookies = travelerLogin.headers['set-cookie']?.join('; ') || null;
    console.log('   ✅ Traveler logged in\n');

    // Step 4: Create booking (should send booking-created event to Kafka)
    console.log('4. Creating booking (should trigger Kafka event)...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 3);
    
    const booking = {
      property_id: propertyId,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      guests: 2,
      special_requests: 'Kafka test booking'
    };
    
    const createBooking = await request('POST', `${CONFIG.TRAVELER_BACKEND}/api/bookings`, booking, travelerCookies);
    
    if (createBooking.status !== 201) {
      throw new Error(`Booking creation failed: ${createBooking.status} - ${JSON.stringify(createBooking.data)}`);
    }
    bookingId = createBooking.data.booking.id;
    console.log(`   ✅ Booking created: ${bookingId}`);
    console.log('   📨 Check host backend logs for "booking-created" event\n');

    // Wait a moment for Kafka event to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Accept booking (should send booking-accepted event to Kafka)
    console.log('5. Accepting booking (should trigger Kafka event)...');
    const acceptBooking = await request('POST', `${CONFIG.HOST_BACKEND}/bookings/${bookingId}/accept`, null, hostCookies);
    
    if (acceptBooking.status !== 200) {
      throw new Error(`Booking acceptance failed: ${acceptBooking.status} - ${JSON.stringify(acceptBooking.data)}`);
    }
    console.log(`   ✅ Booking accepted`);
    console.log('   📨 Check host backend logs for "booking-accepted" event\n');

    // Wait a moment for Kafka event to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 6: Cancel booking (should send booking-cancelled event to Kafka)
    console.log('6. Cancelling booking (should trigger Kafka event)...');
    const cancelBooking = await request('PUT', `${CONFIG.TRAVELER_BACKEND}/api/bookings/${bookingId}/cancel`, null, travelerCookies);
    
    if (cancelBooking.status !== 200) {
      throw new Error(`Booking cancellation failed: ${cancelBooking.status} - ${JSON.stringify(cancelBooking.data)}`);
    }
    console.log(`   ✅ Booking cancelled`);
    console.log('   📨 Check host backend logs for "booking-cancelled" event\n');

    // Wait a moment for Kafka event to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('✅ All tests passed!\n');
    console.log('📋 Summary:');
    console.log(`   - Host: ${hostEmail}`);
    console.log(`   - Traveler: ${travelerEmail}`);
    console.log(`   - Property ID: ${propertyId}`);
    console.log(`   - Booking ID: ${bookingId}`);
    console.log('\n💡 Check the host backend console logs to verify Kafka events were received!');
    console.log('   Look for messages like:');
    console.log('   - "📨 Received booking-created event"');
    console.log('   - "✅ Event sent to topic booking-accepted"');
    console.log('   - "✅ Event sent to topic booking-cancelled"');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run test
testKafkaBookingFlow()
  .then(() => {
    console.log('\n✅ Kafka booking flow test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

