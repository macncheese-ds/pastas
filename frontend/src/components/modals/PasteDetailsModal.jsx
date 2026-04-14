/**
 * =====================================================
 * Paste Details Modal Component
 * =====================================================
 */

import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';
import ShelfLifeIndicator from '../ui/ShelfLifeIndicator';
import { formatDateTime, formatDate, calculateDaysRemaining } from '../../lib/qrParser';
import { useLanguage } from '../../i18n';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';

export default function PasteDetailsModal({
  isOpen,
  onClose,
  paste,
}) {
  const { t } = useLanguage();
  if (!paste) return null;

  const isExpired = calculateDaysRemaining(paste.expiration_date) < 0;
  const hasDeviation = !!paste.deviation_authorized;
  const isFinished = paste.status === 'removed' || paste.status === 'discarded';

  const timeline = [
    {
      label: t('pasteDetails.fridgeIn'),
      datetime: paste.fridge_in_datetime,
      user: paste.fridge_in_user,
      icon: CheckCircleIcon,
      color: 'text-green-400',
    },
    {
      label: t('pasteDetails.fridgeOut'),
      datetime: paste.fridge_out_datetime,
      user: paste.fridge_out_user,
      icon: CheckCircleIcon,
      color: 'text-gray-500',
    },
    {
      label: t('pasteDetails.mixStart'),
      datetime: paste.mixing_start_datetime,
      user: paste.mixing_start_user,
      icon: ClockIcon,
      color: 'text-yellow-400',
    },
    {
      label: t('pasteDetails.viscosityRecorded'),
      datetime: paste.viscosity_datetime,
      user: paste.viscosity_user,
      icon: CheckCircleIcon,
      color: 'text-green-400',
      extra: paste.viscosity_value ? `Valor: ${paste.viscosity_value}` : null,
    },
    {
      label: t('pasteDetails.opening'),
      datetime: paste.opened_datetime,
      user: paste.opened_user,
      icon: CheckCircleIcon,
      color: 'text-purple-400',
      extra: paste.smt_location ? `Línea: ${paste.smt_location}` : null,
    },
    {
      label: t('pasteDetails.removed'),
      datetime: paste.removed_datetime,
      user: paste.removed_user,
      icon: XCircleIcon,
      color: 'text-gray-400',
    },
    paste.discarded_datetime && {
      label: t('pasteDetails.discarded'),
      datetime: paste.discarded_datetime,
      user: null,
      icon: ExclamationTriangleIcon,
      color: 'text-red-400',
      extra: paste.discarded_reason || null,
    },
    paste.deviation_authorized_at && {
      label: t('pasteDetails.deviationAuth'),
      datetime: paste.deviation_authorized_at,
      user: paste.deviation_authorized_by,
      icon: ShieldExclamationIcon,
      color: 'text-amber-400',
      extra: paste.deviation_reason || null,
    },
  ].filter(Boolean).filter(item => item.datetime);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('pasteDetails.title')} size="lg">
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-lg border border-neutral-700 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <span className="text-neutral-400">{t('pasteDetails.did')}</span>
              <span className="ml-2 font-medium text-gray-500">{paste.did}</span>
            </div>
            <div>
              <span className="text-neutral-400">{t('pasteDetails.lot')}</span>
              <span className="ml-2 font-medium text-white">{paste.lot_number}</span>
            </div>
            <div>
              <span className="text-neutral-400">{t('pasteDetails.serial')}</span>
              <span className="ml-2 font-medium text-white">{paste.lot_serial}</span>
            </div>
            <div>
              <span className="text-neutral-400">{t('pasteDetails.partNumber')}</span>
              <span className="ml-2 font-medium text-white">{paste.part_number}</span>
            </div>
            <div>
              <span className="text-neutral-400">{t('pasteDetails.currentStatus')}</span>
              <span className="ml-2">
                <StatusBadge status={paste.status} expired={!isFinished && isExpired} deviation={hasDeviation} />
              </span>
            </div>
            <div>
              <span className="text-neutral-400">{t('pasteDetails.manufactureDate')}</span>
              <span className="ml-2 font-medium text-white">{formatDate(paste.manufacture_date)}</span>
            </div>
            <div>
              <span className="text-neutral-400">{t('pasteDetails.expirationDate')}</span>
              <span className="ml-2 font-medium text-white">{formatDate(paste.expiration_date)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-neutral-400">{t('pasteDetails.shelfLife')}</span>
              <span className="ml-2">
                <ShelfLifeIndicator expirationDate={paste.expiration_date} />
              </span>
            </div>
            {paste.smt_location && (
              <div className="col-span-2">
                <span className="text-neutral-400">{t('table.smtLine')}:</span>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300">
                  {paste.smt_location}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className="rounded-lg border border-neutral-700 p-4">
            <h4 className="text-sm font-medium text-neutral-300 mb-4">{t('pasteDetails.history')}</h4>
            <div className="space-y-4">
              {timeline.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-start">
                    <Icon className={`h-5 w-5 ${item.color} mr-3 mt-0.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{item.label}</div>
                      <div className="text-xs text-neutral-400 mt-0.5">{formatDateTime(item.datetime)}</div>
                      {item.user && (
                        <div className="flex items-center mt-1.5 text-xs text-gray-500">
                          <UserIcon className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                          <span className="font-medium">{item.user}</span>
                        </div>
                      )}
                      {item.extra && (
                        <div className="text-xs text-neutral-500 mt-1">{item.extra}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Deviation Info */}
        {paste.deviation_authorized && (
          <div className="rounded-lg bg-amber-900/30 border border-amber-700 p-4">
            <div className="flex items-start">
              <ShieldExclamationIcon className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-amber-300">{t('pasteDetails.deviationDetails')}</h4>
                <p className="text-xs text-amber-200 mt-1">{t('pasteDetails.authorizedBy')} {paste.deviation_authorized_by}</p>
                <p className="text-xs text-amber-200">{t('pasteDetails.date')} {formatDateTime(paste.deviation_authorized_at)}</p>
                {paste.deviation_reason && (
                  <p className="text-xs text-amber-200 mt-1">{t('pasteDetails.reason')} {paste.deviation_reason}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-neutral-700">
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-neutral-700 border border-neutral-600 rounded-md shadow-sm hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('modal.close')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
