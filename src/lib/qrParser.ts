/**
 * =====================================================
 * Utilidades para Parseo de Códigos QR
 * =====================================================
 * Funciones para parsear y validar datos de códigos QR
 * de pastas de soldadura SMT
 */

import { ParsedQRData } from '@/types';

/**
 * Convierte fecha de formato YYMMDD a YYYY-MM-DD
 * @param yymmdd - Fecha en formato YYMMDD (ej: 260218)
 * @returns Fecha en formato ISO YYYY-MM-DD
 */
export function parseYYMMDD(yymmdd: string): string {
  if (yymmdd.length !== 6) {
    throw new Error(`Formato de fecha inválido: ${yymmdd}. Se esperaba YYMMDD`);
  }

  const year = parseInt(yymmdd.substring(0, 2), 10);
  const month = yymmdd.substring(2, 4);
  const day = yymmdd.substring(4, 6);

  // Asumimos años 2000+
  const fullYear = 2000 + year;

  // Validar mes y día
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);

  if (monthNum < 1 || monthNum > 12) {
    throw new Error(`Mes inválido: ${month}`);
  }

  if (dayNum < 1 || dayNum > 31) {
    throw new Error(`Día inválido: ${day}`);
  }

  return `${fullYear}-${month}-${day}`;
}

/**
 * Parsea el contenido de un código QR de pasta de soldadura
 * Formato esperado: "lote,parte,expiracion,fabricacion,serial"
 * Ejemplo: "50822985,k01.005-00m-2,260218,250909,017"
 * 
 * @param qrContent - Contenido crudo del código QR
 * @returns Datos parseados y validados
 */
export function parseQRCode(qrContent: string): ParsedQRData {
  // Limpiar espacios en blanco
  const cleanContent = qrContent.trim();
  
  // Separar por comas
  const parts = cleanContent.split(',');

  if (parts.length !== 5) {
    throw new Error(
      `El código QR debe contener 5 campos separados por comas. ` +
      `Se encontraron ${parts.length} campos en: "${cleanContent}"`
    );
  }

  const [lotNumber, partNumber, expirationRaw, manufactureRaw, lotSerial] = parts;

  // Validar que ningún campo esté vacío
  if (!lotNumber.trim()) throw new Error('Número de lote vacío');
  if (!partNumber.trim()) throw new Error('Número de parte vacío');
  if (!expirationRaw.trim()) throw new Error('Fecha de expiración vacía');
  if (!manufactureRaw.trim()) throw new Error('Fecha de fabricación vacía');
  if (!lotSerial.trim()) throw new Error('Serial del lote vacío');

  // Convertir fechas
  const expirationDate = parseYYMMDD(expirationRaw.trim());
  const manufactureDate = parseYYMMDD(manufactureRaw.trim());

  return {
    lotNumber: lotNumber.trim(),
    partNumber: partNumber.trim(),
    expirationDate,
    manufactureDate,
    lotSerial: lotSerial.trim(),
    rawData: cleanContent,
  };
}

/**
 * Calcula los días restantes hasta la expiración
 * @param expirationDate - Fecha de expiración en formato YYYY-MM-DD
 * @returns Número de días restantes (negativo si ya expiró)
 */
export function calculateDaysRemaining(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalizar a inicio del día

  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Obtiene el estado de vida útil basado en días restantes
 * @param daysRemaining - Días restantes hasta expiración
 * @returns Objeto con color y etiqueta del estado
 */
export function getShelfLifeStatus(daysRemaining: number): {
  color: string;
  label: string;
  urgent: boolean;
} {
  if (daysRemaining < 0) {
    return {
      color: 'text-red-600 bg-red-100',
      label: `Expirado hace ${Math.abs(daysRemaining)} días`,
      urgent: true,
    };
  }

  if (daysRemaining === 0) {
    return {
      color: 'text-red-600 bg-red-100',
      label: 'Expira hoy',
      urgent: true,
    };
  }

  if (daysRemaining <= 7) {
    return {
      color: 'text-orange-600 bg-orange-100',
      label: `${daysRemaining} días restantes`,
      urgent: true,
    };
  }

  if (daysRemaining <= 30) {
    return {
      color: 'text-yellow-600 bg-yellow-100',
      label: `${daysRemaining} días restantes`,
      urgent: false,
    };
  }

  return {
    color: 'text-green-600 bg-green-100',
    label: `${daysRemaining} días restantes`,
    urgent: false,
  };
}

/**
 * Formatea una fecha ISO a formato legible
 * @param dateStr - Fecha en formato ISO
 * @returns Fecha formateada en español
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formatea un datetime ISO a formato legible con hora
 * @param dateTimeStr - DateTime en formato ISO
 * @returns DateTime formateado en español
 */
export function formatDateTime(dateTimeStr: string | null): string {
  if (!dateTimeStr) return '-';
  
  const date = new Date(dateTimeStr);
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Valida el valor de viscosidad
 * @param value - Valor de viscosidad a validar
 * @returns true si está en el rango válido (150-180)
 */
export function isValidViscosity(value: number): boolean {
  return value >= 150 && value <= 180;
}

/**
 * Genera un identificador único para la pasta basado en lote y serial
 * @param lotNumber - Número de lote
 * @param lotSerial - Serial del lote
 * @returns Identificador único
 */
export function generatePasteId(lotNumber: string, lotSerial: string): string {
  return `${lotNumber}-${lotSerial}`;
}
