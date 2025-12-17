/**
 * =====================================================
 * API Routes: /api/part-lines
 * =====================================================
 * Endpoints for managing part numbers and production lines
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db');

// ============================================
// SPECIFIC ROUTES (must come before /:id)
// ============================================

/**
 * GET /api/part-lines/authorized
 * Get authorized lines for a part number
 */
router.get('/authorized', async (req, res) => {
  try {
    const { part_number } = req.query;

    if (!part_number) {
      return res.status(400).json({
        error: 'Se requiere part_number',
      });
    }

    // Get the part number ID
    const partNumberRecord = await query(
      `SELECT id FROM part_numbers WHERE UPPER(part_number) = ? AND is_active = TRUE`,
      [part_number.trim().toUpperCase()]
    );

    if (partNumberRecord.length === 0) {
      return res.json({
        data: [],
      });
    }

    // Get authorized lines with details
    const authorizedLines = await query(
      `SELECT 
        pl.id as line_id,
        pl.line_name,
        pl.smt_location as smt_code
      FROM production_lines pl
      INNER JOIN part_line_assignments pla ON pl.id = pla.production_line_id
      WHERE pla.part_number_id = ? AND pl.is_active = TRUE AND pla.is_valid = TRUE
      ORDER BY pl.line_name`,
      [partNumberRecord[0].id]
    );

    res.json({
      data: authorizedLines,
    });
  } catch (error) {
    console.error('Error fetching authorized lines:', error);
    res.status(500).json({
      error: 'Error al obtener líneas autorizadas',
    });
  }
});

/**
 * POST /api/part-lines/validate
 * Validate if a part number is authorized for a specific line
 */
router.post('/validate', async (req, res) => {
  try {
    const { part_number, line_number } = req.body;

    if (!part_number || line_number === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere part_number y line_number',
      });
    }

    const normalizedPartNumber = part_number.trim().toUpperCase();
    const lineNum = parseInt(line_number, 10);

    if (isNaN(lineNum)) {
      return res.status(400).json({
        success: false,
        error: 'line_number debe ser un número',
      });
    }

    const partNumberRecord = await query(
      `SELECT id FROM part_numbers WHERE UPPER(part_number) = ? AND is_active = TRUE`,
      [normalizedPartNumber]
    );

    if (partNumberRecord.length === 0) {
      return res.json({
        success: true,
        data: {
          isValid: false,
          partNumber: normalizedPartNumber,
          lineNumber: lineNum,
          message: `Número de parte ${normalizedPartNumber} no encontrado en el sistema`,
        },
      });
    }

    const partNumberId = partNumberRecord[0].id;

    const productionLine = await query(
      `SELECT id, line_name FROM production_lines WHERE line_number = ? AND is_active = TRUE`,
      [lineNum]
    );

    if (productionLine.length === 0) {
      return res.json({
        success: true,
        data: {
          isValid: false,
          partNumber: normalizedPartNumber,
          lineNumber: lineNum,
          message: `Línea de producción ${lineNum} no encontrada`,
        },
      });
    }

    const productionLineId = productionLine[0].id;
    const lineName = productionLine[0].line_name;

    const assignment = await query(
      `SELECT id FROM part_line_assignments 
       WHERE part_number_id = ? AND production_line_id = ? AND is_valid = TRUE`,
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

      return res.json({
        success: true,
        data: {
          isValid: false,
          partNumber: normalizedPartNumber,
          lineNumber: lineNum,
          lineName,
          validLines: validLines.map(l => l.line_number),
          message: `El número de parte ${normalizedPartNumber} NO está autorizado para ${lineName}. Líneas válidas: ${validLines.map(l => l.line_name).join(', ') || 'ninguna'}`,
        },
      });
    }

    res.json({
      success: true,
      data: {
        isValid: true,
        partNumber: normalizedPartNumber,
        lineNumber: lineNum,
        lineName,
        message: `Número de parte válido para ${lineName}`,
      },
    });
  } catch (error) {
    console.error('Error validating part-line:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar',
    });
  }
});

