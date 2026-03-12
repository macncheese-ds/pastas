import React, { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useLanguage } from '../../i18n';
import { 
  UserCircleIcon, 
  LockClosedIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export default function LoginModal({ visible, defaultEmployee = '', onClose, onConfirm, busy }) {
  const { t } = useLanguage();
  const [employeeInput, setEmployeeInput] = useState(defaultEmployee);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const employeeInputRef = useRef(null);

  // Reiniciar todo cuando el modal se abre
  useEffect(() => {
    if (visible) {
      setEmployeeInput(defaultEmployee);
      setPassword('');
      setStatus(null);
      // Focus en el campo de empleado al abrir
      setTimeout(() => {
        if (employeeInputRef.current) {
          employeeInputRef.current.focus();
        }
      }, 100);
    }
  }, [visible, defaultEmployee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    
    if (!employeeInput.trim()) {
      setStatus(t('login.enterEmployee'));
      return;
    }
    if (!password) {
      setStatus(t('login.enterPassword'));
      return;
    }

    try {
      await onConfirm({ employee_input: employeeInput.trim(), password });
    } catch (err) {
      const msg = err && err.message ? err.message : t('errors.generic');
      setStatus(msg);
    }
  };

  return (
    <Modal 
      isOpen={visible} 
      onClose={onClose} 
      title={t('login.title')} 
      size="md"
      showCloseButton={!busy}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-blue-900/30 p-4 border border-blue-800">
          <p className="text-sm text-blue-300">
            {t('login.hint')}
          </p>
        </div>

        <div>
          <label htmlFor="employee" className="flex items-center text-sm font-medium text-neutral-300 mb-2">
            <UserCircleIcon className="h-5 w-5 mr-2" />
            {t('login.employeeNumber')}
          </label>
          <input
            ref={employeeInputRef}
            type="text"
            id="employee"
            value={employeeInput}
            onChange={(e) => setEmployeeInput(e.target.value)}
            placeholder="Ej: 1A, 123B"
            autoComplete="username"
            disabled={busy}
            className="block w-full rounded-md border border-neutral-600 bg-neutral-700 px-3 py-2.5 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="password" className="flex items-center text-sm font-medium text-neutral-300 mb-2">
            <LockClosedIcon className="h-5 w-5 mr-2" />
            {t('login.password')}
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={busy}
            className="block w-full rounded-md border border-neutral-600 bg-neutral-700 px-3 py-2.5 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {status && (
          <div className="rounded-lg bg-red-900/30 border border-red-800 p-4">
            <p className="flex items-center text-sm text-red-300">
              <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              {status}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button 
            type="submit" 
            disabled={busy}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-800"
          >
            {busy ? t('login.verifying') : t('login.submit')}
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={busy}
            className="px-4 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-neutral-800"
          >
            {t('modal.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
