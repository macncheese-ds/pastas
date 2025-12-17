/**
 * =====================================================
 * MySQL Database Connection Pool
 * =====================================================
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '6235642',
  database: process.env.DB_NAME || 'solder_paste_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '-06:00',
  dateStrings: false,
});

/**
 * Execute a SQL query with parameters
 */
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

module.exports = { pool, query, testConnection };
