/**
 * =====================================================
 * Componente: Modal de Proceso Completado
 * =====================================================
 * Modal informativo cuando una pasta ya completó el proceso
 */

'use client';

import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { SolderPaste } from '@/types';
import { formatDateTime } from '@/lib/qrParser';
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface CompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  paste: SolderPaste | null;
}

export default function CompletedModal({
  isOpen,
  onClose,
  paste,
}: CompletedModalProps) {
  if (!paste) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Proceso Completado" size="lg">
      <div className="space-y-6">
        {/* Mensaje informativo */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center">
            <InformationCircleIcon className="h-5 w-5 text-gray-600 mr-2" />
            <span className="text-sm text-gray-800">
              Esta pasta ya ha completado todo el proceso de trazabilidad.
            </span>
          </div>
        </div>

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
            <div className="col-span-2">
              <span className="text-gray-500">Estado:</span>
              <span className="ml-2"><StatusBadge status={paste.status} size="sm" /></span>
            </div>
          </div>
        </div>

        {/* Timeline completo */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Historial completo:</h4>
          <div className="space-y-3">
            {paste.fridge_in_datetime && (
              <div className="flex items-center text-sm">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-gray-500 w-40">Entrada refrigerador:</span>
                <span className="font-medium">{formatDateTime(paste.fridge_in_datetime)}</span>
              </div>
            )}
            {paste.fridge_out_datetime && (
              <div className="flex items-center text-sm">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-gray-500 w-40">Salida refrigerador:</span>
                <span className="font-medium">{formatDateTime(paste.fridge_out_datetime)}</span>
              </div>
            )}
            {paste.mixing_start_datetime && (
              <div className="flex items-center text-sm">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-gray-500 w-40">Inicio mezclado:</span>
                <span className="font-medium">{formatDateTime(paste.mixing_start_datetime)}</span>
              </div>
            )}
            {paste.viscosity_datetime && (
              <div className="flex items-center text-sm">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-gray-500 w-40">Viscosidad ({paste.viscosity_value}):</span>
                <span className="font-medium">{formatDateTime(paste.viscosity_datetime)}</span>
              </div>
            )}
            {paste.opened_datetime && (
              <div className="flex items-center text-sm">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-gray-500 w-40">Apertura:</span>
                <span className="font-medium">{formatDateTime(paste.opened_datetime)}</span>
              </div>
            )}
            {paste.removed_datetime && (
              <div className="flex items-center text-sm">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-gray-500 w-40">Retiro:</span>
                <span className="font-medium">{formatDateTime(paste.removed_datetime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botón de cerrar */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
