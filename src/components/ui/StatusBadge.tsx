/**
 * =====================================================
 * Componente: Status Badge
 * =====================================================
 * Badge visual para mostrar el estado de las pastas
 */

import { SolderPasteStatus, STATUS_LABELS, STATUS_COLORS } from '@/types';

interface StatusBadgeProps {
  status: SolderPasteStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${STATUS_COLORS[status]} ${sizeClasses}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
