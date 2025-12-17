/**
 * =====================================================
 * API Routes: /api/pastes
 * =====================================================
 * Endpoints for managing solder pastes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { isValidViscosity } = require('../utils/qrParser');

/**
 * GET /api/pastes
 * Get all pastes or search by lot_number + lot_serial, or by DID, or by smt_location
 */
router.get('/', async (req, res) => {
  try {
    const { lot_number, lot_serial, did, smt_location } = req.query;

    // Search by DID (Document Identification)
    if (did) {
      const results = await query(
        `SELECT * FROM solder_paste WHERE did = ?`,
        [did]
      );

      if (results.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'Pasta no encontrada',
        });
      }

      return res.json({
        success: true,
        data: results,
      });
    }

    // Search by lot_number and lot_serial
    // FEFO/FIFO: Return the paste with earliest expiration date, or earliest creation if same expiration
    if (lot_number && lot_serial) {
      const results = await query(
        `SELECT * FROM solder_paste 
         WHERE lot_number = ? AND lot_serial = ?
         ORDER BY expiration_date ASC, created_at ASC
         LIMIT 1`,
        [lot_number, lot_serial]
      );

      if (results.length === 0) {
        return res.json({
          success: true,
          data: null,
          message: 'Pasta no encontrada',
        });
      }

      return res.json({
        success: true,
        data: results[0],
      });
    }

    // Filter by smt_location if provided
    let query_string = `SELECT * FROM solder_paste`;
    let params = [];
    
    if (smt_location) {
      query_string += ` WHERE smt_location = ?`;
      params = [smt_location];
    }
    
    query_string += ` ORDER BY created_at DESC LIMIT 100`;

    const results = await query(query_string, params);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching pastes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las pastas',
    });
  }
});

/**
 * GET /api/pastes/export/excel
 * Export all pastes to Excel (CSV format)
 */
router.get('/export/excel', async (req, res) => {
  try {
    const results = await query(
      `SELECT 
        id,
        did,
        lot_number,
        lot_serial,
        part_number,
        manufacture_date,
        expiration_date,
        smt_location,
        status,
        viscosity_value,
        fridge_in_datetime,
        fridge_out_datetime,
        mixing_start_datetime,
        viscosity_datetime,
        opened_datetime,
        removed_datetime,
        created_at
      FROM solder_paste 
      ORDER BY expiration_date ASC, created_at ASC`
    );

    // Create CSV header
    const headers = [
      'ID',
      'DID',
      'LOTE',
      'SERIAL',
      'NÚMERO DE PARTE',
      'FECHA MANUFACTURA',
      'FECHA VENCIMIENTO',
      'LÍNEA SMT',
      'ESTADO',
      'VISCOSIDAD',
      'ENTRADA REFRI',
      'SALIDA REFRI',
      'INICIO MEZCLADO',
      'VISCOSIDAD REGISTRADA',
      'APERTURA',
      'RETIRADO',
      'FECHA CREACIÓN'
    ];

    // Format dates for CSV
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Create CSV rows
    const csvRows = results.map(paste => [
      paste.id,
      paste.did,
      paste.lot_number,
      paste.lot_serial,
      paste.part_number,
      formatDate(paste.manufacture_date),
      formatDate(paste.expiration_date),
      paste.smt_location || '',
      paste.status,
      paste.viscosity_value || '',
      formatDate(paste.fridge_in_datetime),
      formatDate(paste.fridge_out_datetime),
      formatDate(paste.mixing_start_datetime),
      formatDate(paste.viscosity_datetime),
      formatDate(paste.opened_datetime),
      formatDate(paste.removed_datetime),
      formatDate(paste.created_at)
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        if (typeof cell === 'string' && cell.includes(',')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(','))
    ].join('\n');

    // Send as Excel-compatible CSV
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pastas_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csvContent); // Add BOM for Excel UTF-8 encoding
  } catch (error) {
    console.error('Error exporting pastes:', error);
    res.status(500).json({
      error: 'Error al exportar los registros',
    });
  }
});

/**
 * POST /api/pastes
 * Create new paste with fridge entry
 */
