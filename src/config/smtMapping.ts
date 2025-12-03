/**
 * =====================================================
 * Configuración de Mapeo SMT por Número de Parte
 * =====================================================
 * Este archivo define la relación entre números de parte
 * y sus ubicaciones de línea SMT correspondientes.
 * 
 * Editar este archivo para agregar/modificar mapeos.
 */

export type SMTLocation = 'SMT' | 'SMT2' | 'SMT3' | 'SMT4';

/**
 * Mapeo de prefijos de número de parte a ubicación SMT
 * El sistema busca si el número de parte COMIENZA con alguno de estos prefijos
 */
export const SMT_PREFIX_MAP: Record<string, SMTLocation> = {
  // Línea SMT (principal)
  'k01.': 'SMT',
  'k02.': 'SMT',
  'a01.': 'SMT',
  
  // Línea SMT2
  'k03.': 'SMT2',
  'k04.': 'SMT2',
  'b01.': 'SMT2',
  'b02.': 'SMT2',
  
  // Línea SMT3
  'k05.': 'SMT3',
  'k06.': 'SMT3',
  'c01.': 'SMT3',
  'c02.': 'SMT3',
  
  // Línea SMT4
  'k07.': 'SMT4',
  'k08.': 'SMT4',
  'd01.': 'SMT4',
  'd02.': 'SMT4',
};

/**
 * Mapeo de números de parte exactos a ubicación SMT
 * Usar para casos específicos que no siguen el patrón de prefijos
 */
export const SMT_EXACT_MAP: Record<string, SMTLocation> = {
  // Ejemplos de mapeos exactos
  // 'PART-NUMBER-ESPECIFICO': 'SMT2',
};

/**
 * Mapeo por expresiones regulares para patrones más complejos
 * Cada entrada es un objeto con regex y ubicación
 */
export const SMT_REGEX_MAP: Array<{ pattern: RegExp; location: SMTLocation }> = [
  // Ejemplo: cualquier parte que contenga "-L1-" va a SMT
  // { pattern: /-L1-/i, location: 'SMT' },
  // { pattern: /-L2-/i, location: 'SMT2' },
  // { pattern: /-L3-/i, location: 'SMT3' },
  // { pattern: /-L4-/i, location: 'SMT4' },
];

/**
 * Ubicación por defecto cuando no se encuentra mapeo
 */
export const DEFAULT_SMT_LOCATION: SMTLocation = 'SMT';

/**
 * Detecta la ubicación SMT basándose en el número de parte
 * Prioridad de búsqueda:
 * 1. Mapeo exacto
 * 2. Mapeo por prefijo
 * 3. Mapeo por regex
 * 4. Ubicación por defecto
 * 
 * @param partNumber - Número de parte del producto
 * @returns Ubicación SMT detectada
 */
export function detectSMTLocation(partNumber: string): SMTLocation {
  const normalizedPart = partNumber.toLowerCase().trim();
  
  // 1. Buscar en mapeo exacto
  if (SMT_EXACT_MAP[partNumber]) {
    return SMT_EXACT_MAP[partNumber];
  }
  
  // 2. Buscar por prefijo
  for (const [prefix, location] of Object.entries(SMT_PREFIX_MAP)) {
    if (normalizedPart.startsWith(prefix.toLowerCase())) {
      return location;
    }
  }
  
  // 3. Buscar por regex
  for (const { pattern, location } of SMT_REGEX_MAP) {
    if (pattern.test(partNumber)) {
      return location;
    }
  }
  
  // 4. Retornar ubicación por defecto
  return DEFAULT_SMT_LOCATION;
}

/**
 * Obtiene todas las ubicaciones SMT disponibles
 */
export function getAllSMTLocations(): SMTLocation[] {
  return ['SMT', 'SMT2', 'SMT3', 'SMT4'];
}

/**
 * Verifica si una ubicación SMT es válida
 */
export function isValidSMTLocation(location: string): location is SMTLocation {
  return getAllSMTLocations().includes(location as SMTLocation);
}
