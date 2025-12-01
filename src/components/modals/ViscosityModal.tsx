/**
 * =====================================================
 * Componente: Modal de Viscosidad
 * =====================================================
 * Modal para ingresar y validar el valor de viscosidad
 */

'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { SolderPaste } from '@/types';
import { isValidViscosity, formatDateTime } from '@/lib/qrParser';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

interface ViscosityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (viscosity: number) => void;
  paste: SolderPaste | null;
  isLoading?: boolean;
}

export default function ViscosityModal({
  isOpen,
  onClose,
  onConfirm,
  paste,
  isLoading = false,
}: ViscosityModalProps) {
  const [viscosity, setViscosity] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Limpiar al cerrar
  useEffect(() => {
    if (!isOpen) {
      setViscosity('');
      setError('');
    }
  }, [isOpen]);

  if (!paste) return null;

  const isRejected = paste.status === 'rejected';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setViscosity(value);
    setError('');

    // Validar en tiempo real
    const numValue = parseFloat(value);
    if (value && !isNaN(numValue)) {
      if (numValue < 150) {
        setError('Valor muy bajo. Mínimo permitido: 150');
      } else if (numValue > 180) {
        setError('Valor muy alto. Máximo permitido: 180');
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
      setError(`Valor ${numValue} fuera de rango. Debe estar entre 150-180.`);
      return;
    }

    onConfirm(numValue);
  };

  const numericValue = parseFloat(viscosity);
  const isValidValue = !isNaN(numericValue) && isValidViscosity(numericValue);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registro de Viscosidad" size="lg">
      <div className="space-y-6">
        {/* Aviso de rechazo previo */}
        {isRejected && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Viscosidad rechazada anteriormente
                </p>
                <p className="text-sm text-red-700 mt-1">
                  El valor anterior ({paste.viscosity_value}) estaba fuera del rango permitido.
                  Por favor, vuelva a mezclar e ingrese un nuevo valor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Información de la pasta */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Lote:</span>
              <span className="ml-2 font-medium">{paste.lot_number}</span>
            </div>
            <div>
              <span className="text-gray-500">Serial:</span>
              <span className="ml-2 font-medium">{paste.lot_serial}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Inicio de mezclado:</span>
              <span className="ml-2 font-medium">{formatDateTime(paste.mixing_start_datetime)}</span>
            </div>
          </div>
        </div>

        {/* Indicador de rango válido */}
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <BeakerIcon className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600">Rango válido de viscosidad</p>
            <p className="text-2xl font-bold text-gray-900">150 - 180</p>
          </div>
        </div>

        {/* Campo de entrada */}
        <div>
          <label htmlFor="viscosity" className="block text-sm font-medium text-gray-700 mb-2">
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
                block w-full rounded-lg border px-4 py-3 text-lg text-center font-semibold
                focus:outline-none focus:ring-2
                ${error
                  ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                  : isValidValue
                    ? 'border-green-300 text-green-900 focus:border-green-500 focus:ring-green-500'
                    : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
                }
              `}
              autoFocus
            />
            {/* Indicador visual */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {isValidValue && (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              )}
              {error && (
                <XCircleIcon className="h-6 w-6 text-red-500" />
              )}
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Barra visual del rango */}
        <div className="pt-2">
          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
            {/* Zona roja izquierda (< 150) */}
            <div className="absolute left-0 h-full w-1/3 bg-red-200" />
            {/* Zona verde central (150-180) */}
            <div className="absolute left-1/3 h-full w-1/3 bg-green-300" />
            {/* Zona roja derecha (> 180) */}
            <div className="absolute right-0 h-full w-1/3 bg-red-200" />
            
            {/* Indicador de valor actual */}
            {!isNaN(numericValue) && numericValue > 0 && numericValue < 250 && (
              <div
                className="absolute top-0 w-1 h-full bg-blue-600 shadow-lg"
                style={{
                  left: `${Math.min(Math.max((numericValue / 250) * 100, 0), 100)}%`,
                }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>150</span>
            <span>180</span>
            <span>250</span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <XCircleIcon className="h-4 w-4 mr-2" />
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !viscosity || !!error}
            className={`
              inline-flex items-center px-4 py-2 text-sm font-medium text-white 
              border border-transparent rounded-md shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50
              ${isValidValue
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }
            `}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
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