/**
 * GET /api/part-lines/part-numbers
 * Get all part numbers
 */
router.get('/part-numbers', async (req, res) => {
  try {
    const results = await query(
      `SELECT * FROM part_numbers WHERE is_active = TRUE ORDER BY part_number`
    );
    res.json(results);
  } catch (error) {
    console.error('Error fetching part numbers:', error);
    res.status(500).json({ error: 'Error al obtener números de parte' });
  }
});

/**
 * POST /api/part-lines/part-numbers
 * Create new part number
 */
router.post('/part-numbers', async (req, res) => {
  try {
    const { part_number, description, line_ids } = req.body;

    if (!part_number?.trim()) {
      return res.status(400).json({ error: 'El número de parte es requerido' });
    }

    if (!Array.isArray(line_ids) || line_ids.length === 0) {
      return res.status(400).json({ error: 'Se debe seleccionar al menos una línea' });
    }

    const existing = await query(
      `SELECT id FROM part_numbers WHERE part_number = ?`,
      [part_number.trim().toUpperCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe ese número de parte' });
    }

    const result = await query(
      `INSERT INTO part_numbers (part_number, description) VALUES (?, ?)`,
      [part_number.trim().toUpperCase(), description?.trim() || null]
    );

    const partNumberId = result.insertId;

    // Create assignments for selected lines
    for (const lineId of line_ids) {
      await query(
        `INSERT IGNORE INTO part_line_assignments (part_number_id, production_line_id, is_valid) VALUES (?, ?, TRUE)`,
        [partNumberId, lineId]
      );
    }

    res.status(201).json({
      id: partNumberId,
      part_number: part_number.trim().toUpperCase(),
      description: description?.trim() || null,
      is_active: true,
    });
  } catch (error) {
    console.error('Error creating part number:', error);
    res.status(500).json({ error: 'Error al crear número de parte' });
  }
});

/**
 * PUT /api/part-lines/part-numbers/:id
 * Update part number and its line assignments
 */
router.put('/part-numbers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { part_number, description, line_ids } = req.body;

    if (!part_number?.trim()) {
      return res.status(400).json({ error: 'El número de parte es requerido' });
    }

    if (!Array.isArray(line_ids) || line_ids.length === 0) {
      return res.status(400).json({ error: 'Se debe seleccionar al menos una línea' });
    }

    // Check if part number exists and is not being duplicated
    const existing = await query(
      `SELECT id FROM part_numbers WHERE part_number = ? AND id != ?`,
      [part_number.trim().toUpperCase(), id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe ese número de parte' });
    }

    // Update part number and description
    await query(
      `UPDATE part_numbers SET part_number = ?, description = ? WHERE id = ?`,
      [part_number.trim().toUpperCase(), description?.trim() || null, id]
    );

    // Delete existing assignments
    await query(
      `DELETE FROM part_line_assignments WHERE part_number_id = ?`,
      [id]
    );

    // Create new assignments for selected lines
    for (const lineId of line_ids) {
      await query(
        `INSERT IGNORE INTO part_line_assignments (part_number_id, production_line_id, is_valid) VALUES (?, ?, TRUE)`,
        [id, lineId]
      );
    }

    res.json({ message: 'Número de parte actualizado' });
  } catch (error) {
    console.error('Error updating part number:', error);
    res.status(500).json({ error: 'Error al actualizar número de parte' });
  }
});

/**
 * DELETE /api/part-lines/part-numbers/:id
 * Delete part number
 */
router.delete('/part-numbers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await query(
      `UPDATE part_numbers SET is_active = FALSE WHERE id = ?`,
      [id]
    );

    res.json({ message: 'Número de parte eliminado' });
  } catch (error) {
    console.error('Error deleting part number:', error);
    res.status(500).json({ error: 'Error al eliminar número de parte' });
  }
});

