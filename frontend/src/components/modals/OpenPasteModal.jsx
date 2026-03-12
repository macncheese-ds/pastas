/**
 * =====================================================
 * Open Paste Modal Component
 * =====================================================
 */

import { useState } from 'react';
import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';
import { formatDateTime } from '../../lib/qrParser';
import { useLanguage } from '../../i18n';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  LockOpenIcon,
} from '@heroicons/react/24/outline';

export default function OpenPasteModal({
  isOpen,
  onClose,
  onConfirm,
  paste,
  authorizedLines = [],
  isLoading = false,
}) {
  const { t } = useLanguage();
  const [selectedSmt, setSelectedSmt] = useState('');

  if (!paste) return null;

  const handleConfirm = () => {
    if (!selectedSmt) {
      alert(t('openPaste.selectLine'));
      return;
    }
    onConfirm(selectedSmt);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('openPaste.title')} size="lg">
      <div className="space-y-6">
        <div className="rounded-lg bg-amber-900/30 border border-amber-700 p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">
                {t('openPaste.confirmHint')}
              </p>
              <p className="text-sm text-amber-400 mt-1">
                {t('openPaste.confirmDesc')}
              </p>
            </div>
          </div>
        </div>

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
              <span className="text-neutral-400">{t('scanAction.currentStatus')}</span>
              <span className="ml-2">
                <StatusBadge status={paste.status} />
              </span>
            </div>
            <div>
              <span className="text-neutral-400">{t('table.viscosity')}:</span>
              <span className="ml-2 font-medium text-white">{paste.viscosity_value}</span>
            </div>
          </div>
        </div>

        {/* SMT Location Selection */}
        <div className="rounded-lg border border-neutral-700 p-4">
          <label className="block text-sm font-medium text-white mb-3">
            {t('openPaste.selectLine')}
          </label>
          {authorizedLines.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {authorizedLines.map((line) => (
                <button
                  key={line.line_id}
                  onClick={() => setSelectedSmt(line.line_name)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedSmt === line.line_name
                      ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                      : 'border-neutral-600 bg-neutral-700 text-neutral-300 hover:border-neutral-500'
                  }`}
                >
                  <div className="font-medium">{line.line_name}</div>
                  <div className="text-xs opacity-75">{line.smt_code || 'N/A'}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
              {t('openPaste.noLines')}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-neutral-700 p-4">
          <h4 className="text-sm font-medium text-neutral-300 mb-3">{t('openPaste.historyTitle')}</h4>
          <div className="space-y-2 text-sm">
            {paste.fridge_in_datetime && (
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-neutral-400">{t('scanAction.fridgeIn')}</span>
                <span className="ml-2 text-white">{formatDateTime(paste.fridge_in_datetime)}</span>
              </div>
            )}
            {paste.fridge_out_datetime && (
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-neutral-400">{t('scanAction.fridgeOut')}</span>
                <span className="ml-2 text-white">{formatDateTime(paste.fridge_out_datetime)}</span>
              </div>
            )}
            {paste.mixing_start_datetime && (
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-neutral-400">{t('scanAction.mixStart')}</span>
                <span className="ml-2 text-white">{formatDateTime(paste.mixing_start_datetime)}</span>
              </div>
            )}
            {paste.viscosity_datetime && (
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-neutral-400">{t('pasteDetails.viscosityRecorded')}</span>
                <span className="ml-2 text-white">{formatDateTime(paste.viscosity_datetime)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center rounded-lg bg-neutral-700 p-4">
          <LockOpenIcon className="h-8 w-8 text-amber-400 mr-3" />
          <div>
            <p className="text-sm font-medium text-white">
              {t('openPaste.nextStep')}
            </p>
            <p className="text-xs text-neutral-400">
              {t('openPaste.nextStepDesc')}
            </p>
          </div>
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
            onClick={handleConfirm}
            disabled={isLoading || !selectedSmt}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
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
                <LockOpenIcon className="h-4 w-4 mr-2" />
                {t('openPaste.confirmOpening')}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
