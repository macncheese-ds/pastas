/**
 * =====================================================
 * Componente: Modal de Nuevo Registro
 * =====================================================
 * Modal para confirmar y registrar una nueva pasta
 */

'use client';

import Modal from '@/components/ui/Modal';
import ShelfLifeIndicator from '@/components/ui/ShelfLifeIndicator';
import { ParsedQRData } from '@/types';
import { formatDate } from '@/lib/qrParser';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface NewPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  parsedData: ParsedQRData | null;
  isLoading?: boolean;
}

export default function NewPasteModal({
  isOpen,
  onClose,
  onConfirm,
  parsedData,
  isLoading = false,
}: NewPasteModalProps) {
  if (!parsedData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Registro de Pasta" size="lg">
      <div className="space-y-6">
        {/* Mensaje de verificación */}
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            Verifique que los datos escaneados sean correctos antes de confirmar el registro.
          </p>
        </div>

        {/* Datos del QR */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Número de Lote
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900">{parsedData.lotNumber}</p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Serial
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900">{parsedData.lotSerial}</p>
          </div>

          <div className="col-span-2 rounded-lg bg-gray-50 p-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Número de Parte
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900">{parsedData.partNumber}</p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Fecha de Fabricación
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {formatDate(parsedData.manufactureDate)}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Fecha de Expiración
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {formatDate(parsedData.expirationDate)}
            </p>
          </div>
        </div>

        {/* Indicador de vida útil */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
          <span className="text-sm font-medium text-gray-700">Vida útil restante:</span>
          <ShelfLifeIndicator expirationDate={parsedData.expirationDate} />
        </div>

        {/* Timestamp automático */}
        <div className="rounded-lg bg-green-50 p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-green-800">
              Se registrará automáticamente la fecha y hora de entrada al refrigerador.
            </span>
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
                Guardando...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Confirmar Registro
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
