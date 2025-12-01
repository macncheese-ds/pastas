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

    // Validar campos requeridos
    const requiredFields: (keyof CreateSolderPasteInput)[] = [
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
    const result = await query<ResultSetHeader>(
      `INSERT INTO solder_paste (
        lot_number, part_number, lot_serial,
        manufacture_date, expiration_date,
        fridge_in_datetime, status
      ) VALUES (?, ?, ?, ?, ?, NOW(), 'in_fridge')`,
      [
        body.lot_number,
        body.part_number,
        body.lot_serial,
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
       VALUES (?, 'fridge_in', 'Registro inicial - Entrada a refrigerador')`,
      [result.insertId]
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
