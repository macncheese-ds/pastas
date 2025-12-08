/**
 * =====================================================
 * MySQL Database Connection Pool
 * =====================================================
 * Configura y exporta el pool de conexiones a MySQL
 * utilizando mysql2 con soporte para Promises
 */

import mysql from 'mysql2/promise';

// Configuración del pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '6235642',
  database: process.env.DB_NAME || 'solder_paste_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Configuración de zona horaria (México Central - CST/CDT)
  timezone: '-06:00',
  // Convertir fechas automáticamente
  dateStrings: false,
});

export default pool;

/**
 * Ejecuta una consulta SQL con parámetros
 * @param sql - Query SQL con placeholders (?)
 * @param params - Array de parámetros
 * @returns Resultado de la consulta
 */
export async function query<T>(sql: string, params?: unknown[]): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

/**
 * Verifica la conexión a la base de datos
 * @returns true si la conexión es exitosa
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
