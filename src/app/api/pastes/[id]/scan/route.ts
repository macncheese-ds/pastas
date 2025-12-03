/**
 * =====================================================
 * API Route: /api/pastes/[id]/scan
 * =====================================================
 * Endpoint para procesar escaneos de pastas existentes
 * Maneja las transiciones de estado según el flujo definido
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SolderPaste, ApiResponse, ScanType, SolderPasteStatus } from '@/types';
import { RowDataPacket } from 'mysql2';
import { isValidViscosity } from '@/lib/qrParser';

// Mapa de transiciones de estado válidas
const VALID_TRANSITIONS: Record<SolderPasteStatus, { nextStatus: SolderPasteStatus; scanType: ScanType }> = {
  in_fridge: { nextStatus: 'out_fridge', scanType: 'fridge_out' },
  out_fridge: { nextStatus: 'mixing', scanType: 'mixing_start' },
  mixing: { nextStatus: 'viscosity_ok', scanType: 'viscosity_check' },
  viscosity_ok: { nextStatus: 'opened', scanType: 'opened' },
  opened: { nextStatus: 'removed', scanType: 'removed' },
  removed: { nextStatus: 'removed', scanType: 'removed' }, // No hay más transiciones
  rejected: { nextStatus: 'viscosity_ok', scanType: 'viscosity_check' }, // Puede reintentar viscosidad
};

interface ScanRequestBody {
  scan_type: ScanType;
  viscosity_value?: number;
}

/**
 * POST /api/pastes/[id]/scan
 * Procesa un escaneo y actualiza el estado de la pasta
 */
