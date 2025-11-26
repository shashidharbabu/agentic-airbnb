require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { testConnection } = require('./config/database-mongodb');

const app = express();
const PORT = parseInt(process.env.PORT || '5001', 10);
const ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:5173';
const COOKIE_DOMAIN = process.env.SESSION_COOKIE_DOMAIN || undefined;
const COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE === 'true';
const COOKIE_SAME_SITE = process.env.SESSION_COOKIE_SAMESITE || 'lax';

console.log('🔥 TRAVELLER DEBUG: WEB_ORIGIN from process.env:', process.env.WEB_ORIGIN);
console.log('🔥 TRAVELLER DEBUG: ORIGIN being used:', ORIGIN);

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
  
  // For remote MongoDB with auth (Kubernetes/Docker)
  return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
};

const sessionStore = MongoStore.create({
  mongoUrl: getMongoConnectionString(),
  dbName: process.env.DB_NAME || 'airbnb_core',
  collectionName: 'sessions',
  ttl: 7 * 24 * 60 * 60, // 7 days in seconds
  autoRemove: 'native',
  stringify: false
});

// CORS configuration - allow multiple origins for development
// Allow additional origins via environment variable (comma-separated)
const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS 
  ? process.env.ADDITIONAL_CORS_ORIGINS.split(',').map(o => o.trim())
  : [];

const allowedOrigins = [
  ORIGIN,
  'http://localhost:30073', // Kubernetes NodePort
  'http://localhost:5173',  // Traveller Vite dev server
  'http://localhost:5174',  // Host Vite dev server
  ...additionalOrigins
].filter(Boolean);

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

app.use(session({
  name: 'airbnb_traveller.sid',
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  store: sessionStore,
  resave: false,
  saveUninitialized: true, // Create session even for unauthenticated requests
  proxy: true, // Trust the proxy (AWS LoadBalancer)
  cookie: {
    httpOnly: false, 
    sameSite: 'lax', // Lax allows cookies on top-level navigation
    secure: false, // Set to false since we're using HTTP (not HTTPS)
    maxAge: 7 * 24 * 60 * 60 * 1000, 
    path: '/'
    // Do not set domain - let browser handle it
  }
}));


app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Swagger API Documentation Configuration
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { 
      title: 'Airbnb Traveler API', 
      version: '1.0.0',
      description: 'RESTful API for Airbnb travelers to search properties, make bookings, manage favorites, and update profiles. Supports session-based authentication and comprehensive property search with filters.',
      contact: {
        name: 'API Support',
        email: 'support@airbnb-traveler.com'
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
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'airbnb_traveller.sid',
          description: 'Session-based authentication using HTTP-only cookies'
        }
      },
      schemas: {
        Traveler: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Traveler ID' },
            email: { type: 'string', format: 'email', description: 'Traveler email' },
            name: { type: 'string', description: 'Traveler name' },
            phone: { type: 'string', description: 'Phone number' },
            about_me: { type: 'string', description: 'About me section' },
            city: { type: 'string', description: 'City' },
            state: { type: 'string', description: 'State abbreviation' },
            country: { type: 'string', description: 'Country' },
            languages: { type: 'array', items: { type: 'string' }, description: 'Languages spoken' },
            gender: { type: 'string', description: 'Gender' },
            profile_picture: { type: 'string', description: 'Profile picture URL' }
          }
        },
        Property: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Property ID' },
            name: { type: 'string', description: 'Property name' },
            description: { type: 'string', description: 'Property description' },
            location: { type: 'string', description: 'Property location' },
            city: { type: 'string', description: 'City' },
            state: { type: 'string', description: 'State' },
            country: { type: 'string', description: 'Country' },
            price_per_night: { type: 'number', description: 'Price per night in USD' },
            bedrooms: { type: 'integer', description: 'Number of bedrooms' },
            bathrooms: { type: 'number', description: 'Number of bathrooms' },
            max_guests: { type: 'integer', description: 'Maximum guests allowed' },
            property_type: { type: 'string', description: 'Type of property' },
            amenities: { type: 'array', items: { type: 'string' }, description: 'List of amenities' },
            main_photo: { type: 'string', description: 'Main property photo URL' },
            owner_name: { type: 'string', description: 'Property owner name' }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Booking ID' },
            property_id: { type: 'integer', description: 'Property ID' },
            property_name: { type: 'string', description: 'Property name' },
            start_date: { type: 'string', format: 'date', description: 'Check-in date' },
            end_date: { type: 'string', format: 'date', description: 'Check-out date' },
            guests: { type: 'integer', description: 'Number of guests' },
            status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'CANCELLED'], description: 'Booking status' },
            total_price: { type: 'number', description: 'Total booking price' },
            special_requests: { type: 'string', description: 'Special requests' },
            created_at: { type: 'string', format: 'date-time', description: 'Booking creation timestamp' }
          }
        },
        Favorite: {
          type: 'object',
          properties: {
            favorite_id: { type: 'integer', description: 'Favorite ID' },
            property_id: { type: 'integer', description: 'Property ID' },
            property_name: { type: 'string', description: 'Property name' },
            price_per_night: { type: 'number', description: 'Price per night' },
            main_photo: { type: 'string', description: 'Property photo URL' },
            favorited_at: { type: 'string', format: 'date-time', description: 'When favorited' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'Traveler authentication endpoints (signup, login, logout)' },
      { name: 'Traveler', description: 'Traveler profile management endpoints' },
      { name: 'Properties', description: 'Property search and details endpoints' },
      { name: 'Bookings', description: 'Booking creation and management endpoints' },
      { name: 'Favorites', description: 'Favorite properties management endpoints' }
    ]
  },
  apis: ['./src/routes/*.js', './src/server.js']
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Airbnb Traveler API Documentation',
  customfavIcon: '/favicon.ico'
}));

app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'traveler-api',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/traveler', require('./routes/traveler'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/favorites', require('./routes/favorites'));

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`Traveler API running on http://localhost:${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/docs`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
