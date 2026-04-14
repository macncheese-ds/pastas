/**
 * =====================================================
 * Types and Constants for SMT Paste Tracker
 * =====================================================
 */

// Status labels
export const STATUS_LABELS = {
  in_fridge: 'En Refrigerador',
  out_fridge: 'Ambientacion',
  mixing: 'Mix',
  viscosity_ok: 'Viscosidad OK',
  opened: 'Abierto',
  removed: 'Retirado',
  rejected: 'Rechazado - Volver a Mezclar',
};

// Status colors (Tailwind classes) - Grayscale palette with visual distinction
export const STATUS_COLORS = {
  in_fridge: 'bg-gray-700 text-white border-l-4 border-gray-400',
  out_fridge: 'bg-gray-600 text-white border-l-4 border-gray-300',
  mixing: 'bg-gray-500 text-white border-l-4 border-gray-200',
  viscosity_ok: 'bg-gray-700 text-white border-l-4 border-gray-400',
  opened: 'bg-gray-600 text-white border-l-4 border-gray-300',
  removed: 'bg-gray-400 text-gray-900 border-l-4 border-gray-600',
  rejected: 'bg-gray-800 text-white border-l-4 border-gray-500',
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

// SMT Location colors for UI - Grayscale with visual distinction
export const SMT_LOCATION_COLORS = {
  'SMT': { 
    selected: 'bg-gray-700 text-white border-2 border-gray-400 ring-2 ring-gray-300', 
    unselected: 'bg-gray-600 text-white border-gray-500 hover:bg-gray-700' 
  },
  'SMT2': { 
    selected: 'bg-gray-600 text-white border-2 border-gray-300 ring-2 ring-gray-200', 
    unselected: 'bg-gray-600 text-white border-gray-500 hover:bg-gray-700' 
  },
  'SMT3': { 
    selected: 'bg-gray-500 text-white border-2 border-gray-200 ring-2 ring-gray-100', 
    unselected: 'bg-gray-600 text-white border-gray-500 hover:bg-gray-700' 
  },
  'SMT4': { 
    selected: 'bg-gray-800 text-white border-2 border-gray-500 ring-2 ring-gray-400', 
    unselected: 'bg-gray-600 text-white border-gray-500 hover:bg-gray-700' 
  },
};

// All SMT locations
export const SMT_LOCATIONS = ['SMT', 'SMT2', 'SMT3', 'SMT4'];
