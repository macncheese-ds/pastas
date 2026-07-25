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

// Status colors (Tailwind classes) - Vibrant color-coded for easy reading
export const STATUS_COLORS = {
  in_fridge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
  out_fridge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  mixing: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
  viscosity_ok: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
  opened: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
  removed: 'bg-slate-500/20 text-slate-300 border border-slate-500/40',
  rejected: 'bg-red-500/20 text-red-300 border border-red-500/40',
  discarded: 'bg-red-900/40 text-red-400 border border-red-700/50',
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

// SMT Location colors for UI - Vibrant, high-contrast
export const SMT_LOCATION_COLORS = {
  'SMT': { 
    selected: 'bg-cyan-600 text-white border-2 border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/20', 
    unselected: 'bg-slate-700/60 text-slate-300 border border-slate-600 hover:bg-slate-600/60 hover:text-white' 
  },
  'SMT2': { 
    selected: 'bg-violet-600 text-white border-2 border-violet-400 ring-2 ring-violet-400/30 shadow-lg shadow-violet-500/20', 
    unselected: 'bg-slate-700/60 text-slate-300 border border-slate-600 hover:bg-slate-600/60 hover:text-white' 
  },
  'SMT3': { 
    selected: 'bg-emerald-600 text-white border-2 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg shadow-emerald-500/20', 
    unselected: 'bg-slate-700/60 text-slate-300 border border-slate-600 hover:bg-slate-600/60 hover:text-white' 
  },
  'SMT4': { 
    selected: 'bg-amber-600 text-white border-2 border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/20', 
    unselected: 'bg-slate-700/60 text-slate-300 border border-slate-600 hover:bg-slate-600/60 hover:text-white' 
  },
};

// All SMT locations
export const SMT_LOCATIONS = ['SMT', 'SMT2', 'SMT3', 'SMT4'];
