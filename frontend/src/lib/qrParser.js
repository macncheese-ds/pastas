/**
 * =====================================================
 * QR Parser and Utility Functions
 * =====================================================
 */

/**
 * Sanitize scanner input
 */
export function sanitizeScannerInput(input) {
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
 * Convert YYMMDD to YYYY-MM-DD
 */
export function parseYYMMDD(yymmdd) {
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
 * Parse QR code content
 */
export function parseQRCode(qrContent) {
  const sanitizedContent = sanitizeScannerInput(qrContent);
  const cleanContent = sanitizedContent.trim();
  const parts = cleanContent.split(',');

  if (parts.length !== 5) {
    throw new Error(
      `El código QR debe contener 5 campos separados por comas. Se encontraron ${parts.length} campos en: "${cleanContent}"`
    );
  }

  const [lotNumber, partNumber, expirationRaw, manufactureRaw, lotSerial] = parts;

  if (!lotNumber.trim()) throw new Error('Número de lote vacío');
  if (!partNumber.trim()) throw new Error('Número de parte vacío');
  if (!expirationRaw.trim()) throw new Error('Fecha de expiración vacía');
  if (!manufactureRaw.trim()) throw new Error('Fecha de fabricación vacía');
  if (!lotSerial.trim()) throw new Error('Serial del lote vacío');

  const expirationDate = parseYYMMDD(expirationRaw.trim());
  const manufactureDate = parseYYMMDD(manufactureRaw.trim());

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
      `⚠️ PASTA VENCIDA\n\nNo se puede registrar esta pasta.\n\nFecha de expiración: ${formattedExpDate}\n\nPor favor, deseche esta pasta y utilice una con fecha de expiración válida.`
    );
  }

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
 * Calculate days remaining until expiration
 */
export function calculateDaysRemaining(expirationDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get shelf life status based on days remaining
 */
export function getShelfLifeStatus(daysRemaining) {
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
 * Validate viscosity value
 */
export function isValidViscosity(value) {
  return value >= 150 && value <= 180;
}

/**
 * Format date to locale string
 */
export function formatDate(dateStr) {
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
export function formatDateTime(dateTimeStr) {
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
 * Check if 4 hours have passed since fridge out
 */
export function canStartMixing(fridgeOutDateTime) {
  if (!fridgeOutDateTime) return false;
  
  const fridgeOut = new Date(fridgeOutDateTime);
  const fourHoursLater = new Date(fridgeOut.getTime() + 4 * 60 * 60 * 1000);
  const now = new Date();
  
  return now >= fourHoursLater;
}
