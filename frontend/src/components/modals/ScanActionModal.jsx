/**
 * =====================================================
 * Scan Action Modal Component
 * =====================================================
 */

import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';
import { STATUS_NEXT_ACTIONS } from '../../types';
import { formatDateTime, calculateDaysRemaining } from '../../lib/qrParser';
import { useLanguage } from '../../i18n';
import { CheckCircleIcon, XCircleIcon, ArrowRightIcon, ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function ScanActionModal({
  isOpen,
  onClose,
  onConfirm,
  paste,
  isLoading = false,
}) {
  const { t } = useLanguage();
  if (!paste) return null;

  const nextAction = STATUS_NEXT_ACTIONS[paste.status];
  if (!nextAction) return null;
  
  const isExpired = calculateDaysRemaining(paste.expiration_date) < 0;
  const hasDeviation = !!paste.deviation_authorized;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('nextActions.' + paste.status + '.title')} size="lg">
      <div className="space-y-6">
        {/* Expiration Warning */}
        {isExpired && !hasDeviation && (
          <div className="rounded-lg bg-red-900/40 border-2 border-red-600 p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-2" />
              <div>
                <p className="text-sm font-bold text-red-300">{t('scanAction.expiredPaste')}</p>
                <p className="text-xs text-red-200 mt-1">{t('scanAction.qualityAuth')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Deviation Notice */}
        {isExpired && hasDeviation && (
          <div className="rounded-lg bg-amber-900/30 border border-amber-700 p-3">
            <div className="flex items-center">
              <ShieldExclamationIcon className="h-5 w-5 text-amber-400 mr-2" />
              <div>
                <p className="text-xs font-medium text-amber-300">{t('scanAction.deviationAuth')}</p>
                <p className="text-xs text-amber-200">{t('scanAction.by')} {paste.deviation_authorized_by}</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-neutral-700 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <span className="text-neutral-400">{t('pasteDetails.did')}</span>
              <span className="ml-2 font-medium text-blue-400">{paste.did}</span>
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
              <span className="text-neutral-400">{t('table.smtLine')}:</span>
              <span className="ml-2">
                {paste.smt_location ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300">
                    {paste.smt_location}
                  </span>
                ) : (
                  <span className="text-neutral-500">-</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <p className="text-xs text-neutral-400 mb-1">{t('scanAction.currentStatus')}</p>
            <StatusBadge status={paste.status} />
          </div>
          <ArrowRightIcon className="h-5 w-5 text-neutral-500" />
          <div className="text-center">
            <p className="text-xs text-neutral-400 mb-1">{t('scanAction.nextStatus')}</p>
            <span className="inline-flex items-center rounded-full bg-blue-900/50 px-2.5 py-1 text-sm font-medium text-blue-300">
              {t('nextActions.' + paste.status + '.title')}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <h4 className="font-medium text-white">{t('scanAction.history')}</h4>
          <div className="rounded-lg bg-neutral-700 p-3 space-y-1">
            {paste.fridge_in_datetime && (
              <p><span className="text-neutral-400">{t('scanAction.fridgeIn')}</span> <span className="text-white">{formatDateTime(paste.fridge_in_datetime)}</span></p>
            )}
            {paste.fridge_out_datetime && (
              <p><span className="text-neutral-400">{t('scanAction.fridgeOut')}</span> <span className="text-white">{formatDateTime(paste.fridge_out_datetime)}</span></p>
            )}
            {paste.mixing_start_datetime && (
              <p><span className="text-neutral-400">{t('scanAction.mixStart')}</span> <span className="text-white">{formatDateTime(paste.mixing_start_datetime)}</span></p>
            )}
            {paste.viscosity_datetime && (
              <p><span className="text-neutral-400">{t('scanAction.viscosityAt')}</span> <span className="text-white">{paste.viscosity_value} @ {formatDateTime(paste.viscosity_datetime)}</span></p>
            )}
            {paste.opened_datetime && (
              <p><span className="text-neutral-400">{t('scanAction.openedAt')}</span> <span className="text-white">{formatDateTime(paste.opened_datetime)}</span></p>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-amber-900/30 p-4 border border-amber-700">
          <p className="text-sm text-amber-300">{t('nextActions.' + paste.status + '.description')}</p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-700 border border-neutral-600 rounded-md shadow-sm hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <XCircleIcon className="h-4 w-4 mr-2" />
            {t('modal.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('modal.processing')}
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                {t('modal.confirm')}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
