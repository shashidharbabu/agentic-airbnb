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
const ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:5173';

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
  name: 'airbnb_host.sid',
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', // Auto-secure in production
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Initialize Passport after session middleware
app.use(passport.initialize());
app.use(passport.session());

app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Airbnb Host API', version: '1.0.0' },
    servers: [{ url: `http://localhost:${PORT}` }]
  },
  apis: []
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
