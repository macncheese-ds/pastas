/**
 * =====================================================
 * SMT Location Mapping Configuration
 * =====================================================
 */

const SMT_PREFIX_MAP = {
  'k01.': 'SMT',
  'k02.': 'SMT',
  'a01.': 'SMT',
  
  'k03.': 'SMT2',
  'k04.': 'SMT2',
  'b01.': 'SMT2',
  'b02.': 'SMT2',
  
  'k05.': 'SMT3',
  'k06.': 'SMT3',
  'c01.': 'SMT3',
  'c02.': 'SMT3',
  
  'k07.': 'SMT4',
  'k08.': 'SMT4',
  'd01.': 'SMT4',
  'd02.': 'SMT4',
};

const SMT_EXACT_MAP = {};

const DEFAULT_SMT_LOCATION = 'SMT';

/**
 * Detect SMT location based on part number
 */
export function detectSMTLocation(partNumber) {
  const normalizedPart = partNumber.toLowerCase().trim();
  
  // Check exact mapping
  if (SMT_EXACT_MAP[partNumber]) {
    return SMT_EXACT_MAP[partNumber];
  }
  
  // Check prefix mapping
  for (const [prefix, location] of Object.entries(SMT_PREFIX_MAP)) {
    if (normalizedPart.startsWith(prefix.toLowerCase())) {
      return location;
    }
  }
  
  return DEFAULT_SMT_LOCATION;
}

/**
 * Get all SMT locations
 */
export function getAllSMTLocations() {
  return ['SMT', 'SMT2', 'SMT3', 'SMT4'];
}

/**
 * Check if location is valid
 */
export function isValidSMTLocation(location) {
  return getAllSMTLocations().includes(location);
}

/**
 * Alias for detectSMTLocation for compatibility
 */
export const getSmtLocation = detectSMTLocation;
