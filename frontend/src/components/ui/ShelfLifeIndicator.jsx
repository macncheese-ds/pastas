/**
 * =====================================================
 * Shelf Life Indicator Component
 * =====================================================
 */

import { calculateDaysRemaining, getShelfLifeStatus } from '../../lib/qrParser';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ShelfLifeIndicator({
  expirationDate,
  showIcon = true,
  compact = false,
}) {
  const daysRemaining = calculateDaysRemaining(expirationDate);
  const { color, label, urgent } = getShelfLifeStatus(daysRemaining);

  if (compact) {
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${color}`}>
        {urgent && <ExclamationTriangleIcon className="mr-1 h-3 w-3" />}
        {daysRemaining}d
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${color}`}>
      {showIcon && (
        urgent ? (
          <ExclamationTriangleIcon className="mr-2 h-4 w-4" />
        ) : (
          <ClockIcon className="mr-2 h-4 w-4" />
        )
      )}
      <span>{label}</span>
    </div>
  );
}
