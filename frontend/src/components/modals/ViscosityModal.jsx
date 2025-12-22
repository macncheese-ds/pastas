/**
 * =====================================================
 * Viscosity Modal Component
 * =====================================================
 */

import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { isValidViscosity, formatDateTime } from '../../lib/qrParser';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

export default function ViscosityModal({
  isOpen,
  onClose,
  onConfirm,
  paste,
  isLoading = false,
}) {
  const [viscosity, setViscosity] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setViscosity('');
        setError('');
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!paste) return null;

  const isRejected = paste.status === 'rejected';

  const handleChange = (e) => {
    const value = e.target.value;
    setViscosity(value);
    setError('');

    const numValue = parseFloat(value);
    if (value && !isNaN(numValue)) {
      if (numValue < 170) {
        setError('Valor muy bajo. Mínimo permitido: 170');
      } else if (numValue > 230) {
        setError('Valor muy alto. Máximo permitido: 230');
      }
    }
  };

  const handleSubmit = () => {
    const numValue = parseFloat(viscosity);

    if (isNaN(numValue)) {
      setError('Ingrese un valor numérico válido');
      return;
    }

    if (!isValidViscosity(numValue)) {
      setError(`Valor ${numValue} fuera de rango. Debe estar entre 170-230.`);
      return;
    }

    onConfirm(numValue);
  };

  const numericValue = parseFloat(viscosity);
  const isValidValue = !isNaN(numericValue) && isValidViscosity(numericValue);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registro de Viscosidad" size="lg">
      <div className="space-y-6">
        {isRejected && (
          <div className="rounded-lg bg-red-900/30 border border-red-700 p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-300">
                  Viscosidad rechazada anteriormente
                </p>
                <p className="text-sm text-red-400 mt-1">
                  El valor anterior ({paste.viscosity_value}) estaba fuera del rango permitido.
                  Por favor, vuelva a mezclar e ingrese un nuevo valor.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-neutral-700 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <span className="text-neutral-400">DID:</span>
              <span className="ml-2 font-medium text-blue-400">{paste.did}</span>
            </div>
            <div>
              <span className="text-neutral-400">Lote:</span>
              <span className="ml-2 font-medium text-white">{paste.lot_number}</span>
            </div>
            <div>
              <span className="text-neutral-400">Serial:</span>
              <span className="ml-2 font-medium text-white">{paste.lot_serial}</span>
            </div>
            <div className="col-span-2">
              <span className="text-neutral-400">Inicio de mezclado:</span>
              <span className="ml-2 font-medium text-white">{formatDateTime(paste.mixing_start_datetime)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <BeakerIcon className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-sm text-neutral-400">Rango válido de viscosidad</p>
            <p className="text-2xl font-bold text-white">170 - 230</p>
          </div>
        </div>

        <div>
          <label htmlFor="viscosity" className="block text-sm font-medium text-neutral-300 mb-2">
            Valor de viscosidad medido
          </label>
          <div className="relative">
            <input
              type="number"
              id="viscosity"
              value={viscosity}
              onChange={handleChange}
              placeholder="Ej: 165"
              min="0"
              max="999"
              step="0.1"
              className={`
                block w-full rounded-lg border px-4 py-3 text-lg text-center font-semibold bg-neutral-700
                focus:outline-none focus:ring-2
                ${error
                  ? 'border-red-500 text-red-300 focus:border-red-500 focus:ring-red-500'
                  : isValidValue
                    ? 'border-green-500 text-green-300 focus:border-green-500 focus:ring-green-500'
                    : 'border-neutral-600 text-white focus:border-blue-500 focus:ring-blue-500'
                }
              `}
              autoFocus
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {isValidValue && (
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              )}
              {error && (
                <XCircleIcon className="h-6 w-6 text-red-400" />
              )}
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-700 border border-neutral-600 rounded-md shadow-sm hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <XCircleIcon className="h-4 w-4 mr-2" />
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !isValidValue}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Registrando...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Registrar Viscosidad
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
