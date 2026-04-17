/**
 * =====================================================
 * Deviation Authorization Modal
 * Requires quality personnel credentials to authorize
 * use of an expired paste
 * =====================================================
 */

import { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useLanguage } from '../../i18n';
import {
  ShieldExclamationIcon,
  UserCircleIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function DeviationModal({
  isOpen,
  onClose,
  onAuthorized,
  paste,
  isLoading = false,
  isNewPaste = false,
}) {
  const { t } = useLanguage();
  const [employeeCalidad, setEmployeeCalidad] = useState('');
  const [passwordCalidad, setPasswordCalidad] = useState('');
  const [employeeIngeniero, setEmployeeIngeniero] = useState('');
  const [passwordIngeniero, setPasswordIngeniero] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const employeeRefCalidad = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setEmployeeCalidad('');
      setPasswordCalidad('');
      setEmployeeIngeniero('');
      setPasswordIngeniero('');
      setReason('');
      setError(null);
      setBusy(false);
      setTimeout(() => {
        if (employeeRefCalidad.current) employeeRefCalidad.current.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!paste) return null;

  const expirationDate = new Date(paste.expiration_date);
  const formattedExpDate = expirationDate.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expirationDate.setHours(0, 0, 0, 0);
  const daysExpired = Math.ceil((today - expirationDate) / (1000 * 60 * 60 * 24));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!employeeCalidad.trim()) {
      setError(t('deviation.errorCalidad'));
      return;
    }
    if (!passwordCalidad) {
      setError(t('deviation.errorPwCalidad'));
      return;
    }
    if (!employeeIngeniero.trim()) {
      setError(t('deviation.errorIngeniero'));
      return;
    }
    if (!passwordIngeniero) {
      setError(t('deviation.errorPwIngeniero'));
      return;
    }
    if (!reason.trim()) {
      setError(t('deviation.errorReason'));
      return;
    }

    setBusy(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '';
      
      let endpoint, body;
      if (isNewPaste) {
        // Authorizing new expired paste at creation
        endpoint = `${API_BASE}/api/pastes/authorize-expired`;
        body = {
          ...paste,
          employee_calidad: employeeCalidad.trim(),
          password_calidad: passwordCalidad,
          employee_ingeniero: employeeIngeniero.trim(),
          password_ingeniero: passwordIngeniero,
          reason: reason.trim(),
        };
      } else {
        // Authorizing deviation for existing paste
        endpoint = `${API_BASE}/api/pastes/${paste.id}/deviation`;
        body = {
          employee_calidad: employeeCalidad.trim(),
          password_calidad: passwordCalidad,
          employee_ingeniero: employeeIngeniero.trim(),
          password_ingeniero: passwordIngeniero,
          reason: reason.trim(),
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
        onAuthorized(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isNewPaste ? t('deviation.titleNew') : t('deviation.titleExisting')} size="lg">
      <div className="space-y-5">
        {/* Warning Banner */}
        <div className="rounded-lg bg-red-900/40 border-2 border-red-600 p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-bold text-red-300 uppercase tracking-wide">
                {t('deviation.dualAuth')}
              </h3>
              <p className="mt-2 text-sm text-red-200">
                {isNewPaste
                  ? t('deviation.newPasteMsg', { date: formattedExpDate })
                  : t('deviation.existingMsg', { days: daysExpired, date: formattedExpDate })
                }
              </p>
            </div>
          </div>
        </div>

        {/* Paste Info */}
        <div className="rounded-lg border border-neutral-700 p-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-400">{t('pasteDetails.did')}</span>
              <span className="ml-2 font-medium text-zinc-400">{paste.did}</span>
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
              <span className="text-neutral-400">{t('pasteDetails.expirationDate')}</span>
              <span className="ml-2 font-bold text-red-400">{formattedExpDate}</span>
            </div>
          </div>
        </div>

        {/* Protocol Notice */}
        <div className="rounded-lg bg-amber-900/30 border border-amber-700 p-3">
          <div className="flex items-start">
            <ShieldExclamationIcon className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="ml-2">
              <p className="text-xs text-amber-300 font-medium">{isNewPaste ? t('deviation.protocol') : t('deviation.protocolDev')}</p>
              <ul className="mt-1 text-xs text-amber-200 space-y-0.5 list-disc list-inside">
                {t('deviation.protocolItems').map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>

        {/* Authorization Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-b border-neutral-700 pb-4">
            <div className="bg-deadtimes-card border-l-4 border-blue-500 pl-3 py-2 mb-3">
              <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wide">{t('deviation.step1')}</h4>
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-neutral-300 mb-1.5">
                {t('deviation.employeeCalidad')}
              </label>
              <input
                ref={employeeRefCalidad}
                type="text"
                value={employeeCalidad}
                onChange={(e) => setEmployeeCalidad(e.target.value)}
                placeholder="Ej: 1A, 123B"
                disabled={busy}
                className="block w-full rounded-md border border-blue-600 bg-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div className="mt-3">
              <label className="flex items-center text-sm font-medium text-neutral-300 mb-1.5">
                {t('deviation.passwordCalidad')}
              </label>
              <input
                type="password"
                value={passwordCalidad}
                onChange={(e) => setPasswordCalidad(e.target.value)}
                placeholder="••••••••"
                disabled={busy}
                className="block w-full rounded-md border border-blue-600 bg-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="border-b border-neutral-700 pb-4">
            <div className="bg-green-900/30 border-l-4 border-green-500 pl-3 py-2 mb-3">
              <h4 className="text-sm font-bold text-green-300 uppercase tracking-wide">{t('deviation.step2')}</h4>
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-neutral-300 mb-1.5">
                {t('deviation.employeeIngeniero')}
              </label>
              <input
                type="text"
                value={employeeIngeniero}
                onChange={(e) => setEmployeeIngeniero(e.target.value)}
                placeholder="Ej: 1A, 123B"
                disabled={busy}
                className="block w-full rounded-md border border-green-600 bg-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
              />
            </div>

            <div className="mt-3">
              <label className="flex items-center text-sm font-medium text-neutral-300 mb-1.5">
                {t('deviation.passwordIngeniero')}
              </label>
              <input
                type="password"
                value={passwordIngeniero}
                onChange={(e) => setPasswordIngeniero(e.target.value)}
                placeholder="••••••••"
                disabled={busy}
                className="block w-full rounded-md border border-green-600 bg-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <div className="bg-yellow-900/30 border-l-4 border-yellow-500 pl-3 py-2 mb-3">
              <label className="text-sm font-bold text-yellow-300 uppercase tracking-wide">{t('deviation.step3')}</label>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('deviation.reasonPlaceholder')}
              rows={3}
              disabled={busy}
              className="block w-full rounded-md border border-neutral-600 bg-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50 resize-none"
            />
          </div>

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
              disabled={busy}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center uppercase tracking-wide"
            >
              {busy ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('deviation.verifyingCreds')}
                </>
              ) : (
                <>
                  {t('deviation.authorize')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
