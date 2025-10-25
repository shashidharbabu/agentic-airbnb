require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { pool, testConnection } = require('./config/database');

const app = express();
const PORT = parseInt(process.env.PORT || '5001', 10);
const ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:5173';

testConnection();

const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 900000, 
  expiration: 7 * 24 * 60 * 60 * 1000, 
  createDatabaseTable: false, 
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, pool);

app.use(cors({ 
  origin: ORIGIN, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

app.use(session({
  name: 'airbnb_traveller.sid',
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: false, 
    sameSite: 'lax',
    secure: false, 
    maxAge: 7 * 24 * 60 * 60 * 1000, 
    domain: 'localhost', 
    path: '/' 
  }
}));


app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { 
      title: 'Airbnb Traveler API', 
      version: '1.0.0',
      description: 'API for Airbnb Traveler features including authentication, property search, bookings, and favorites'
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'airbnb_traveller.sid'
        }
      }
    }
  },
  apis: [path.join(__dirname, './routes/*.js')]
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