/**
 * GET /api/part-lines/production-lines
 * Get all production lines
 */
router.get('/production-lines', async (req, res) => {
  try {
    const results = await query(
      `SELECT * FROM production_lines WHERE is_active = TRUE ORDER BY line_number`
    );
    res.json(results);
  } catch (error) {
    console.error('Error fetching production lines:', error);
    res.status(500).json({ error: 'Error al obtener líneas de producción' });
  }
});

/**
 * POST /api/part-lines/production-lines
 * Create new production line
 */
router.post('/production-lines', async (req, res) => {
  try {
    const { line_name } = req.body;

    if (!line_name?.trim()) {
      return res.status(400).json({ error: 'El nombre de la línea es requerido' });
    }

    const existing = await query(
      `SELECT id FROM production_lines WHERE line_name = ?`,
      [line_name.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe esa línea de producción' });
    }

    const maxLine = await query(
      `SELECT MAX(line_number) as max_num FROM production_lines`
    );
    const nextLineNumber = (maxLine[0]?.max_num || 0) + 1;

    const result = await query(
      `INSERT INTO production_lines (line_name, line_number) VALUES (?, ?)`,
      [line_name.trim(), nextLineNumber]
    );

    res.status(201).json({
      id: result.insertId,
      line_name: line_name.trim(),
      line_number: nextLineNumber,
      is_active: true,
    });
  } catch (error) {
    console.error('Error creating production line:', error);
    res.status(500).json({ error: 'Error al crear línea de producción' });
  }
});

/**
 * DELETE /api/part-lines/production-lines/:id
 * Delete production line
 */
router.delete('/production-lines/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await query(
      `UPDATE production_lines SET is_active = FALSE WHERE id = ?`,
      [id]
    );

    res.json({ message: 'Línea de producción eliminada' });
  } catch (error) {
    console.error('Error deleting production line:', error);
    res.status(500).json({ error: 'Error al eliminar línea de producción' });
  }
});

/**
 * GET /api/part-lines/assignments
 * Get all part-line assignments
 */
router.get('/assignments', async (req, res) => {
  try {
    const results = await query(
      `SELECT pla.id, pla.part_number_id, pla.production_line_id as line_id, pla.is_valid, 
              pn.part_number, pl.line_name
       FROM part_line_assignments pla
       JOIN part_numbers pn ON pla.part_number_id = pn.id
       JOIN production_lines pl ON pla.production_line_id = pl.id
       WHERE pla.is_valid = TRUE
       ORDER BY pn.part_number, pl.line_number`
    );
    res.json(results);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Error al obtener asignaciones' });
  }
});

/**
 * POST /api/part-lines/assignments
 * Create new part-line assignment
 */
