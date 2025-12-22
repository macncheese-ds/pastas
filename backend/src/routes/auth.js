const express = require('express');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const router = express.Router();

// Helper para conectar a credenciales DB
async function createCredConnection() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.CRED_DB_NAME || 'credenciales'
  };
  return await mysql.createConnection(config);
}

// Normalizar entrada de empleado
function normalizeEmployeeInput(input) {
  let normalized = String(input).trim();
  const match = normalized.match(/^0*(\d+)([A-Za-z])?$/);
  if (match) {
    const number = match[1];
    const letter = match[2] || 'A';
    normalized = `${number}${letter}`;
  } else {
    normalized = normalized.replace(/^0+/, '') + 'A';
  }
  return normalized;
}

// POST /api/auth/login - authenticate with credenciales database
router.post('/login', async (req, res) => {
  const { employee_input, password } = req.body;
  if (!employee_input || !password) {
    return res.status(400).json({ message: 'employee_input y password requeridos' });
  }

  try {
    const normalized = normalizeEmployeeInput(employee_input);
    const conn = await createCredConnection();
    
    const [rows] = await conn.execute(
      'SELECT id, nombre, usuario, num_empleado, pass_hash, rol FROM users WHERE num_empleado = ? OR usuario = ? LIMIT 1',
      [normalized, normalized]
    );
    await conn.end();

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = rows[0];
    const hash = Buffer.isBuffer(user.pass_hash) ? user.pass_hash.toString() : user.pass_hash;
    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.status(401).json({ message: 'Contraseña incorrecta' });

    // Retornar info del usuario autenticado (sin restricciones de rol)
    res.json({
      success: true,
      user: {
        id: user.id,
        num_empleado: user.num_empleado,
        nombre: user.nombre,
        rol: user.rol
      }
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ message: 'Error de autenticación' });
  }
});

module.exports = router;
