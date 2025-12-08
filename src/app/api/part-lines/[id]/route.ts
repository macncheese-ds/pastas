/**
 * =====================================================
 * API Route: /api/part-lines/[id]
 * =====================================================
 * Endpoints para gestionar un número de parte específico:
 * - GET: Obtener un número de parte con sus líneas
 * - PUT: Actualizar número de parte y sus líneas
 * - DELETE: Eliminar número de parte
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types';
import { RowDataPacket } from 'mysql2';

interface PartNumberWithLines {
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

/**
 * GET /api/part-lines/[id]
 * Obtiene un número de parte específico con sus líneas
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partId = parseInt(id, 10);

    if (isNaN(partId)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const partNumbers = await query<RowDataPacket[]>(
      `SELECT * FROM part_numbers WHERE id = ?`,
      [partId]
    );

    if (partNumbers.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Número de parte no encontrado' },
        { status: 404 }
      );
    }

    const assignedLines = await query<RowDataPacket[]>(
      `SELECT pla.*, pl.line_number, pl.line_name
       FROM part_line_assignments pla
       JOIN production_lines pl ON pla.production_line_id = pl.id
       WHERE pla.part_number_id = ? AND pla.is_valid = TRUE`,
      [partId]
    );

    const partWithLines: PartNumberWithLines = {
      ...partNumbers[0] as PartNumberWithLines,
      lines: assignedLines.map((a) => ({
        line_id: a.production_line_id,
        line_number: a.line_number,
        line_name: a.line_name,
        is_valid: a.is_valid,
      })),
    };

    return NextResponse.json<ApiResponse<PartNumberWithLines>>({
      success: true,
      data: partWithLines,
    });

  } catch (error) {
    console.error('Error fetching part number:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener el número de parte' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/part-lines/[id]
 * Actualiza un número de parte y sus líneas asignadas
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partId = parseInt(id, 10);

    if (isNaN(partId)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { part_number, description, line_ids, is_active } = body;

    // Verificar que existe
    const existing = await query<RowDataPacket[]>(
      `SELECT * FROM part_numbers WHERE id = ?`,
      [partId]
    );

    if (existing.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Número de parte no encontrado' },
        { status: 404 }
      );
    }

    // Verificar duplicado si cambia el número de parte
    if (part_number && part_number.trim().toUpperCase() !== existing[0].part_number) {
      const duplicate = await query<RowDataPacket[]>(
        `SELECT id FROM part_numbers WHERE part_number = ? AND id != ?`,
        [part_number.trim().toUpperCase(), partId]
      );

      if (duplicate.length > 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Ya existe otro número de parte con ese valor' },
          { status: 409 }
        );
      }
    }

    // Actualizar número de parte
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

    // Actualizar asignaciones de líneas si se proporcionan
    if (Array.isArray(line_ids)) {
      // Eliminar asignaciones anteriores
      await query(
        `DELETE FROM part_line_assignments WHERE part_number_id = ?`,
        [partId]
      );

      // Insertar nuevas asignaciones individualmente
      if (line_ids.length > 0) {
        for (const lineId of line_ids) {
          await query(
            `INSERT INTO part_line_assignments (part_number_id, production_line_id, is_valid) VALUES (?, ?, TRUE)`,
            [partId, lineId]
          );
        }
      }
    }

    // Obtener el registro actualizado
    const updatedPart = await query<RowDataPacket[]>(
      `SELECT * FROM part_numbers WHERE id = ?`,
      [partId]
    );

    const assignedLines = await query<RowDataPacket[]>(
      `SELECT pla.*, pl.line_number, pl.line_name
       FROM part_line_assignments pla
       JOIN production_lines pl ON pla.production_line_id = pl.id
       WHERE pla.part_number_id = ? AND pla.is_valid = TRUE`,
      [partId]
    );

    const partWithLines: PartNumberWithLines = {
      ...updatedPart[0] as PartNumberWithLines,
      lines: assignedLines.map((a) => ({
        line_id: a.production_line_id,
        line_number: a.line_number,
        line_name: a.line_name,
        is_valid: a.is_valid,
      })),
    };

    return NextResponse.json<ApiResponse<PartNumberWithLines>>({
      success: true,
      data: partWithLines,
      message: 'Número de parte actualizado exitosamente',
    });

  } catch (error) {
    console.error('Error updating part number:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al actualizar el número de parte' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/part-lines/[id]
 * Elimina un número de parte (soft delete - desactiva)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partId = parseInt(id, 10);

    if (isNaN(partId)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar que existe
    const existing = await query<RowDataPacket[]>(
      `SELECT * FROM part_numbers WHERE id = ?`,
      [partId]
    );

    if (existing.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Número de parte no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete - desactivar
    await query(
      `UPDATE part_numbers SET is_active = FALSE WHERE id = ?`,
      [partId]
    );

    // Desactivar asignaciones
    await query(
      `UPDATE part_line_assignments SET is_valid = FALSE WHERE part_number_id = ?`,
      [partId]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Número de parte eliminado exitosamente',
    });

  } catch (error) {
    console.error('Error deleting part number:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al eliminar el número de parte' },
      { status: 500 }
    );
  }
}
