/**
 * =====================================================
 * API Route: /api/pastes/[id]
 * =====================================================
 * Endpoints para operaciones CRUD individuales
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SolderPaste, ApiResponse } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * GET /api/pastes/[id]
 * Obtiene una pasta por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pasteId = parseInt(id, 10);

    if (isNaN(pasteId)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ID de pasta inválido' },
        { status: 400 }
      );
    }

    const results = await query<RowDataPacket[]>(
      `SELECT * FROM solder_paste WHERE id = ?`,
      [pasteId]
    );

    if (results.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Pasta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<SolderPaste>>({
      success: true,
      data: results[0] as SolderPaste,
    });

  } catch (error) {
    console.error('Error fetching paste:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener la pasta' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pastes/[id]
 * Elimina una pasta por ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pasteId = parseInt(id, 10);

    if (isNaN(pasteId)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ID de pasta inválido' },
        { status: 400 }
      );
    }

    await query(`DELETE FROM solder_paste WHERE id = ?`, [pasteId]);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Pasta eliminada correctamente',
    });

  } catch (error) {
    console.error('Error deleting paste:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al eliminar la pasta' },
      { status: 500 }
    );
  }
}
