/**
 * =====================================================
 * Tipos TypeScript para el Sistema de Pastas de Soldadura
 * =====================================================
 */

// Estados posibles de una pasta de soldadura
export type SolderPasteStatus = 
  | 'in_fridge'      // En refrigerador
  | 'out_fridge'     // Fuera del refrigerador
  | 'mixing'         // En proceso de mezclado
  | 'viscosity_ok'   // Viscosidad registrada/aprobada
  | 'opened'         // Contenedor abierto
  | 'removed'        // Retirado/finalizado
  | 'rejected';      // Rechazado (viscosidad fuera de rango)

// Ubicaciones SMT disponibles
export type SMTLocation = 'SMT' | 'SMT2' | 'SMT3' | 'SMT4';

// Registro completo de pasta de soldadura
export interface SolderPaste {
  id: number;
  did: string;                         // Document Identification (requerido)
  lot_number: string;
  part_number: string;
  lot_serial: string;
  smt_location: SMTLocation | null;    // Ubicación SMT detectada
  manufacture_date: string;            // Formato ISO: YYYY-MM-DD
  expiration_date: string;             // Formato ISO: YYYY-MM-DD
  fridge_in_datetime: string | null;
  fridge_out_datetime: string | null;
  mixing_start_datetime: string | null;
  viscosity_value: number | null;
  viscosity_datetime: string | null;
  opened_datetime: string | null;
  removed_datetime: string | null;
  status: SolderPasteStatus;
  created_at: string;
  updated_at: string;
}

// Datos parseados del código QR
export interface ParsedQRData {
  lotNumber: string;       // Posición 1: Número de lote
  partNumber: string;      // Posición 2: Número de parte
  expirationDate: string;  // Posición 3: Fecha expiración (YYMMDD -> YYYY-MM-DD)
  manufactureDate: string; // Posición 4: Fecha fabricación (YYMMDD -> YYYY-MM-DD)
  lotSerial: string;       // Posición 5: Serial del lote
  rawData: string;         // Datos originales del QR
  smtLocation?: SMTLocation; // Ubicación SMT detectada automáticamente
}

// Input para crear nuevo registro
export interface CreateSolderPasteInput {
  did: string;             // Document Identification (requerido)
  lot_number: string;
  part_number: string;
  lot_serial: string;
  manufacture_date: string;
  expiration_date: string;
  smt_location?: SMTLocation;
}

// Respuesta genérica de la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Tipos de escaneo
export type ScanType = 
  | 'fridge_in'
  | 'fridge_out'
  | 'mixing_start'
  | 'viscosity_check'
  | 'opened'
  | 'removed';

// Acción requerida según el estado actual
export interface NextScanAction {
  scanNumber: number;
  actionType: ScanType;
  title: string;
  description: string;
  requiresInput: boolean;
  inputType?: 'viscosity';
}

// Mapa de acciones según estado
export const STATUS_NEXT_ACTIONS: Record<SolderPasteStatus | 'new', NextScanAction> = {
  new: {
    scanNumber: 1,
    actionType: 'fridge_in',
    title: 'Registro Inicial',
    description: 'Registrar entrada al refrigerador',
    requiresInput: false,
  },
  in_fridge: {
    scanNumber: 2,
    actionType: 'fridge_out',
    title: 'Salida del Refrigerador',
    description: '¿Registrar salida del refrigerador?',
    requiresInput: false,
  },
  out_fridge: {
    scanNumber: 3,
    actionType: 'mixing_start',
    title: 'Inicio de Mezclado',
    description: 'Registrar inicio del proceso de mezclado',
    requiresInput: false,
  },
  mixing: {
    scanNumber: 4,
    actionType: 'viscosity_check',
    title: 'Registro de Viscosidad',
    description: 'Ingresar valor de viscosidad (150-180)',
    requiresInput: true,
    inputType: 'viscosity',
  },
  viscosity_ok: {
    scanNumber: 5,
    actionType: 'opened',
    title: 'Apertura',
    description: 'Registrar apertura del contenedor',
    requiresInput: false,
  },
  opened: {
    scanNumber: 6,
    actionType: 'removed',
    title: 'Retiro Final',
    description: 'Registrar retiro final de la pasta',
    requiresInput: false,
  },
  removed: {
    scanNumber: 0,
    actionType: 'removed',
    title: 'Proceso Completado',
    description: 'Esta pasta ya completó todo el proceso',
    requiresInput: false,
  },
  rejected: {
    scanNumber: 4,
    actionType: 'viscosity_check',
    title: 'Re-verificar Viscosidad',
    description: 'Volver a mezclar e ingresar nueva viscosidad (150-180)',
    requiresInput: true,
    inputType: 'viscosity',
  },
};

// Etiquetas amigables para estados
export const STATUS_LABELS: Record<SolderPasteStatus, string> = {
  in_fridge: 'En Refrigerador',
  out_fridge: 'Fuera de Refrigerador',
  mixing: 'Mezclando',
  viscosity_ok: 'Viscosidad OK',
  opened: 'Abierto',
  removed: 'Retirado',
  rejected: 'Rechazado - Volver a Mezclar',
};

// Colores para estados (Tailwind classes)
export const STATUS_COLORS: Record<SolderPasteStatus, string> = {
  in_fridge: 'bg-blue-100 text-blue-800',
  out_fridge: 'bg-yellow-100 text-yellow-800',
  mixing: 'bg-orange-100 text-orange-800',
  viscosity_ok: 'bg-green-100 text-green-800',
  opened: 'bg-purple-100 text-purple-800',
  removed: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
};
