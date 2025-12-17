/**
 * =====================================================
 * Status Badge Component
 * =====================================================
 */

import { STATUS_LABELS, STATUS_COLORS } from '../../types';

export default function StatusBadge({ status, size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${STATUS_COLORS[status]} ${sizeClasses}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
