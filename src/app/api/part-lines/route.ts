/**
 * =====================================================
 * API Route: /api/part-lines
 * =====================================================
 * Endpoints para gestionar la relación entre números de parte y líneas:
 * - GET: Obtener todos los números de parte con sus líneas asignadas
 * - POST: Crear nuevo número de parte
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Tipo para número de parte con sus líneas
export interface PartNumberWithLines {
  id: number;
  part_number: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  lines: {
    line_id: number;
    line_number: number;
    line_name: string;
    is_valid: boolean;
  }[];
}

// Tipo para línea de producción
export interface ProductionLine {
  id: number;
  line_number: number;
  line_name: string;
  smt_location: string | null;
  is_active: boolean;
}

/**
 * GET /api/part-lines
 * Obtiene todos los números de parte con sus líneas asignadas
 */
export async function GET() {
  try {
    // Obtener todos los números de parte
    const partNumbers = await query<RowDataPacket[]>(
      `SELECT * FROM part_numbers WHERE is_active = TRUE ORDER BY part_number`
    );

    // Obtener todas las líneas de producción
    const lines = await query<RowDataPacket[]>(
      `SELECT * FROM production_lines WHERE is_active = TRUE ORDER BY line_number`
    );

    // Obtener todas las asignaciones
    const assignments = await query<RowDataPacket[]>(
      `SELECT pla.*, pn.part_number, pl.line_number, pl.line_name
       FROM part_line_assignments pla
       JOIN part_numbers pn ON pla.part_number_id = pn.id
       JOIN production_lines pl ON pla.production_line_id = pl.id
       WHERE pla.is_valid = TRUE`
    );

    // Construir la respuesta con las líneas asignadas a cada parte
    const partsWithLines: PartNumberWithLines[] = partNumbers.map((pn) => ({
      id: pn.id,
      part_number: pn.part_number,
      description: pn.description,
      is_active: pn.is_active,
      created_at: pn.created_at,
      updated_at: pn.updated_at,
      lines: assignments
        .filter((a) => a.part_number_id === pn.id)
        .map((a) => ({
          line_id: a.production_line_id,
          line_number: a.line_number,
          line_name: a.line_name,
          is_valid: a.is_valid,
        })),
    }));

    return NextResponse.json<ApiResponse<{
      partNumbers: PartNumberWithLines[];
      productionLines: ProductionLine[];
    }>>({
      success: true,
      data: {
        partNumbers: partsWithLines,
        productionLines: lines as ProductionLine[],
      },
    });

  } catch (error) {
    console.error('Error fetching part-lines:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener datos de partes y líneas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/part-lines
 * Crea un nuevo número de parte con sus líneas asignadas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { part_number, description, line_ids } = body;

    if (!part_number?.trim()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'El número de parte es requerido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existing = await query<RowDataPacket[]>(
      `SELECT id FROM part_numbers WHERE part_number = ?`,
      [part_number.trim().toUpperCase()]
    );

    if (existing.length > 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Ya existe un número de parte con ese valor' },
        { status: 409 }
      );
    }

    // Insertar nuevo número de parte
    const result = await query<ResultSetHeader>(
      `INSERT INTO part_numbers (part_number, description, is_active) VALUES (?, ?, TRUE)`,
      [part_number.trim().toUpperCase(), description?.trim() || null]
    );

    const partNumberId = result.insertId;

    // Asignar líneas si se proporcionan
    if (Array.isArray(line_ids) && line_ids.length > 0) {
      // Insertar cada asignación individualmente
      for (const lineId of line_ids) {
        await query(
          `INSERT INTO part_line_assignments (part_number_id, production_line_id, is_valid) VALUES (?, ?, TRUE)`,
          [partNumberId, lineId]
        );
      }
    }

    // Obtener el registro creado con sus líneas
    const newPart = await query<RowDataPacket[]>(
      `SELECT * FROM part_numbers WHERE id = ?`,
      [partNumberId]
    );

    const assignedLines = await query<RowDataPacket[]>(
      `SELECT pla.*, pl.line_number, pl.line_name
       FROM part_line_assignments pla
       JOIN production_lines pl ON pla.production_line_id = pl.id
       WHERE pla.part_number_id = ? AND pla.is_valid = TRUE`,
      [partNumberId]
    );

    const partWithLines: PartNumberWithLines = {
      ...newPart[0] as PartNumberWithLines,
      lines: assignedLines.map((a) => ({
        line_id: a.production_line_id,
        line_number: a.line_number,
        line_name: a.line_name,
        is_valid: a.is_valid,
      })),
    };

    return NextResponse.json<ApiResponse<PartNumberWithLines>>(
      {
        success: true,
        data: partWithLines,
        message: 'Número de parte creado exitosamente',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating part number:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al crear el número de parte' },
      { status: 500 }
    );
  }
}
