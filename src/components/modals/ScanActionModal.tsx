/**
 * =====================================================
 * Componente: Modal de Acción de Escaneo
 * =====================================================
 * Modal para confirmar acciones de escaneo (salida, mezclado, etc.)
 */

'use client';

import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { SolderPaste, STATUS_NEXT_ACTIONS, SolderPasteStatus } from '@/types';
import { formatDate, formatDateTime } from '@/lib/qrParser';
import { CheckCircleIcon, XCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface ScanActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  paste: SolderPaste | null;
  isLoading?: boolean;
}

export default function ScanActionModal({
  isOpen,
  onClose,
  onConfirm,
  paste,
  isLoading = false,
}: ScanActionModalProps) {
  if (!paste) return null;

  const nextAction = STATUS_NEXT_ACTIONS[paste.status as SolderPasteStatus];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={nextAction.title} size="lg">
      <div className="space-y-6">
        {/* Información de la pasta */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <span className="text-gray-500">DID:</span>
              <span className="ml-2 font-medium text-blue-600">{paste.did}</span>
            </div>
            <div>
              <span className="text-gray-500">Lote:</span>
              <span className="ml-2 font-medium">{paste.lot_number}</span>
            </div>
            <div>
              <span className="text-gray-500">Serial:</span>
              <span className="ml-2 font-medium">{paste.lot_serial}</span>
            </div>
            <div>
              <span className="text-gray-500">Parte:</span>
              <span className="ml-2 font-medium">{paste.part_number}</span>
            </div>
            <div>
              <span className="text-gray-500">Línea SMT:</span>
              <span className="ml-2">
                {paste.smt_location ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {paste.smt_location}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Estado actual y siguiente */}
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Estado actual</p>
            <StatusBadge status={paste.status} />
          </div>
          <ArrowRightIcon className="h-5 w-5 text-gray-400" />
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Siguiente estado</p>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-sm font-medium text-blue-800">
              {nextAction.title}
            </span>
          </div>
        </div>

        {/* Historial de timestamps */}
        <div className="space-y-2 text-sm">
          <h4 className="font-medium text-gray-700">Historial:</h4>
          <div className="rounded-lg bg-gray-50 p-3 space-y-1">
            {paste.fridge_in_datetime && (
              <p><span className="text-gray-500">Entrada refrigerador:</span> {formatDateTime(paste.fridge_in_datetime)}</p>
            )}
            {paste.fridge_out_datetime && (
              <p><span className="text-gray-500">Salida refrigerador:</span> {formatDateTime(paste.fridge_out_datetime)}</p>
            )}
            {paste.mixing_start_datetime && (
              <p><span className="text-gray-500">Inicio mezclado:</span> {formatDateTime(paste.mixing_start_datetime)}</p>
            )}
            {paste.viscosity_datetime && (
              <p><span className="text-gray-500">Viscosidad:</span> {paste.viscosity_value} @ {formatDateTime(paste.viscosity_datetime)}</p>
            )}
            {paste.opened_datetime && (
              <p><span className="text-gray-500">Apertura:</span> {formatDateTime(paste.opened_datetime)}</p>
            )}
          </div>
        </div>

        {/* Mensaje de confirmación */}
        <div className="rounded-lg bg-amber-50 p-4">
          <p className="text-sm text-amber-800">{nextAction.description}</p>
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
                Procesando...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
