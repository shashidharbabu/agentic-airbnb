require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'airbnb_core',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT 1');
    console.log('Database connected successfully (Test query OK)');
    conn.release();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.error('Make sure MySQL is running and your .env credentials are correct.');
    // Don't exit in containerized/Docker environments - allow service to start and retry
    if (process.env.DOCKER_ENV === 'true' || process.env.KUBERNETES_SERVICE_HOST) {
      console.warn('Continuing without database connection (containerized mode - will retry on first request)');
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('Continuing without database connection (development mode)');
    } else {
      // In production, exit if database is critical
      console.error('Database connection is required. Exiting...');
      process.exit(1);
    }
  }
};


pool.on('error', (err) => {
  console.error('MySQL Pool Error:', err.code, err.message);
});

module.exports = { pool, testConnection };
