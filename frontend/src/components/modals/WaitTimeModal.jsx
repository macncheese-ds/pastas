/**
 * =====================================================
 * Wait Time Modal Component
 * =====================================================
 */

import { useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';
import { formatDateTime } from '../../lib/qrParser';
import { useLanguage } from '../../i18n';
import { ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function WaitTimeModal({
  isOpen,
  onClose,
  paste,
}) {
  const { t } = useLanguage();
  const [timeRemaining, setTimeRemaining] = useState(null);

  const calculateTimeRemaining = useCallback(() => {
    if (!paste?.fridge_out_datetime) return null;

    const fridgeOut = new Date(paste.fridge_out_datetime);
    const fourHoursLater = new Date(fridgeOut.getTime() + 4 * 60 * 60 * 1000);
    const now = new Date();
    const diff = fourHoursLater.getTime() - now.getTime();

    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, completed: true };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, completed: false };
  }, [paste]);

  useEffect(() => {
    if (!isOpen || !paste) return;

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, paste, calculateTimeRemaining]);

  if (!paste) return null;

  const formatTimeUnit = (value) => value.toString().padStart(2, '0');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('waitTime.title')} size="md">
      <div className="space-y-6">
        <div className="rounded-lg bg-amber-900/30 border border-amber-700 p-4">
          <div className="flex items-start">
            <ClockIcon className="h-5 w-5 text-amber-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">
                {t('waitTime.stabilization')}
              </p>
              <p className="text-sm text-amber-400 mt-1">
                {t('waitTime.stabilizationDesc')}
              </p>
            </div>
          </div>
        </div>

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
            <div className="col-span-2">
              <span className="text-neutral-400">{t('waitTime.fridgeExit')}</span>
              <span className="ml-2 font-medium text-white">{formatDateTime(paste.fridge_out_datetime)}</span>
            </div>
          </div>
        </div>

        {timeRemaining && (
          <div className="text-center py-4">
            {timeRemaining.completed ? (
              <div className="rounded-lg bg-green-900/30 border border-green-700 p-4">
                <p className="text-lg font-medium text-green-300">
                  ✓ {t('waitTime.completed')}
                </p>
                <p className="text-sm text-green-400 mt-1">
                  {t('waitTime.completedDesc')}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-neutral-400 mb-3">{t('waitTime.remaining')}</p>
                <div className="flex items-center justify-center space-x-2">
                  <div className="bg-neutral-700 rounded-lg p-3 min-w-[60px]">
                    <p className="text-3xl font-mono font-bold text-amber-400">
                      {formatTimeUnit(timeRemaining.hours)}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">{t('waitTime.hours')}</p>
                  </div>
                  <span className="text-2xl text-neutral-500">:</span>
                  <div className="bg-neutral-700 rounded-lg p-3 min-w-[60px]">
                    <p className="text-3xl font-mono font-bold text-amber-400">
                      {formatTimeUnit(timeRemaining.minutes)}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">{t('waitTime.minutes')}</p>
                  </div>
                  <span className="text-2xl text-neutral-500">:</span>
                  <div className="bg-neutral-700 rounded-lg p-3 min-w-[60px]">
                    <p className="text-3xl font-mono font-bold text-amber-400">
                      {formatTimeUnit(timeRemaining.seconds)}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">{t('waitTime.seconds')}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-neutral-700">
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-700 border border-neutral-600 rounded-md shadow-sm hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <XCircleIcon className="h-4 w-4 mr-2" />
            {t('modal.close')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