router.post('/assignments', async (req, res) => {
  try {
    const { part_number_id, line_id } = req.body;

    if (!part_number_id || !line_id) {
      return res.status(400).json({ error: 'Parte y línea son requeridos' });
    }

    const existing = await query(
      `SELECT id FROM part_line_assignments 
       WHERE part_number_id = ? AND production_line_id = ? AND is_valid = TRUE`,
      [part_number_id, line_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe esa asignación' });
    }

    const result = await query(
      `INSERT INTO part_line_assignments (part_number_id, production_line_id) VALUES (?, ?)`,
      [part_number_id, line_id]
    );

    res.status(201).json({
      id: result.insertId,
      part_number_id,
      production_line_id: line_id,
      is_valid: true,
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Error al crear asignación' });
  }
});

/**
 * DELETE /api/part-lines/assignments/:id
 * Delete part-line assignment
 */
router.delete('/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await query(
      `UPDATE part_line_assignments SET is_valid = FALSE WHERE id = ?`,
      [id]
    );

    res.json({ message: 'Asignación eliminada' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Error al eliminar asignación' });
  }
});

// ============================================
// GENERIC ROUTES (must come after specific)
// ============================================

/**
 * GET /api/part-lines
 * Get all part numbers with their assigned lines
 */
router.get('/', async (req, res) => {
  try {
    // Get all part numbers
    const partNumbers = await query(
      `SELECT * FROM part_numbers WHERE is_active = TRUE ORDER BY part_number`
    );

    // Get all production lines
    const lines = await query(
      `SELECT * FROM production_lines WHERE is_active = TRUE ORDER BY line_number`
    );

    // Get all assignments
    const assignments = await query(
      `SELECT pla.*, pn.part_number, pl.line_number, pl.line_name
       FROM part_line_assignments pla
       JOIN part_numbers pn ON pla.part_number_id = pn.id
       JOIN production_lines pl ON pla.production_line_id = pl.id
       WHERE pla.is_valid = TRUE`
    );

    // Build response with lines assigned to each part
    const partsWithLines = partNumbers.map(pn => ({
      id: pn.id,
      part_number: pn.part_number,
      description: pn.description,
      is_active: pn.is_active,
      created_at: pn.created_at,
      updated_at: pn.updated_at,
      lines: assignments
        .filter(a => a.part_number_id === pn.id)
        .map(a => ({
          line_id: a.production_line_id,
          line_number: a.line_number,
          line_name: a.line_name,
          is_valid: a.is_valid,
        })),
    }));

    res.json({
      success: true,
      data: {
        partNumbers: partsWithLines,
        productionLines: lines,
      },
    });
  } catch (error) {
    console.error('Error fetching part-lines:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener datos de partes y líneas',
    });
  }
});

/**
 * POST /api/part-lines
 * Create new part number with assigned lines
 */
router.post('/', async (req, res) => {
  try {
    const { part_number, description, line_ids } = req.body;

    if (!part_number?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El número de parte es requerido',
      });
    }

    // Check if already exists
    const existing = await query(
      `SELECT id FROM part_numbers WHERE part_number = ?`,
      [part_number.trim().toUpperCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un número de parte con ese valor',
      });
    }

    // Insert new part number
    const result = await query(
      `INSERT INTO part_numbers (part_number, description, is_active) VALUES (?, ?, TRUE)`,
      [part_number.trim().toUpperCase(), description?.trim() || null]
    );

    const partNumberId = result.insertId;

    // Assign lines if provided
    if (Array.isArray(line_ids) && line_ids.length > 0) {
      for (const lineId of line_ids) {
        await query(
          `INSERT INTO part_line_assignments (part_number_id, production_line_id, is_valid) VALUES (?, ?, TRUE)`,
          [partNumberId, lineId]
        );
      }
    }

    // Get created record with lines
    const newPart = await query(
      `SELECT * FROM part_numbers WHERE id = ?`,
      [partNumberId]
    );

    const assignedLines = await query(
      `SELECT pla.*, pl.line_number, pl.line_name
       FROM part_line_assignments pla
       JOIN production_lines pl ON pla.production_line_id = pl.id
       WHERE pla.part_number_id = ? AND pla.is_valid = TRUE`,
      [partNumberId]
    );

    const partWithLines = {
      ...newPart[0],
      lines: assignedLines.map(a => ({
        line_id: a.production_line_id,
        line_number: a.line_number,
        line_name: a.line_name,
        is_valid: a.is_valid,
      })),
    };

    res.status(201).json({
      success: true,
      data: partWithLines,
      message: 'Número de parte creado exitosamente',
    });
  } catch (error) {
    console.error('Error creating part number:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el número de parte',
    });
  }
});

/**
 * GET /api/part-lines/:id
 * Get specific part number with lines
 */
