const mysql = require('mysql2/promise');

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'solder_paste_db'
    });

    console.log('Conectado a la base de datos');

    await connection.execute(`
      ALTER TABLE scan_log 
      MODIFY COLUMN scan_type ENUM(
        'fridge_in',
        'fridge_out',
        'mixing_start',
        'viscosity_check',
        'opened',
        'removed',
        'did_update'
      ) NOT NULL
    `);

    console.log('✓ Migración completada: ENUM de scan_type actualizado con did_update');

  } catch (error) {
    console.error('Error en la migración:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

migrate();