export async function POST(
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

    const body: ScanRequestBody = await request.json();

    // Obtener el registro actual
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

    const paste = results[0] as SolderPaste;
    const currentStatus = paste.status;

    // Verificar si ya está en estado final
    if (currentStatus === 'removed') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Esta pasta ya completó todo el proceso' },
        { status: 400 }
      );
    }

    // Procesar según el tipo de escaneo
    let updateQuery = '';
    let updateParams: unknown[] = [];
    let newStatus: SolderPasteStatus;
    let logNotes = '';

    switch (body.scan_type) {
      case 'fridge_out':
        // Escaneo 2: Salida del refrigerador
        if (currentStatus !== 'in_fridge') {
          return NextResponse.json<ApiResponse>(
            { success: false, error: `No se puede registrar salida. Estado actual: ${currentStatus}` },
            { status: 400 }
          );
        }
        updateQuery = `UPDATE solder_paste SET 
          fridge_out_datetime = NOW(), 
          status = 'out_fridge'
          WHERE id = ?`;
        updateParams = [pasteId];
        newStatus = 'out_fridge';
        logNotes = 'Salida del refrigerador';
        break;

      case 'mixing_start':
        // Escaneo 3: Inicio de mezclado
        if (currentStatus !== 'out_fridge') {
          return NextResponse.json<ApiResponse>(
            { success: false, error: `No se puede iniciar mezclado. Estado actual: ${currentStatus}` },
            { status: 400 }
          );
        }
        
        // =====================================================
        // VALIDACIÓN DE 4 HORAS POST-REFRIGERACIÓN
        // =====================================================
        // La pasta debe esperar 4 horas fuera del refrigerador antes de mezclarse
        if (paste.fridge_out_datetime) {
          const fridgeOutTime = new Date(paste.fridge_out_datetime);
          const now = new Date();
          const fourHoursMs = 4 * 60 * 60 * 1000; // 4 horas en milisegundos
          const elapsedMs = now.getTime() - fridgeOutTime.getTime();
          const remainingMs = fourHoursMs - elapsedMs;
          
          if (remainingMs > 0) {
            // No han pasado las 4 horas, calcular tiempo restante
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
            
            return NextResponse.json<ApiResponse<{ remainingMs: number; remainingTime: string }>>(
              { 
                success: false, 
                error: `Debe esperar 4 horas después de sacar la pasta del refrigerador. Tiempo restante: ${timeMessage}`,
                data: {
                  remainingMs,
                  remainingTime: timeMessage
                }
              },
              { status: 400 }
            );
          }
        }
        // =====================================================
        
        updateQuery = `UPDATE solder_paste SET 
          mixing_start_datetime = NOW(), 
          status = 'mixing'
          WHERE id = ?`;
        updateParams = [pasteId];
        newStatus = 'mixing';
        logNotes = 'Inicio de mezclado';
        break;

      case 'viscosity_check':
        // Escaneo 4: Registro de viscosidad
        if (currentStatus !== 'mixing' && currentStatus !== 'rejected') {
          return NextResponse.json<ApiResponse>(
            { success: false, error: `No se puede registrar viscosidad. Estado actual: ${currentStatus}` },
            { status: 400 }
          );
        }

        if (body.viscosity_value === undefined || body.viscosity_value === null) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Valor de viscosidad requerido' },
            { status: 400 }
          );
        }

        // Validar rango de viscosidad (150-180)
        if (!isValidViscosity(body.viscosity_value)) {
          // Rechazar y marcar para volver a mezclar
          updateQuery = `UPDATE solder_paste SET 
            viscosity_value = ?,
            viscosity_datetime = NOW(),
            status = 'rejected'
            WHERE id = ?`;
          updateParams = [body.viscosity_value, pasteId];
          newStatus = 'rejected';
          logNotes = `Viscosidad rechazada: ${body.viscosity_value} (fuera de rango 150-180). Volver a mezclar.`;
          
          // Insertar registro y devolver respuesta de rechazo
          await query(updateQuery, updateParams);
          await query(
            `INSERT INTO scan_log (solder_paste_id, scan_type, notes) VALUES (?, ?, ?)`,
            [pasteId, 'viscosity_check', logNotes]
          );

          const updatedPaste = await query<RowDataPacket[]>(
            `SELECT * FROM solder_paste WHERE id = ?`,
            [pasteId]
          );

          return NextResponse.json<ApiResponse<SolderPaste>>({
            success: false,
            data: updatedPaste[0] as SolderPaste,
            error: `Viscosidad ${body.viscosity_value} fuera de rango. Debe estar entre 150-180. Por favor, vuelva a mezclar.`,
          });
        }

        // Viscosidad válida
        updateQuery = `UPDATE solder_paste SET 
          viscosity_value = ?,
          viscosity_datetime = NOW(),
          status = 'viscosity_ok'
          WHERE id = ?`;
        updateParams = [body.viscosity_value, pasteId];
        newStatus = 'viscosity_ok';
        logNotes = `Viscosidad aprobada: ${body.viscosity_value}`;
        break;

      case 'opened':
        // Escaneo 5: Apertura del contenedor
        if (currentStatus !== 'viscosity_ok') {
          return NextResponse.json<ApiResponse>(
            { success: false, error: `No se puede registrar apertura. Estado actual: ${currentStatus}` },
            { status: 400 }
          );
        }
        updateQuery = `UPDATE solder_paste SET 
          opened_datetime = NOW(), 
          status = 'opened'
          WHERE id = ?`;
        updateParams = [pasteId];
        newStatus = 'opened';
        logNotes = 'Contenedor abierto';
        break;

      case 'removed':
        // Escaneo 6: Retiro final
        if (currentStatus !== 'opened') {
          return NextResponse.json<ApiResponse>(
            { success: false, error: `No se puede registrar retiro. Estado actual: ${currentStatus}` },
            { status: 400 }
          );
        }
        updateQuery = `UPDATE solder_paste SET 
          removed_datetime = NOW(), 
          status = 'removed'
          WHERE id = ?`;
        updateParams = [pasteId];
        newStatus = 'removed';
        logNotes = 'Retiro final completado';
        break;

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Tipo de escaneo no válido: ${body.scan_type}` },
          { status: 400 }
        );
    }

    // Ejecutar actualización
    await query(updateQuery, updateParams);

    // Registrar en log de escaneos
    await query(
      `INSERT INTO scan_log (solder_paste_id, scan_type, notes) VALUES (?, ?, ?)`,
      [pasteId, body.scan_type, logNotes]
    );

    // Obtener el registro actualizado
    const updatedPaste = await query<RowDataPacket[]>(
      `SELECT * FROM solder_paste WHERE id = ?`,
      [pasteId]
    );

    return NextResponse.json<ApiResponse<SolderPaste>>({
      success: true,
      data: updatedPaste[0] as SolderPaste,
      message: logNotes,
    });

  } catch (error) {
    console.error('Error processing scan:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al procesar el escaneo' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pastes/[id]/scan
 * Obtiene el historial de escaneos de una pasta
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

    const logs = await query<RowDataPacket[]>(
      `SELECT * FROM scan_log 
       WHERE solder_paste_id = ? 
       ORDER BY scan_datetime ASC`,
      [pasteId]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: logs,
    });

  } catch (error) {
    console.error('Error fetching scan logs:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener el historial' },
      { status: 500 }
    );
  }
}