router.get('/:id', async (req, res) => {
  try {
    const partId = parseInt(req.params.id, 10);

    if (isNaN(partId)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido',
      });
    }

    const partNumbers = await query(
      `SELECT * FROM part_numbers WHERE id = ?`,
      [partId]
    );

    if (partNumbers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Número de parte no encontrado',
      });
    }

    const assignedLines = await query(
      `SELECT pla.*, pl.line_number, pl.line_name
       FROM part_line_assignments pla
       JOIN production_lines pl ON pla.production_line_id = pl.id
       WHERE pla.part_number_id = ? AND pla.is_valid = TRUE`,
      [partId]
    );

    const partWithLines = {
      ...partNumbers[0],
      lines: assignedLines.map(a => ({
        line_id: a.production_line_id,
        line_number: a.line_number,
        line_name: a.line_name,
        is_valid: a.is_valid,
      })),
    };

    res.json({
      success: true,
      data: partWithLines,
    });
  } catch (error) {
    console.error('Error fetching part number:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el número de parte',
    });
  }
});

/**
 * PUT /api/part-lines/:id
 * Update part number and assigned lines
 */
router.put('/:id', async (req, res) => {
  try {
    const partId = parseInt(req.params.id, 10);

    if (isNaN(partId)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido',
      });
    }

    const { part_number, description, line_ids, is_active } = req.body;

    // Verify exists
    const existing = await query(
      `SELECT * FROM part_numbers WHERE id = ?`,
      [partId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Número de parte no encontrado',
      });
    }

    // Check for duplicate if changing part number
    if (part_number && part_number.trim().toUpperCase() !== existing[0].part_number) {
      const duplicate = await query(
        `SELECT id FROM part_numbers WHERE part_number = ? AND id != ?`,
        [part_number.trim().toUpperCase(), partId]
      );

      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Ya existe otro número de parte con ese valor',
        });
      }
    }

    // Update part number
    await query(
      `UPDATE part_numbers SET 
        part_number = COALESCE(?, part_number),
        description = COALESCE(?, description),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        part_number?.trim().toUpperCase() || null,
        description?.trim() || null,
        is_active ?? null,
        partId,
      ]
    );

    // Update line assignments if provided
    if (Array.isArray(line_ids)) {
      // Remove previous assignments
      await query(
        `DELETE FROM part_line_assignments WHERE part_number_id = ?`,
        [partId]
      );

      // Insert new assignments
      if (line_ids.length > 0) {
        for (const lineId of line_ids) {
          await query(
            `INSERT INTO part_line_assignments (part_number_id, production_line_id, is_valid) VALUES (?, ?, TRUE)`,
            [partId, lineId]
          );
        }
      }
    }

    // Get updated record
    const updatedPart = await query(
      `SELECT * FROM part_numbers WHERE id = ?`,
      [partId]
    );

    const assignedLines = await query(
      `SELECT pla.*, pl.line_number, pl.line_name
       FROM part_line_assignments pla
       JOIN production_lines pl ON pla.production_line_id = pl.id
       WHERE pla.part_number_id = ? AND pla.is_valid = TRUE`,
      [partId]
    );

    const partWithLines = {
      ...updatedPart[0],
      lines: assignedLines.map(a => ({
        line_id: a.production_line_id,
        line_number: a.line_number,
        line_name: a.line_name,
        is_valid: a.is_valid,
      })),
    };

    res.json({
      success: true,
      data: partWithLines,
      message: 'Número de parte actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error updating part number:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el número de parte',
    });
  }
});

/**
 * DELETE /api/part-lines/:id
 * Delete part number
 */
router.delete('/:id', async (req, res) => {
  try {
    const partId = parseInt(req.params.id, 10);

    if (isNaN(partId)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido',
      });
    }

    // Delete assignments first
    await query(
      `DELETE FROM part_line_assignments WHERE part_number_id = ?`,
      [partId]
    );

    // Delete part number
    await query(
      `DELETE FROM part_numbers WHERE id = ?`,
      [partId]
    );

    res.json({
      success: true,
      message: 'Número de parte eliminado correctamente',
    });
  } catch (error) {
    console.error('Error deleting part number:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el número de parte',
    });
  }
});

module.exports = router;
