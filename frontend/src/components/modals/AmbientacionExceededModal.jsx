/**
 * =====================================================
 * Ambientacion Exceeded Modal
 * Warns that a paste has been in ambientacion for extended time
 * Can allow returning to fridge if <24h or retiring if 24h+
 * =====================================================
 */

import { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import {
  ClockIcon,
  UserCircleIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function AmbientacionExceededModal({
  isOpen,
  onClose,
  onRetired,
  onReturnedToFridge,
  paste,
  hoursElapsed = 0,
}) {
  const [employeeInput, setEmployeeInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState(null); // 'retire' or 'return'
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!action) {
      setError('Seleccione una acción');
      return;
    }

    if (!employeeInput.trim()) {
      setError('Ingrese su número de empleado para confirmar');
      return;
    }
    if (!password) {
      setError('Ingrese su contraseña');
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
        throw new Error(data.error || `Error al ${action === 'return' ? 'devolver' : 'retirar'} la pasta`);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ambientación" size="lg">
      <div className="space-y-5">
        {/* Warning Banner */}
        <div className={`rounded-lg ${canReturn ? 'bg-yellow-900/40 border-2 border-yellow-500' : 'bg-orange-900/40 border-2 border-orange-500'} p-4`}>
          <div className="flex items-start">
            <ClockIcon className={`h-7 w-7 ${canReturn ? 'text-yellow-400' : 'text-orange-400'} flex-shrink-0 mt-0.5 animate-pulse`} />
            <div className="ml-3">
              <h3 className={`text-sm font-bold ${canReturn ? 'text-yellow-300' : 'text-orange-300'} uppercase tracking-wide`}>
                {canReturn ? 'Ambientación en Curso' : 'Tiempo de Ambientación Excedido'}
              </h3>
              <p className={`mt-2 text-sm ${canReturn ? 'text-yellow-200' : 'text-orange-200'}`}>
                Esta pasta lleva <strong className={canReturn ? 'text-yellow-100' : 'text-orange-100'}>{hoursElapsed.toFixed(1)} horas</strong> en ambientación.
                El tiempo máximo permitido es de <strong>24 horas</strong>.
              </p>
              {canReturn ? (
                <p className="mt-2 text-sm text-yellow-300 font-semibold">
                  Opciones disponibles: Devolver a refrigeración o retirar la pasta.
                </p>
              ) : (
                <p className="mt-2 text-sm text-orange-300 font-semibold">
                  Esta pasta debe ser retirada y no puede continuar en el proceso.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Paste Info */}
        <div className="rounded-lg border border-neutral-700 p-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-400">DID:</span>
              <span className="ml-2 font-medium text-blue-400">{paste.did}</span>
            </div>
            <div>
              <span className="text-neutral-400">Lote:</span>
              <span className="ml-2 font-medium text-white">{paste.lot_number}-{paste.lot_serial}</span>
            </div>
            <div>
              <span className="text-neutral-400">Parte:</span>
              <span className="ml-2 font-medium text-white">{paste.part_number}</span>
            </div>
            <div>
              <span className="text-neutral-400">Salió de heladera:</span>
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
          <p className="text-sm font-medium text-neutral-300 mb-3">Seleccione la acción a realizar:</p>
          
          {/* Always show return option */}
          <div
            onClick={() => setAction('return')}
            className={`relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
              action === 'return'
                ? 'border-green-500 bg-green-900/20'
                : 'border-neutral-700 bg-neutral-800 hover:border-green-600'
            }`}
          >
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-400">Devolver a Refrigeración</h4>
              <p className="text-xs text-neutral-400 mt-1">La pasta regresará a almacenamiento refrigerado y puede continuar después</p>
            </div>
            <div className={`flex-shrink-0 h-5 w-5 rounded-full border-2 ${action === 'return' ? 'border-green-500 bg-green-500' : 'border-neutral-500'}`} />
          </div>

          {/* Always show retire option */}
          <div
            onClick={() => setAction('retire')}
            className={`relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
              action === 'retire'
                ? 'border-red-500 bg-red-900/20'
                : 'border-neutral-700 bg-neutral-800 hover:border-red-600'
            }`}
          >
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-400">Retirar Pasta</h4>
              <p className="text-xs text-neutral-400 mt-1">La pasta será marcada como retirada y no puede continuar en el proceso {!canReturn && '(24h+ excedidas)'}</p>
            </div>
            <div className={`flex-shrink-0 h-5 w-5 rounded-full border-2 ${action === 'retire' ? 'border-red-500 bg-red-500' : 'border-neutral-500'}`} />
          </div>
        </div>

        {/* Acknowledgment Notice */}
        <div className="rounded-lg bg-amber-900/30 border border-amber-700 p-3">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="ml-2">
              <p className="text-xs text-amber-300 font-medium">CONFIRMACIÓN REQUERIDA</p>
              <ul className="mt-1 text-xs text-amber-200 space-y-0.5 list-disc list-inside">
                {action === 'return' ? (
                  <>
                    <li>La pasta volverá a refrigeración donde puede ser procesada posterior</li>
                    <li>Se registrará que devolvió la pasta a refrigeración</li>
                    <li>Puede reanudar el proceso de esta pasta después</li>
                  </>
                ) : (
                  <>
                    <li>Ingrese sus credenciales para confirmar que está informado</li>
                    <li>La pasta será marcada como retirada</li>
                    <li>Se registrará quién realizó el retiro y la fecha/hora</li>
                    <li>Esta acción no puede deshacerse</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Credential Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-neutral-300 mb-1.5">
              <UserCircleIcon className="h-4 w-4 mr-1.5" />
              Número de Empleado
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
                Contraseña
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
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy || !action}
              className={`flex-1 px-4 py-2.5 ${
                action === 'return'
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
                  Procesando...
                </>
              ) : action === 'return' ? (
                <>Devolver a Refrigeración</>
              ) : (
                <>Confirmar y Retirar Pasta</>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
