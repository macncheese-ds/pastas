/**
 * =====================================================
 * Types and Constants for SMT Paste Tracker
 * =====================================================
 */

// Status labels
export const STATUS_LABELS = {
  in_fridge: 'En Refrigerador',
  out_fridge: 'Fuera de Refrigerador',
  mixing: 'Mezclando',
  viscosity_ok: 'Viscosidad OK',
  opened: 'Abierto',
  removed: 'Retirado',
  rejected: 'Rechazado - Volver a Mezclar',
};

// Status colors (Tailwind classes)
export const STATUS_COLORS = {
  in_fridge: 'bg-blue-100 text-blue-800',
  out_fridge: 'bg-yellow-100 text-yellow-800',
  mixing: 'bg-orange-100 text-orange-800',
  viscosity_ok: 'bg-green-100 text-green-800',
  opened: 'bg-purple-100 text-purple-800',
  removed: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
};

// Next actions based on status
export const STATUS_NEXT_ACTIONS = {
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
    description: 'Ingresar valor de viscosidad (170-230)',
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
    description: 'Volver a mezclar e ingresar nueva viscosidad (170-230)',
    requiresInput: true,
    inputType: 'viscosity',
  },
};

// SMT Location colors for UI
export const SMT_LOCATION_COLORS = {
  'SMT': { 
    selected: 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400', 
    unselected: 'bg-neutral-700 text-blue-300 border-blue-700 hover:bg-blue-900/50' 
  },
  'SMT2': { 
    selected: 'bg-green-600 text-white border-green-500 ring-2 ring-green-400', 
    unselected: 'bg-neutral-700 text-green-300 border-green-700 hover:bg-green-900/50' 
  },
  'SMT3': { 
    selected: 'bg-purple-600 text-white border-purple-500 ring-2 ring-purple-400', 
    unselected: 'bg-neutral-700 text-purple-300 border-purple-700 hover:bg-purple-900/50' 
  },
  'SMT4': { 
    selected: 'bg-orange-600 text-white border-orange-500 ring-2 ring-orange-400', 
    unselected: 'bg-neutral-700 text-orange-300 border-orange-700 hover:bg-orange-900/50' 
  },
};

// All SMT locations
export const SMT_LOCATIONS = ['SMT', 'SMT2', 'SMT3', 'SMT4'];
