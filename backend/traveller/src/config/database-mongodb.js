require('dotenv').config();
const { MongoClient } = require('mongodb');

let client = null;
let db = null;

const getConnectionString = () => {
  const username = process.env.DB_USER || 'admin';
  const password = process.env.DB_PASSWORD || 'change-me-in-production';
  // For local development, use localhost; for Docker/K8s use mongodb-service
  const host = process.env.DB_HOST || (process.env.NODE_ENV === 'production' ? 'mongodb-service' : 'localhost');
  // MongoDB uses port 27017, not 3306 (MySQL) - override if port is 3306
  let port = process.env.DB_PORT || '27017';
  if (port === '3306') {
    port = '27017'; // MongoDB default port
  }
  const database = process.env.DB_NAME || 'airbnb_core';
  
  // For local MongoDB without auth (common in development), use simpler connection string
  if (host === 'localhost' || host === '127.0.0.1') {
    // Try without auth first (common for local MongoDB)
    return `mongodb://127.0.0.1:${port}/${database}`;
  }
  
  // For remote MongoDB with auth (Kubernetes/Docker)
  return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
};

const connectDB = async () => {
  if (db) {
    return db;
  }

  try {
    const connectionString = getConnectionString();
    console.log('Connecting to MongoDB:', connectionString.replace(/\/\/.*@/, '//***@')); // Hide credentials
    
    client = new MongoClient(connectionString, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
    });

    await client.connect();
    const dbName = process.env.DB_NAME || 'airbnb_core';
    db = client.db(dbName);
    console.log('✅ MongoDB connected successfully to database:', dbName);
    
    // Verify connection by checking collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', '));
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Connection string used:', getConnectionString().replace(/\/\/.*@/, '//***@'));
    throw error;
  }
};

const getDB = async () => {
  if (!db) {
    await connectDB();
  }
  return db;
};

const closeConnection = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
};

const testConnection = async () => {
  try {
    const database = await getDB();
    await database.admin().ping();
    console.log('✅ MongoDB connection test successful');
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error.message);
    if (process.env.DOCKER_ENV === 'true' || process.env.KUBERNETES_SERVICE_HOST) {
      console.warn('Continuing without database connection (containerized mode - will retry on first request)');
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('Continuing without database connection (development mode)');
    } else {
      console.error('Database connection is required. Exiting...');
      process.exit(1);
    }
  }
};

module.exports = {
  getDB,
  connectDB,
  closeConnection,
  testConnection,
  client: () => client,
  db: () => db
};

