/**
 * =====================================================
 * SMT Location Mapping Configuration
 * =====================================================
 */

// Prefix mapping for SMT locations
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

// Exact part number mappings
const SMT_EXACT_MAP = {};

// Regex pattern mappings
const SMT_REGEX_MAP = [];

// Default location
const DEFAULT_SMT_LOCATION = 'SMT';

/**
 * Detect SMT location based on part number
 */
function detectSMTLocation(partNumber) {
  const normalizedPart = partNumber.toLowerCase().trim();
  
  // 1. Check exact mapping
  if (SMT_EXACT_MAP[partNumber]) {
    return SMT_EXACT_MAP[partNumber];
  }
  
  // 2. Check prefix mapping
  for (const [prefix, location] of Object.entries(SMT_PREFIX_MAP)) {
    if (normalizedPart.startsWith(prefix.toLowerCase())) {
      return location;
    }
  }
  
  // 3. Check regex mapping
  for (const { pattern, location } of SMT_REGEX_MAP) {
    if (pattern.test(partNumber)) {
      return location;
    }
  }
  
  // 4. Return default
  return DEFAULT_SMT_LOCATION;
}

/**
 * Get all SMT locations
 */
function getAllSMTLocations() {
  return ['SMT', 'SMT2', 'SMT3', 'SMT4'];
}

/**
 * Check if location is valid
 */
function isValidSMTLocation(location) {
  return getAllSMTLocations().includes(location);
}

module.exports = {
  SMT_PREFIX_MAP,
  SMT_EXACT_MAP,
  SMT_REGEX_MAP,
  DEFAULT_SMT_LOCATION,
  detectSMTLocation,
  getAllSMTLocations,
  isValidSMTLocation,
};
