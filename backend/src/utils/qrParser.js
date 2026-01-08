/**
 * =====================================================
 * Utility Functions for QR Parsing and Validation
 * =====================================================
 */

/**
 * Sanitize scanner input - replace misinterpreted characters
 */
function sanitizeScannerInput(input) {
  return input
    .replace(/'/g, '-')
    .replace(/'/g, '-')
    .replace(/'/g, '-')
    .replace(/`/g, '-')
    .replace(/´/g, '-')
    .replace(/\{/g, '-')  // Convert { to -
    .replace(/\}/g, '-'); // Convert } to -
}

/**
 * Convert date from YYMMDD to YYYY-MM-DD
 */
function parseYYMMDD(yymmdd) {
  if (yymmdd.length !== 6) {
    throw new Error(`Invalid date format: ${yymmdd}. Expected YYMMDD`);
  }

  const year = parseInt(yymmdd.substring(0, 2), 10);
  const month = yymmdd.substring(2, 4);
  const day = yymmdd.substring(4, 6);

  const fullYear = 2000 + year;

  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);

  if (monthNum < 1 || monthNum > 12) {
    throw new Error(`Invalid month: ${month}`);
  }

  if (dayNum < 1 || dayNum > 31) {
    throw new Error(`Invalid day: ${day}`);
  }

  return `${fullYear}-${month}-${day}`;
}

/**
 * Check if a part number requires manual entry
 */
function requiresManualEntry(partNumber) {
  const modelsRequiringManualEntry = ['K01.027-00M'];
  return modelsRequiringManualEntry.includes(partNumber.toUpperCase().trim());
}

/**
 * Parse QR code content
 * Format: "lote,parte,expiracion,fabricacion,serial" (5 fields)
 * Or: "lote,parte,expiracion,serial" (4 fields for models without manufacture date)
 * For models requiring manual entry, manufacture date field may be missing
 */
function parseQRCode(qrContent) {
  const sanitizedContent = sanitizeScannerInput(qrContent);
  const cleanContent = sanitizedContent.trim();
  const parts = cleanContent.split(',');

  // Accept 4 or 5 fields
  if (parts.length !== 4 && parts.length !== 5) {
    throw new Error(
      `QR code must contain 4 or 5 comma-separated fields. Found ${parts.length} in: "${cleanContent}"`
    );
  }

  let lotNumber, partNumber, expirationRaw, manufactureRaw, lotSerial;
  
  if (parts.length === 5) {
    // Standard format: lote,parte,expiracion,fabricacion,serial
    [lotNumber, partNumber, expirationRaw, manufactureRaw, lotSerial] = parts;
  } else {
    // Short format (no manufacture date): lote,parte,expiracion,serial
    [lotNumber, partNumber, expirationRaw, lotSerial] = parts;
    manufactureRaw = ''; // Empty manufacture date
  }

  if (!lotNumber.trim()) throw new Error('Empty lot number');
  if (!partNumber.trim()) throw new Error('Empty part number');
  if (!expirationRaw.trim()) throw new Error('Empty expiration date');
  if (!lotSerial.trim()) throw new Error('Empty lot serial');

  const expirationDate = parseYYMMDD(expirationRaw.trim());
  
  // For models requiring manual entry, manufacture date might be empty
  let manufactureDate = null;
  const requiresManual = requiresManualEntry(partNumber);
  
  if (manufactureRaw && manufactureRaw.trim()) {
    manufactureDate = parseYYMMDD(manufactureRaw.trim());
  } else if (!requiresManual) {
    throw new Error('Empty manufacture date');
  }

  // Validate not expired
  const expDate = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);

  if (expDate < today) {
    const formattedExpDate = expDate.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    throw new Error(
      `⚠️ PASTA VENCIDA\n\nNo se puede registrar esta pasta.\n\nFecha de expiración: ${formattedExpDate}`
    );
  }

  return {
    lotNumber: lotNumber.trim(),
    partNumber: partNumber.trim(),
    expirationDate,
    manufactureDate,
    lotSerial: lotSerial.trim(),
    rawData: cleanContent,
    requiresManualEntry: requiresManual,
  };
}

/**
 * Calculate days remaining until expiration
 */
function calculateDaysRemaining(expirationDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Validate viscosity value (170-230)
 */
function isValidViscosity(value) {
  return value >= 170 && value <= 230;
}

/**
 * Format date to locale string
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format datetime to locale string
 */
function formatDateTime(dateTimeStr) {
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

module.exports = {
  sanitizeScannerInput,
  parseYYMMDD,
  parseQRCode,
  calculateDaysRemaining,
  isValidViscosity,
  formatDate,
  formatDateTime,
  requiresManualEntry,
};