router.post('/', async (req, res) => {
  try {
    const { did, lot_number, part_number, lot_serial, manufacture_date, expiration_date, smt_location } = req.body;

    // Convert to uppercase
    const upperDid = did?.trim().toUpperCase();
    const upperLotNumber = lot_number?.trim().toUpperCase();
    const upperPartNumber = part_number?.trim().toUpperCase();
    const upperLotSerial = lot_serial?.trim().toUpperCase();
    const upperSmtLocation = smt_location?.trim().toUpperCase();

    // Validate required fields
    if (!upperDid || !upperLotNumber || !upperPartNumber || !upperLotSerial || !manufacture_date || !expiration_date) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son obligatorios',
      });
    }

    // Validate not expired
    const expirationDate = new Date(expiration_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);

    if (expirationDate < today) {
      const formattedExpDate = expirationDate.toLocaleDateString('es-MX');
      return res.status(400).json({
        success: false,
        error: `No se puede registrar una pasta vencida.\n\nFecha de expiración: ${formattedExpDate}`,
      });
    }

    // Validate part-line assignment if smt_location is provided
    if (upperSmtLocation) {
      const smtToLineMap = { 'SMT': 1, 'SMT2': 2, 'SMT3': 3, 'SMT4': 4 };
      const lineNumber = smtToLineMap[upperSmtLocation];

      if (lineNumber) {
        const partNumberRecord = await query(
          `SELECT id FROM part_numbers WHERE UPPER(part_number) = ? AND is_active = TRUE`,
          [upperPartNumber]
        );

        if (partNumberRecord.length > 0) {
          const partNumberId = partNumberRecord[0].id;

          const productionLine = await query(
            `SELECT id, line_name FROM production_lines WHERE line_number = ? AND is_active = TRUE`,
            [lineNumber]
          );

          if (productionLine.length > 0) {
            const productionLineId = productionLine[0].id;
            const lineName = productionLine[0].line_name;

            const assignment = await query(
              `SELECT id FROM part_line_assignments WHERE part_number_id = ? AND production_line_id = ? AND is_valid = TRUE`,
              [partNumberId, productionLineId]
            );

            if (assignment.length === 0) {
              const validLines = await query(
                `SELECT pl.line_number, pl.line_name
                 FROM part_line_assignments pla
                 JOIN production_lines pl ON pla.production_line_id = pl.id
                 WHERE pla.part_number_id = ? AND pla.is_valid = TRUE AND pl.is_active = TRUE
                 ORDER BY pl.line_number`,
                [partNumberId]
              );

              const validLinesText = validLines.length > 0
                ? `Líneas autorizadas: ${validLines.map(l => l.line_name).join(', ')}`
                : 'No hay líneas autorizadas para este número de parte';

              return res.status(400).json({
                success: false,
                error: `El número de parte ${upperPartNumber} NO está autorizado para ${lineName}. ${validLinesText}`,
              });
            }
          }
        }
      }
    }

    // Check if already exists
    const existing = await query(
      `SELECT id FROM solder_paste WHERE lot_number = ? AND lot_serial = ?`,
      [upperLotNumber, upperLotSerial]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un registro con este lote y serial',
      });
    }

    // Insert new record
    const result = await query(
      `INSERT INTO solder_paste (
        did, lot_number, part_number, lot_serial,
        smt_location, manufacture_date, expiration_date,
        fridge_in_datetime, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'in_fridge')`,
      [upperDid, upperLotNumber, upperPartNumber, upperLotSerial, upperSmtLocation || null, manufacture_date, expiration_date]
    );

    // Get created record
    const newPaste = await query(
      `SELECT * FROM solder_paste WHERE id = ?`,
      [result.insertId]
    );

    // Log the scan
    await query(
      `INSERT INTO scan_log (solder_paste_id, scan_type, notes) VALUES (?, 'fridge_in', ?)`,
      [result.insertId, `Registro inicial - DID: ${did.trim()} - Entrada a refrigerador`]
    );

    res.status(201).json({
      success: true,
      data: newPaste[0],
      message: 'Pasta registrada exitosamente',
    });
  } catch (error) {
    console.error('Error creating paste:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el registro',
    });
  }
});

/**
 * GET /api/pastes/:id
 * Get paste by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const pasteId = parseInt(req.params.id, 10);

    if (isNaN(pasteId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de pasta inválido',
      });
    }

    const results = await query(
      `SELECT * FROM solder_paste WHERE id = ?`,
      [pasteId]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pasta no encontrada',
      });
    }

    res.json({
      success: true,
      data: results[0],
    });
  } catch (error) {
    console.error('Error fetching paste:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la pasta',
    });
  }
});

/**
 * DELETE /api/pastes/:id
 * Delete paste by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const pasteId = parseInt(req.params.id, 10);

    if (isNaN(pasteId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de pasta inválido',
      });
    }

    await query(`DELETE FROM solder_paste WHERE id = ?`, [pasteId]);

    res.json({
      success: true,
      message: 'Pasta eliminada correctamente',
    });
  } catch (error) {
    console.error('Error deleting paste:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la pasta',
    });
  }
});

/**
 * Check FEFO: Verify if this paste with the same expiration date should be used
 * Returns error if an earlier-registered paste with same expiration exists
 */
