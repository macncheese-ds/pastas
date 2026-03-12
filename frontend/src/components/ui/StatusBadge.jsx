/**
 * =====================================================
 * Status Badge Component
 * =====================================================
 */

import { STATUS_LABELS, STATUS_COLORS } from '../../types';
import { useLanguage } from '../../i18n';

export default function StatusBadge({ status, size = 'md', expired = false, deviation = false }) {
  const { t } = useLanguage();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center rounded-full font-medium ${STATUS_COLORS[status]} ${sizeClasses}`}
      >
        {t('status.' + status) || STATUS_LABELS[status]}
      </span>
      {expired && !deviation && status !== 'removed' && status !== 'discarded' && (
        <span className={`inline-flex items-center rounded-full font-bold bg-red-600 text-white animate-pulse ${sizeClasses}`}>
          {t('statusBadge.expired')}
        </span>
      )}
      {expired && deviation && status !== 'removed' && status !== 'discarded' && (
        <span className={`inline-flex items-center rounded-full font-medium bg-amber-600 text-white ${sizeClasses}`}>
          {t('statusBadge.deviation')}
        </span>
      )}
    </div>
  );
}
