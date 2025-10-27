require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { pool } = require('./db');
const passport = require('./middleware/passport');

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:5174';
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'airbnb_host.sid';

console.log('🔥 DEBUG: WEB_ORIGIN from process.env:', process.env.WEB_ORIGIN);
console.log('🔥 DEBUG: ORIGIN being used:', ORIGIN);

// Configure MySQL session store
const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutes
  expiration: 7 * 24 * 60 * 60 * 1000, // 7 days
  createDatabaseTable: false, // We already created it
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, pool);

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use(session({
  name: SESSION_COOKIE_NAME,
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production', // Auto-secure in production
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
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

app.listen(PORT, () => {
  console.log(`Host API on http://localhost:${PORT}`);
  console.log(`Swagger on http://localhost:${PORT}/docs`);
});