async function checkFEFO(pasteId, expirationDate, partNumber) {
  try {
    // Find other pastes with same expiration date and part number
    const olderPastes = await query(
      `SELECT id, created_at FROM solder_paste 
       WHERE expiration_date = ? 
       AND part_number = ? 
       AND id != ?
       AND status IN ('in_fridge', 'out_fridge', 'mixing', 'viscosity_ok')
       AND created_at < (SELECT created_at FROM solder_paste WHERE id = ?)
       ORDER BY created_at ASC
       LIMIT 1`,
      [expirationDate, partNumber, pasteId, pasteId]
    );

    if (olderPastes.length > 0) {
      return {
        violation: true,
        message: `Existe una pasta más antigua (${new Date(olderPastes[0].created_at).toLocaleString('es-MX')}) con la misma fecha de vencimiento que debe ser usada primero (FEFO).`
      };
    }

    return { violation: false };
  } catch (error) {
    console.error('Error checking FEFO:', error);
    return { violation: false };
  }
}

/**
 * POST /api/pastes/:id/scan
 * Process a scan and update paste status
 */
router.post('/:id/scan', async (req, res) => {
  try {
    const pasteId = parseInt(req.params.id, 10);

    if (isNaN(pasteId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de pasta inválido',
      });
    }

    const { scan_type, viscosity_value, smt_location } = req.body;

    // Get current paste
    const results = await query(
      `SELECT * FROM solder_paste WHERE id = ?`,
      [pasteId]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pasta no encontrada',
      });
    }

    const paste = results[0];
    const currentStatus = paste.status;

    if (currentStatus === 'removed') {
      return res.status(400).json({
        success: false,
        error: 'Esta pasta ya completó todo el proceso',
      });
    }

    let updateQuery = '';
    let updateParams = [];
    let newStatus;
    let logNotes = '';

    switch (scan_type) {
      case 'fridge_out':
        if (currentStatus !== 'in_fridge') {
          return res.status(400).json({
            success: false,
            error: `No se puede registrar salida. Estado actual: ${currentStatus}`,
          });
        }

        // FEFO validation - check for earlier expiring pastes
        const earlierExpiringPastes = await query(
          `SELECT id, lot_number, lot_serial, expiration_date, part_number
           FROM solder_paste 
           WHERE status = 'in_fridge' AND id != ? AND expiration_date < ? AND part_number = ?
           ORDER BY expiration_date ASC LIMIT 5`,
          [pasteId, paste.expiration_date, paste.part_number]
        );

        if (earlierExpiringPastes.length > 0) {
          const pastesList = earlierExpiringPastes.map(p => {
            const expDate = new Date(p.expiration_date);
            const formattedDate = expDate.toLocaleDateString('es-MX');
            return `• Lote ${p.lot_number}-${p.lot_serial} (Vence: ${formattedDate})`;
          }).join('\n');

          const currentExpDate = new Date(paste.expiration_date);
          const currentFormattedDate = currentExpDate.toLocaleDateString('es-MX');

          return res.status(400).json({
            success: false,
            error: `⚠️ FEFO: Existen ${earlierExpiringPastes.length} pasta(s) con fecha de vencimiento anterior que deben usarse primero.\n\nPasta actual: Lote ${paste.lot_number}-${paste.lot_serial} (Vence: ${currentFormattedDate})\n\nDeben usarse primero:\n${pastesList}`,
            data: { fefoViolation: true, earlierExpiringPastes },
          });
        }

        // FIFO validation - check for older pastes with same expiration date
        const fefoCheck = await checkFEFO(pasteId, paste.expiration_date, paste.part_number);
        if (fefoCheck.violation) {
          return res.status(400).json({
            success: false,
            error: `⚠️ FIFO: ${fefoCheck.message}`,
            data: { fifoViolation: true },
          });
        }

        updateQuery = `UPDATE solder_paste SET fridge_out_datetime = NOW(), status = 'out_fridge' WHERE id = ?`;
        updateParams = [pasteId];
        newStatus = 'out_fridge';
        logNotes = 'Salida del refrigerador';
        break;

      case 'mixing_start':
        if (currentStatus !== 'out_fridge') {
          return res.status(400).json({
            success: false,
            error: `No se puede iniciar mezclado. Estado actual: ${currentStatus}`,
          });
        }

        // 4-hour validation
        if (paste.fridge_out_datetime) {
          const fridgeOutTime = new Date(paste.fridge_out_datetime);
          const now = new Date();
          const fourHoursMs = 4 * 60 * 60 * 1000;
          const elapsedMs = now.getTime() - fridgeOutTime.getTime();
          const remainingMs = fourHoursMs - elapsedMs;

          if (remainingMs > 0) {
            const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
            const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
            const remainingSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

            let timeMessage = '';
            if (remainingHours > 0) {
              timeMessage = `${remainingHours} hora${remainingHours !== 1 ? 's' : ''} y ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
            } else if (remainingMinutes > 0) {
              timeMessage = `${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''} y ${remainingSeconds} segundo${remainingSeconds !== 1 ? 's' : ''}`;
            } else {
              timeMessage = `${remainingSeconds} segundo${remainingSeconds !== 1 ? 's' : ''}`;
            }

            return res.status(400).json({
              success: false,
              error: `Debe esperar 4 horas después de sacar la pasta del refrigerador. Tiempo restante: ${timeMessage}`,
              data: { remainingMs, remainingTime: timeMessage },
            });
          }
        }

        updateQuery = `UPDATE solder_paste SET mixing_start_datetime = NOW(), status = 'mixing' WHERE id = ?`;
        updateParams = [pasteId];
        newStatus = 'mixing';
        logNotes = 'Inicio de mezclado';
        break;

      case 'viscosity_check':
        if (currentStatus !== 'mixing' && currentStatus !== 'rejected') {
          return res.status(400).json({
            success: false,
            error: `No se puede registrar viscosidad. Estado actual: ${currentStatus}`,
          });
        }

        if (viscosity_value === undefined || viscosity_value === null) {
          return res.status(400).json({
            success: false,
            error: 'Valor de viscosidad requerido',
          });
        }

        if (!isValidViscosity(viscosity_value)) {
          // Reject - out of range
          await query(
            `UPDATE solder_paste SET viscosity_value = ?, viscosity_datetime = NOW(), status = 'rejected' WHERE id = ?`,
            [viscosity_value, pasteId]
          );

          await query(
            `INSERT INTO scan_log (solder_paste_id, scan_type, notes) VALUES (?, ?, ?)`,
            [pasteId, 'viscosity_check', `Viscosidad rechazada: ${viscosity_value} (fuera de rango 150-180). Volver a mezclar.`]
          );

          const updatedPaste = await query(
            `SELECT * FROM solder_paste WHERE id = ?`,
            [pasteId]
          );

          return res.json({
            success: false,
            data: updatedPaste[0],
            error: `Viscosidad ${viscosity_value} fuera de rango. Debe estar entre 150-180. Por favor, vuelva a mezclar.`,
          });
        }

        updateQuery = `UPDATE solder_paste SET viscosity_value = ?, viscosity_datetime = NOW(), status = 'viscosity_ok' WHERE id = ?`;
        updateParams = [viscosity_value, pasteId];
        newStatus = 'viscosity_ok';
        logNotes = `Viscosidad aprobada: ${viscosity_value}`;
        break;

      case 'opened':
        if (currentStatus !== 'viscosity_ok') {
          return res.status(400).json({
            success: false,
            error: `No se puede registrar apertura. Estado actual: ${currentStatus}`,
          });
        }

        if (!smt_location) {
          return res.status(400).json({
            success: false,
            error: 'Debe seleccionar una línea de producción (SMT)',
          });
        }

        updateQuery = `UPDATE solder_paste SET opened_datetime = NOW(), smt_location = ?, status = 'opened' WHERE id = ?`;
        updateParams = [smt_location, pasteId];
        newStatus = 'opened';
        logNotes = `Contenedor abierto - Línea: ${smt_location}`;
        break;

      case 'removed':
        if (currentStatus !== 'opened') {
          return res.status(400).json({
            success: false,
            error: `No se puede registrar retiro. Estado actual: ${currentStatus}`,
          });
        }

        updateQuery = `UPDATE solder_paste SET removed_datetime = NOW(), status = 'removed' WHERE id = ?`;
        updateParams = [pasteId];
        newStatus = 'removed';
        logNotes = 'Retiro final completado';
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Tipo de escaneo no válido: ${scan_type}`,
        });
    }

    // Execute update
    await query(updateQuery, updateParams);

    // Log scan
    await query(
      `INSERT INTO scan_log (solder_paste_id, scan_type, notes) VALUES (?, ?, ?)`,
      [pasteId, scan_type, logNotes]
    );

    // Get updated record
    const updatedPaste = await query(
      `SELECT * FROM solder_paste WHERE id = ?`,
      [pasteId]
    );

    res.json({
      success: true,
      data: updatedPaste[0],
      message: logNotes,
    });
  } catch (error) {
    console.error('Error processing scan:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar el escaneo',
    });
  }
});

/**
 * GET /api/pastes/:id/scan
 * Get scan history for a paste
 */
router.get('/:id/scan', async (req, res) => {
  try {
    const pasteId = parseInt(req.params.id, 10);

    if (isNaN(pasteId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de pasta inválido',
      });
    }

    const logs = await query(
      `SELECT * FROM scan_log WHERE solder_paste_id = ? ORDER BY scan_datetime ASC`,
      [pasteId]
    );

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Error fetching scan logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el historial',
    });
  }
});

module.exports = router;
