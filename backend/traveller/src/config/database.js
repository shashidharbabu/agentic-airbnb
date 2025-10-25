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
    process.exit(1);
  }
};


pool.on('error', (err) => {
  console.error('MySQL Pool Error:', err.code, err.message);
});

module.exports = { pool, testConnection };
