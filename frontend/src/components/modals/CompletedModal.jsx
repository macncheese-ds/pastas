/**
 * =====================================================
 * Completed Modal Component
 * =====================================================
 */

import Modal from '../ui/Modal';
import { formatDateTime } from '../../lib/qrParser';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function CompletedModal({
  isOpen,
  onClose,
  onConfirm,
  paste,
  isLoading = false,
}) {
  if (!paste) return null;

  const isExpired = new Date(paste.expiration_date) < new Date();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pasta Completada - Retiro del Sistema" size="lg">
      <div className="space-y-6">
        <div className="rounded-lg bg-amber-900/30 border border-amber-700 p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">
                Esta pasta ha completado su ciclo de uso
              </p>
              <p className="text-sm text-amber-400 mt-1">
                Al confirmar, se registrará la fecha de retiro y la pasta quedará marcada como eliminada.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-700 p-4">
          <h4 className="text-sm font-medium text-neutral-300 mb-3">Información de la pasta</h4>
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
            <div>
              <span className="text-neutral-400">Parte:</span>
              <span className="ml-2 font-medium text-white">{paste.part_number}</span>
            </div>
            <div>
              <span className="text-neutral-400">Línea SMT:</span>
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

        <div className="rounded-lg border border-neutral-700 p-4">
          <h4 className="text-sm font-medium text-neutral-300 mb-3">Historial completo</h4>
          <div className="space-y-2 text-sm">
            {paste.fridge_in_datetime && (
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-neutral-400">Entrada refrigerador:</span>
                <span className="ml-2 text-white">{formatDateTime(paste.fridge_in_datetime)}</span>
              </div>
            )}
            {paste.fridge_out_datetime && (
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-neutral-400">Salida refrigerador:</span>
                <span className="ml-2 text-white">{formatDateTime(paste.fridge_out_datetime)}</span>
              </div>
            )}
            {paste.mixing_start_datetime && (
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-neutral-400">Inicio mezclado:</span>
                <span className="ml-2 text-white">{formatDateTime(paste.mixing_start_datetime)}</span>
              </div>
            )}
            {paste.viscosity_datetime && (
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-neutral-400">Viscosidad ({paste.viscosity_value}):</span>
                <span className="ml-2 text-white">{formatDateTime(paste.viscosity_datetime)}</span>
              </div>
            )}
            {paste.opened_datetime && (
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-neutral-400">Apertura:</span>
                <span className="ml-2 text-white">{formatDateTime(paste.opened_datetime)}</span>
              </div>
            )}
          </div>
        </div>

        {isExpired && (
          <div className="rounded-lg bg-red-900/30 border border-red-700 p-3">
            <p className="text-sm text-red-400">
              ⚠️ Esta pasta ha expirado (fecha de expiración: {formatDateTime(paste.expiration_date)})
            </p>
          </div>
        )}

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
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Retirando...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4 mr-2" />
                Confirmar Retiro
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
