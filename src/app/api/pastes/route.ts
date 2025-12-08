/**
 * =====================================================
 * API Route: /api/pastes
 * =====================================================
 * Endpoints para gestionar pastas de soldadura:
 * - GET: Obtener todas las pastas o buscar por lote/serial
 * - POST: Crear nuevo registro de pasta
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SolderPaste, CreateSolderPasteInput, ApiResponse } from '@/types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * GET /api/pastes
 * Obtiene todas las pastas o busca por lote y serial
 * Query params: lot_number, lot_serial
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lotNumber = searchParams.get('lot_number');
    const lotSerial = searchParams.get('lot_serial');

    // Si se proporciona lote y serial, buscar registro específico
    if (lotNumber && lotSerial) {
      const results = await query<RowDataPacket[]>(
        `SELECT * FROM solder_paste 
         WHERE lot_number = ? AND lot_serial = ?`,
        [lotNumber, lotSerial]
      );

      if (results.length === 0) {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: null,
          message: 'Pasta no encontrada',
        });
      }

      return NextResponse.json<ApiResponse<SolderPaste>>({
        success: true,
        data: results[0] as SolderPaste,
      });
    }

    // Obtener todas las pastas ordenadas por fecha de creación
    const results = await query<RowDataPacket[]>(
      `SELECT * FROM solder_paste 
       ORDER BY created_at DESC 
       LIMIT 100`
    );

    return NextResponse.json<ApiResponse<SolderPaste[]>>({
      success: true,
      data: results as SolderPaste[],
    });

  } catch (error) {
    console.error('Error fetching pastes:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error al obtener las pastas',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pastes
 * Crea un nuevo registro de pasta con entrada al refrigerador
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateSolderPasteInput = await request.json();

    // Validar campos requeridos (incluyendo DID)
    const requiredFields: (keyof CreateSolderPasteInput)[] = [
      'did',
      'lot_number',
      'part_number',
      'lot_serial',
      'manufacture_date',
      'expiration_date',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Campo requerido: ${field}`,
          },
          { status: 400 }
        );
      }
    }

    // Validar que el DID no esté vacío
    if (!body.did.trim()) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'El DID (Document Identification) es obligatorio',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // VALIDACIÓN DE PASTA VENCIDA
    // =====================================================
    // No permitir registrar pastas cuya fecha de expiración ya pasó
    const expirationDate = new Date(body.expiration_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);

    if (expirationDate < today) {
      const formattedExpDate = expirationDate.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `⚠️ No se puede registrar una pasta vencida.\n\nFecha de expiración: ${formattedExpDate}\n\nPor favor, deseche esta pasta y utilice una con fecha de expiración válida.`,
        },
        { status: 400 }
      );
    }

    // =====================================================
    // VALIDACIÓN DE PARTE-LÍNEA
    // =====================================================
    // Si hay una ubicación SMT, validar que el número de parte esté autorizado
    if (body.smt_location) {
      // Mapear SMT location a número de línea
      const smtToLineMap: Record<string, number> = {
        'SMT': 1,
        'SMT2': 2,
        'SMT3': 3,
        'SMT4': 4,
      };
      const lineNumber = smtToLineMap[body.smt_location];

      if (lineNumber) {
        // Buscar si el número de parte existe en la tabla de partes
        const partNumberRecord = await query<RowDataPacket[]>(
          `SELECT id FROM part_numbers WHERE UPPER(part_number) = ? AND is_active = TRUE`,
          [body.part_number.trim().toUpperCase()]
        );

        // Solo validar si el número de parte está registrado en el sistema
        if (partNumberRecord.length > 0) {
          const partNumberId = partNumberRecord[0].id;

          // Buscar la línea de producción
          const productionLine = await query<RowDataPacket[]>(
            `SELECT id, line_name FROM production_lines WHERE line_number = ? AND is_active = TRUE`,
            [lineNumber]
          );

          if (productionLine.length > 0) {
            const productionLineId = productionLine[0].id;
            const lineName = productionLine[0].line_name;

            // Verificar asignación
            const assignment = await query<RowDataPacket[]>(
              `SELECT id FROM part_line_assignments 
               WHERE part_number_id = ? AND production_line_id = ? AND is_valid = TRUE`,
              [partNumberId, productionLineId]
            );

            if (assignment.length === 0) {
              // Obtener líneas válidas para este número de parte
              const validLines = await query<RowDataPacket[]>(
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

              return NextResponse.json<ApiResponse>(
                {
                  success: false,
                  error: `⚠️ El número de parte ${body.part_number} NO está autorizado para ${lineName}. ${validLinesText}`,
                },
                { status: 400 }
              );
            }
          }
        }
      }
    }
    // =====================================================

    // Verificar si ya existe
    const existing = await query<RowDataPacket[]>(
      `SELECT id FROM solder_paste 
       WHERE lot_number = ? AND lot_serial = ?`,
      [body.lot_number, body.lot_serial]
    );

    if (existing.length > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Ya existe un registro con este lote y serial',
        },
        { status: 409 }
      );
    }

    // Insertar nuevo registro con timestamp de entrada al refrigerador
    // Incluye DID y ubicación SMT
    const result = await query<ResultSetHeader>(
      `INSERT INTO solder_paste (
        did, lot_number, part_number, lot_serial,
        smt_location, manufacture_date, expiration_date,
        fridge_in_datetime, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'in_fridge')`,
      [
        body.did.trim(),
        body.lot_number,
        body.part_number,
        body.lot_serial,
        body.smt_location || null,
        body.manufacture_date,
        body.expiration_date,
      ]
    );

    // Obtener el registro creado
    const newPaste = await query<RowDataPacket[]>(
      `SELECT * FROM solder_paste WHERE id = ?`,
      [result.insertId]
    );

    // Registrar en log de escaneos
    await query(
      `INSERT INTO scan_log (solder_paste_id, scan_type, notes)
       VALUES (?, 'fridge_in', ?)`,
      [result.insertId, `Registro inicial - DID: ${body.did.trim()} - Entrada a refrigerador`]
    );

    return NextResponse.json<ApiResponse<SolderPaste>>(
      {
        success: true,
        data: newPaste[0] as SolderPaste,
        message: 'Pasta registrada exitosamente',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating paste:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error al crear el registro',
      },
      { status: 500 }
    );
  }
}
