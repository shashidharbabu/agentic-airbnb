const bcrypt = require('bcryptjs');
const { MongoClient, ObjectId } = require('mongodb');

async function createTestUser() {
  const password = 'TestPassword123!';
  const email = 'testhost@example.com';
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  console.log('Password hash created');
  
  // Connect to MongoDB
  const client = new MongoClient('mongodb://127.0.0.1:27017/airbnb_core');
  await client.connect();
  console.log('Connected to MongoDB');
  
  const db = client.db('airbnb_core');
  const ownersCollection = db.collection('owners');
  
  // Check if user already exists
  const existing = await ownersCollection.findOne({ email });
  if (existing) {
    console.log('User already exists, updating password...');
    await ownersCollection.updateOne(
      { email },
      { 
        $set: { 
          password_hash: passwordHash,
          updated_at: new Date()
        } 
      }
    );
    console.log('✅ Password updated for existing user');
  } else {
    // Create new user
    const result = await ownersCollection.insertOne({
      email,
      password_hash: passwordHash,
      name: 'Test Host',
      phone: '+1234567890',
      location: 'San Francisco, CA',
      about: '',
      avatar_url: null,
      created_at: new Date(),
      updated_at: new Date()
    });
    console.log('✅ Test account created!');
    console.log('ID:', result.insertedId);
  }
  
  // Verify the user
  const user = await ownersCollection.findOne({ email });
  console.log('\n📋 Account Details:');
  console.log('Email:', user.email);
  console.log('Name:', user.name);
  console.log('Phone:', user.phone);
  console.log('Location:', user.location);
  console.log('Has password_hash:', user.password_hash ? 'YES' : 'NO');
  console.log('\n🔑 Login Credentials:');
  console.log('Email: testhost@example.com');
  console.log('Password: TestPassword123!');
  
  await client.close();
  console.log('\n✅ Done!');
}

createTestUser().catch(console.error);

