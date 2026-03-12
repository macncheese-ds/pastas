/**
 * =====================================================
 * Ambientacion Modal
 * Now shown for ALL out_fridge pastes (0-24h+).
 * - 0-4h: return to fridge only (still waiting for ambientacion)
 * - 4-24h: continue to mixing, return to fridge, or retire
 * - 24h+: retire only
 * =====================================================
 */

import { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useLanguage } from '../../i18n';
import {
  ClockIcon,
  UserCircleIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

export default function AmbientacionExceededModal({
  isOpen,
  onClose,
  onRetired,
  onReturnedToFridge,
  onContinueToMixing,
  paste,
  hoursElapsed = 0,
}) {
  const { t } = useLanguage();
  const [employeeInput, setEmployeeInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState(null); // 'retire', 'return', or 'continue'
  const employeeRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setEmployeeInput('');
      setPassword('');
      setError(null);
      setBusy(false);
      setAction(null);
      setTimeout(() => {
        if (employeeRef.current) employeeRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!paste) return null;

  const canReturn = hoursElapsed < 24;
  const canContinue = hoursElapsed >= 4 && hoursElapsed < 24;
  const mustRetire = hoursElapsed >= 24;
  const isWaiting = hoursElapsed < 4;

  // Format remaining wait time
  const getWaitTimeText = () => {
    const remainingHours = 4 - hoursElapsed;
    const h = Math.floor(remainingHours);
    const m = Math.floor((remainingHours - h) * 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} minutos`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!action) {
      setError(t('errors.generic'));
      return;
    }

    // For 'continue' action, just call the callback
    if (action === 'continue') {
      if (onContinueToMixing) {
        onContinueToMixing();
      }
      return;
    }

    if (!employeeInput.trim()) {
      setError(t('login.enterEmployee'));
      return;
    }
    if (action === 'retire' && !password) {
      setError(t('login.enterPassword'));
      return;
    }

    setBusy(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '';

      let endpoint, body;
      if (action === 'return') {
        endpoint = `${API_BASE}/api/pastes/${paste.id}/return-to-fridge`;
        body = {
          user_name: employeeInput.trim(),
        };
      } else {
        endpoint = `${API_BASE}/api/pastes/${paste.id}/retire-ambientacion`;
        body = {
          employee_input: employeeInput.trim(),
          password,
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('errors.generic'));
      }

      if (data.success) {
        if (action === 'return') {
          onReturnedToFridge && onReturnedToFridge(data);
        } else {
          onRetired && onRetired(data);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Determine banner style/text
  const getBannerConfig = () => {
    if (mustRetire) {
      return {
        borderClass: 'border-red-500',
        bgClass: 'bg-red-900/40',
        iconClass: 'text-red-400',
        titleClass: 'text-red-300',
        textClass: 'text-red-200',
        title: t('ambientacion.exceeded'),
        subtitle: t('ambientacion.exceededDesc'),
      };
    }
    if (canContinue) {
      return {
        borderClass: 'border-blue-500',
        bgClass: 'bg-blue-900/40',
        iconClass: 'text-blue-400',
        titleClass: 'text-blue-300',
        textClass: 'text-blue-200',
        title: t('ambientacion.ready'),
        subtitle: t('ambientacion.readyDesc'),
      };
    }
    // isWaiting (< 4h)
    return {
      borderClass: 'border-yellow-500',
      bgClass: 'bg-yellow-900/40',
      iconClass: 'text-yellow-400',
      titleClass: 'text-yellow-300',
      textClass: 'text-yellow-200',
        title: t('ambientacion.inProgress'),
        subtitle: t('ambientacion.inProgressDesc', { time: getWaitTimeText() }),
    };
  };

  const banner = getBannerConfig();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('ambientacion.title')} size="lg">
      <div className="space-y-5">
        {/* Warning Banner */}
        <div className={`rounded-lg ${banner.bgClass} border-2 ${banner.borderClass} p-4`}>
          <div className="flex items-start">
            <ClockIcon className={`h-7 w-7 ${banner.iconClass} flex-shrink-0 mt-0.5 ${isWaiting ? 'animate-pulse' : ''}`} />
            <div className="ml-3">
              <h3 className={`text-sm font-bold ${banner.titleClass} uppercase tracking-wide`}>
                {banner.title}
              </h3>
              <p className={`mt-2 text-sm ${banner.textClass}`}>
                {t('ambientacion.hoursInAmbient', { hours: hoursElapsed.toFixed(1) })}
                {!mustRetire && t('ambientacion.maxTime')}
              </p>
              <p className={`mt-2 text-sm ${banner.titleClass} font-semibold`}>
                {banner.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Paste Info */}
        <div className="rounded-lg border border-neutral-700 p-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-400">{t('pasteDetails.did')}</span>
              <span className="ml-2 font-medium text-blue-400">{paste.did}</span>
            </div>
            <div>
              <span className="text-neutral-400">{t('pasteDetails.lot')}</span>
              <span className="ml-2 font-medium text-white">{paste.lot_number}-{paste.lot_serial}</span>
            </div>
            <div>
              <span className="text-neutral-400">{t('pasteDetails.partNumber')}</span>
              <span className="ml-2 font-medium text-white">{paste.part_number}</span>
            </div>
            <div>
              <span className="text-neutral-400">{t('ambientacion.leftFridge')}</span>
              <span className="ml-2 font-medium text-orange-400">
                {paste.fridge_out_datetime
                  ? new Date(paste.fridge_out_datetime).toLocaleString('es-MX')
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Selection */}
        <div className="rounded-lg border border-neutral-700 p-4 space-y-3">
          <p className="text-sm font-medium text-neutral-300 mb-3">{t('ambientacion.selectAction')}</p>

          {/* Continue to mixing option (only when 4h-24h) */}
          {canContinue && (
            <div
              onClick={() => setAction('continue')}
              className={`relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${action === 'continue'
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-neutral-700 bg-neutral-800 hover:border-blue-600'
                }`}
            >
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-400">{t('ambientacion.continueToMix')}</h4>
                <p className="text-xs text-neutral-400 mt-1">{t('ambientacion.continueToMixDesc')}</p>
              </div>
              <div className={`flex-shrink-0 h-5 w-5 rounded-full border-2 ${action === 'continue' ? 'border-blue-500 bg-blue-500' : 'border-neutral-500'}`} />
            </div>
          )}

          {/* Return to fridge option (always available under 24h) */}
          {canReturn && (
            <div
              onClick={() => setAction('return')}
              className={`relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${action === 'return'
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-neutral-700 bg-neutral-800 hover:border-green-600'
                }`}
            >
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-green-400">{t('ambientacion.returnToFridge')}</h4>
                <p className="text-xs text-neutral-400 mt-1">{t('ambientacion.returnToFridgeDesc')}</p>
              </div>
              <div className={`flex-shrink-0 h-5 w-5 rounded-full border-2 ${action === 'return' ? 'border-green-500 bg-green-500' : 'border-neutral-500'}`} />
            </div>
          )}

          {/* Retire option (always available) */}
          <div
            onClick={() => setAction('retire')}
            className={`relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${action === 'retire'
                ? 'border-red-500 bg-red-900/20'
                : 'border-neutral-700 bg-neutral-800 hover:border-red-600'
              }`}
          >
            <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-400">{t('ambientacion.retirePaste')}</h4>
                <p className="text-xs text-neutral-400 mt-1">{t('ambientacion.retirePasteDesc')} {mustRetire && '(24h+)'}</p>
            </div>
            <div className={`flex-shrink-0 h-5 w-5 rounded-full border-2 ${action === 'retire' ? 'border-red-500 bg-red-500' : 'border-neutral-500'}`} />
          </div>
        </div>

        {/* Acknowledgment Notice - only for return/retire actions */}
        {action && action !== 'continue' && (
          <div className="rounded-lg bg-amber-900/30 border border-amber-700 p-3">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="ml-2">
                <p className="text-xs text-amber-300 font-medium">{t('ambientacion.confirmRequired')}</p>
                <ul className="mt-1 text-xs text-amber-200 space-y-0.5 list-disc list-inside">
                  {action === 'return' ? (
                    t('ambientacion.returnNotes').map((note, i) => <li key={i}>{note}</li>)
                  ) : (
                    t('ambientacion.retireNotes').map((note, i) => <li key={i}>{note}</li>)
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Credential Form - only for return/retire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {action && action !== 'continue' && (
            <>
              <div>
                <label className="flex items-center text-sm font-medium text-neutral-300 mb-1.5">
                  <UserCircleIcon className="h-4 w-4 mr-1.5" />
                  {t('login.employeeNumber')}
                </label>
                <input
                  ref={employeeRef}
                  type="text"
                  value={employeeInput}
                  onChange={(e) => setEmployeeInput(e.target.value)}
                  placeholder="Ej: 1A, 123B"
                  disabled={busy || !action}
                  className="block w-full rounded-md border border-neutral-600 bg-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              {action === 'retire' && (
                <div>
                  <label className="flex items-center text-sm font-medium text-neutral-300 mb-1.5">
                    <LockClosedIcon className="h-4 w-4 mr-1.5" />
                    {t('login.password')}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={busy}
                    className="block w-full rounded-md border border-neutral-600 bg-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800 p-3">
              <p className="text-sm text-red-300 whitespace-pre-wrap">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 px-4 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {t('modal.cancel')}
            </button>
            <button
              type="submit"
              disabled={busy || !action}
              className={`flex-1 px-4 py-2.5 ${action === 'continue'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : action === 'return'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                } text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center`}
            >
              {busy ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('modal.processing')}
                </>
              ) : action === 'continue' ? (
                <>
                  <PlayIcon className="h-4 w-4 mr-1.5" />
                  {t('ambientacion.continueToMix')}
                </>
              ) : action === 'return' ? (
                <>{t('ambientacion.returnToFridge')}</>
              ) : (
                <>{t('ambientacion.confirmAndRemove')}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
