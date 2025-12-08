/**
 * =====================================================
 * API Route: /api/part-lines/validate
 * =====================================================
 * Endpoint para validar si un número de parte es válido para una línea
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types';
import { RowDataPacket } from 'mysql2';

interface ValidationResult {
  isValid: boolean;
  partNumber: string;
  lineNumber: number;
  lineName?: string;
  validLines?: number[];
  message: string;
}

/**
 * POST /api/part-lines/validate
 * Valida si un número de parte puede usarse en una línea específica
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { part_number, line_number } = body;

    if (!part_number?.trim()) {
      return NextResponse.json<ApiResponse<ValidationResult>>(
        { 
          success: false, 
          error: 'El número de parte es requerido',
          data: {
            isValid: false,
            partNumber: part_number || '',
            lineNumber: line_number,
            message: 'El número de parte es requerido'
          }
        },
        { status: 400 }
      );
    }

    if (!line_number || isNaN(parseInt(line_number))) {
      return NextResponse.json<ApiResponse<ValidationResult>>(
        { 
          success: false, 
          error: 'El número de línea es requerido',
          data: {
            isValid: false,
            partNumber: part_number,
            lineNumber: line_number,
            message: 'El número de línea es requerido'
          }
        },
        { status: 400 }
      );
    }

    // Normalizar el número de parte (case insensitive)
    const normalizedPartNumber = part_number.trim().toUpperCase();
    const lineNum = parseInt(line_number);

    // Buscar el número de parte
    const partNumbers = await query<RowDataPacket[]>(
      `SELECT * FROM part_numbers WHERE UPPER(part_number) = ? AND is_active = TRUE`,
      [normalizedPartNumber]
    );

    if (partNumbers.length === 0) {
      // El número de parte no está registrado - permitir por defecto pero advertir
      return NextResponse.json<ApiResponse<ValidationResult>>({
        success: true,
        data: {
          isValid: true, // Por defecto permitimos partes no registradas
          partNumber: normalizedPartNumber,
          lineNumber: lineNum,
          message: 'Número de parte no registrado en el sistema. Se permite su uso.',
        },
      });
    }

    const partNumberId = partNumbers[0].id;

    // Buscar la línea de producción
    const productionLines = await query<RowDataPacket[]>(
      `SELECT * FROM production_lines WHERE line_number = ? AND is_active = TRUE`,
      [lineNum]
    );

    if (productionLines.length === 0) {
      return NextResponse.json<ApiResponse<ValidationResult>>(
        { 
          success: false, 
          error: 'Línea de producción no encontrada',
          data: {
            isValid: false,
            partNumber: normalizedPartNumber,
            lineNumber: lineNum,
            message: `La línea ${lineNum} no existe en el sistema`
          }
        },
        { status: 404 }
      );
    }

    const productionLineId = productionLines[0].id;
    const lineName = productionLines[0].line_name;

    // Verificar si existe la asignación
    const assignments = await query<RowDataPacket[]>(
      `SELECT * FROM part_line_assignments 
       WHERE part_number_id = ? AND production_line_id = ? AND is_valid = TRUE`,
      [partNumberId, productionLineId]
    );

    // Obtener todas las líneas válidas para este número de parte
    const validLinesResult = await query<RowDataPacket[]>(
      `SELECT pl.line_number
       FROM part_line_assignments pla
       JOIN production_lines pl ON pla.production_line_id = pl.id
       WHERE pla.part_number_id = ? AND pla.is_valid = TRUE AND pl.is_active = TRUE
       ORDER BY pl.line_number`,
      [partNumberId]
    );

    const validLines = validLinesResult.map(row => row.line_number);

    if (assignments.length === 0) {
      // No hay asignación válida
      const validLinesText = validLines.length > 0 
        ? `Líneas permitidas: ${validLines.join(', ')}`
        : 'No hay líneas asignadas para este número de parte';

      return NextResponse.json<ApiResponse<ValidationResult>>({
        success: false,
        error: `El número de parte ${normalizedPartNumber} NO está autorizado para la ${lineName}. ${validLinesText}`,
        data: {
          isValid: false,
          partNumber: normalizedPartNumber,
          lineNumber: lineNum,
          lineName: lineName,
          validLines: validLines,
          message: `El número de parte ${normalizedPartNumber} NO está autorizado para la ${lineName}. ${validLinesText}`,
        },
      });
    }

    // Asignación válida
    return NextResponse.json<ApiResponse<ValidationResult>>({
      success: true,
      data: {
        isValid: true,
        partNumber: normalizedPartNumber,
        lineNumber: lineNum,
        lineName: lineName,
        validLines: validLines,
        message: `Número de parte ${normalizedPartNumber} autorizado para ${lineName}`,
      },
    });

  } catch (error) {
    console.error('Error validating part-line:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al validar la asignación' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/part-lines/validate
 * Valida si un número de parte puede usarse en una línea específica (vía query params)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const part_number = searchParams.get('part_number');
  const line_number = searchParams.get('line_number');

  // Reutilizar la lógica de POST
  const mockRequest = {
    json: async () => ({ part_number, line_number }),
  } as NextRequest;

  return POST(mockRequest);
}
