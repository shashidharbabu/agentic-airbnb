require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { getDB, testConnection } = require('./db-mongodb');
const passport = require('./middleware/passport');
const { subscribeToTopic } = require('./config/kafka');
const TOPICS = require('./config/kafka-topics');
const { initializeNotificationHandlers } = require('./services/notifications');

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:5174';
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'airbnb_host.sid';
const COOKIE_DOMAIN = process.env.SESSION_COOKIE_DOMAIN || undefined;
const COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE === 'true';
const COOKIE_SAME_SITE = process.env.SESSION_COOKIE_SAMESITE || 'lax';

console.log('🔥 DEBUG: WEB_ORIGIN from process.env:', process.env.WEB_ORIGIN);
console.log('🔥 DEBUG: ORIGIN being used:', ORIGIN);

// Test MongoDB connection
testConnection();

// Configure MongoDB session store using connection string
const getMongoConnectionString = () => {
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
  
  // For remote MongoDB with auth
  return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
};

// Create session store with error handling
let sessionStore;
try {
  const mongoUrl = getMongoConnectionString();
  console.log('Creating session store with URL:', mongoUrl.replace(/\/\/.*@/, '//***@')); // Hide credentials in log
  
  // Create MongoDB client for session store
  const sessionClient = new MongoClient(mongoUrl, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  
  // Connect client and create session store
  const clientPromise = sessionClient.connect().then(() => {
    console.log('✅ MongoDB client connected for session store');
    return sessionClient;
  }).catch((err) => {
    console.error('❌ Failed to connect MongoDB client for session store:', err.message);
    throw err;
  });
  
  sessionStore = MongoStore.create({
    clientPromise: clientPromise,
    dbName: process.env.DB_NAME || 'airbnb_core',
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
    autoRemove: 'native',
    stringify: false
  });
  
  // Test session store connection
  sessionStore.on('error', (error) => {
    console.error('❌ Session store error:', error);
  });
  
  sessionStore.on('connected', () => {
    console.log('✅ Session store connected to MongoDB');
  });
  
  sessionStore.on('disconnected', () => {
    console.warn('⚠️ Session store disconnected from MongoDB');
  });
} catch (error) {
  console.error('Failed to create session store:', error);
  throw error;
}

// CORS configuration - allow multiple origins for development
const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS 
  ? process.env.ADDITIONAL_CORS_ORIGINS.split(',').map(o => o.trim())
  : [];

const allowedOrigins = [
  ORIGIN,
  'http://localhost:30074', // Kubernetes NodePort
  'http://localhost:5174',  // Host frontend (Vite dev server)
  'http://localhost:5173',  // Traveler frontend (Vite dev server)
  ...additionalOrigins
].filter(Boolean);

console.log('🔥 DEBUG: Allowed CORS origins:', allowedOrigins);

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS: Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id']
}));
app.use(express.json());
app.use(morgan('dev'));

app.use(session({
  name: SESSION_COOKIE_NAME,
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  store: sessionStore,
  resave: false, // Changed to false - only save if session was modified
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: (() => {
    const cookie = {
      httpOnly: true,
      sameSite: COOKIE_SAME_SITE,
      secure: COOKIE_SECURE,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    };
    if (COOKIE_DOMAIN) {
      cookie.domain = COOKIE_DOMAIN;
    }
    return cookie;
  })()
}));

// Initialize Passport after session middleware
app.use(passport.initialize());
app.use(passport.session());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Swagger API Documentation Configuration
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { 
      title: 'Airbnb Host API', 
      version: '1.0.0',
      description: 'RESTful API for Airbnb host property and booking management. This API provides endpoints for property owners to manage their listings, handle booking requests, and manage their profiles.',
      contact: {
        name: 'API Support',
        email: 'support@airbnb-host.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      { 
        url: `http://localhost:${PORT}`,
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: SESSION_COOKIE_NAME,
          description: 'Session-based authentication using HTTP-only cookies'
        }
      },
      schemas: {
        Property: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Property ID' },
            name: { type: 'string', description: 'Property name' },
            description: { type: 'string', description: 'Property description' },
            location: { type: 'string', description: 'Property location' },
            address: { type: 'string', description: 'Street address' },
            city: { type: 'string', description: 'City' },
            state: { type: 'string', description: 'State' },
            country: { type: 'string', description: 'Country' },
            price_per_night: { type: 'number', description: 'Price per night in USD' },
            bedrooms: { type: 'integer', description: 'Number of bedrooms' },
            bathrooms: { type: 'number', description: 'Number of bathrooms' },
            max_guests: { type: 'integer', description: 'Maximum guests allowed' },
            amenities: { type: 'array', items: { type: 'string' }, description: 'List of amenities' }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Booking ID' },
            property_id: { type: 'integer', description: 'Property ID' },
            traveler_id: { type: 'integer', description: 'Traveler ID' },
            start_date: { type: 'string', format: 'date', description: 'Check-in date' },
            end_date: { type: 'string', format: 'date', description: 'Check-out date' },
            guests: { type: 'integer', description: 'Number of guests' },
            status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'CANCELLED'], description: 'Booking status' },
            total_price: { type: 'number', description: 'Total booking price' },
            special_requests: { type: 'string', description: 'Special requests from traveler' }
          }
        },
        Owner: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Owner ID' },
            email: { type: 'string', format: 'email', description: 'Owner email' },
            name: { type: 'string', description: 'Owner name' },
            phone: { type: 'string', description: 'Phone number' },
            location: { type: 'string', description: 'Owner location' },
            bio: { type: 'string', description: 'Owner bio' },
            avatar_url: { type: 'string', description: 'Profile picture URL' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'Owner authentication endpoints' },
      { name: 'Properties', description: 'Property management endpoints' },
      { name: 'Bookings', description: 'Booking management endpoints' },
      { name: 'Owners', description: 'Owner profile endpoints' },
      { name: 'Public', description: 'Public API endpoints' }
    ]
  },
  apis: ['./src/routes/*.js', './src/server.js']
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Airbnb Host API Documentation',
  customfavIcon: '/favicon.ico'
}));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'host-api' }));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/owners', require('./routes/owners'));
app.use('/properties', require('./routes/properties'));
app.use('/bookings', require('./routes/bookings'));
app.use('/public', require('./routes/public'));

// Initialize Kafka consumer for booking events and notifications
async function initializeKafkaConsumer() {
  try {
    // Initialize notification handlers for all booking events
    await initializeNotificationHandlers(subscribeToTopic);
    
    console.log('✅ Kafka consumer initialized with notification handlers');
  } catch (error) {
    console.error('❌ Failed to initialize Kafka consumer:', error);
    // Don't fail server startup if Kafka is unavailable
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`Host API on http://localhost:${PORT}`);
  console.log(`Swagger on http://localhost:${PORT}/docs`);
  
  // Initialize Kafka consumer (non-blocking)
  initializeKafkaConsumer().catch(err => {
    console.error('Kafka consumer initialization error:', err);
  });
});
