/**
 * =====================================================
 * New Paste Modal Component
 * =====================================================
 */

import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import ShelfLifeIndicator from '../ui/ShelfLifeIndicator';
import { formatDate } from '../../lib/qrParser';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  DocumentTextIcon,
  ExclamationCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export default function NewPasteModal({
  isOpen,
  onClose,
  onConfirm,
  parsedData,
  isLoading = false,
}) {
  const [did, setDid] = useState('');
  const [didError, setDidError] = useState('');
  const [manufactureDate, setManufactureDate] = useState('');
  const [manufactureDateError, setManufactureDateError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setDid('');
        setDidError('');
        setManufactureDate('');
        setManufactureDateError('');
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!parsedData) return null;

  const requiresManualEntry = parsedData.requiresManualEntry;

  const handleConfirm = () => {
    let hasError = false;
    
    if (!did.trim()) {
      setDidError('El DID (Document Identification) es obligatorio');
      hasError = true;
    } else {
      setDidError('');
    }

    if (requiresManualEntry && !manufactureDate.trim()) {
      setManufactureDateError('La fecha de fabricación es obligatoria para este modelo');
      hasError = true;
    } else {
      setManufactureDateError('');
    }

    if (hasError) return;

    // Pass both DID and manufacture date if required
    onConfirm(did.trim(), requiresManualEntry ? manufactureDate.trim() : null);
  };

  const handleDidChange = (e) => {
    setDid(e.target.value);
    if (didError && e.target.value.trim()) {
      setDidError('');
    }
  };

  const handleManufactureDateChange = (e) => {
    setManufactureDate(e.target.value);
    if (manufactureDateError && e.target.value.trim()) {
      setManufactureDateError('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Registro de Pasta" size="lg">
      <div className="space-y-6">
        <div className="rounded-lg bg-blue-900/30 p-4 border border-blue-800">
          <p className="text-sm text-blue-300">
            Verifique que los datos escaneados sean correctos e ingrese el DID{requiresManualEntry ? ' y la fecha de fabricación' : ''} antes de confirmar el registro.
          </p>
        </div>

        {requiresManualEntry && (
          <div className="rounded-lg bg-amber-900/30 p-4 border border-amber-700">
            <div className="flex items-start">
              <ExclamationCircleIcon className="h-5 w-5 text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-300">
                <p className="font-semibold mb-1">Modelo {parsedData.partNumber} - Entrada Manual Requerida</p>
                <p>La etiqueta de este modelo no incluye fecha de fabricación. Por favor, ingrese manualmente el DID y la fecha de fabricación.</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border-2 border-amber-700 bg-amber-900/30 p-4">
          <label htmlFor="did" className="flex items-center text-sm font-medium text-amber-300 mb-2">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            DID (Document Identification) <span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="text"
            id="did"
            value={did}
            onChange={handleDidChange}
            placeholder="Ingrese el DID..."
            className={`
              block w-full rounded-md border px-3 py-2 text-sm bg-neutral-700 text-white
              focus:outline-none focus:ring-2 placeholder-neutral-400
              ${didError 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                : 'border-neutral-600 focus:border-blue-500 focus:ring-blue-500'
              }
            `}
            autoFocus
          />
          {didError && (
            <p className="mt-2 flex items-center text-sm text-red-400">
              <ExclamationCircleIcon className="h-4 w-4 mr-1" />
              {didError}
            </p>
          )}
        </div>

        {requiresManualEntry && (
          <div className="rounded-lg border-2 border-amber-700 bg-amber-900/30 p-4">
            <label htmlFor="manufactureDate" className="flex items-center text-sm font-medium text-amber-300 mb-2">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Fecha de Fabricación <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              type="date"
              id="manufactureDate"
              value={manufactureDate}
              onChange={handleManufactureDateChange}
              className={`
                block w-full rounded-md border px-3 py-2 text-sm bg-neutral-700 text-white
                focus:outline-none focus:ring-2
                ${manufactureDateError 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : 'border-neutral-600 focus:border-blue-500 focus:ring-blue-500'
                }
              `}
            />
            {manufactureDateError && (
              <p className="mt-2 flex items-center text-sm text-red-400">
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                {manufactureDateError}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-neutral-700 p-4">
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Número de Lote
            </label>
            <p className="mt-1 text-lg font-semibold text-white">{parsedData.lotNumber}</p>
          </div>

          <div className="rounded-lg bg-neutral-700 p-4">
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Serial
            </label>
            <p className="mt-1 text-lg font-semibold text-white">{parsedData.lotSerial}</p>
          </div>

          <div className="col-span-2 rounded-lg bg-neutral-700 p-4">
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Número de Parte
            </label>
            <p className="mt-1 text-lg font-semibold text-white">{parsedData.partNumber}</p>
          </div>

          <div className="rounded-lg bg-neutral-700 p-4">
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Fecha de Fabricación
            </label>
            <p className="mt-1 text-lg font-semibold text-white">
              {parsedData.manufactureDate ? formatDate(parsedData.manufactureDate) : (
                <span className="text-amber-400 text-sm">Se ingresará manualmente</span>
              )}
            </p>
          </div>

          <div className="rounded-lg bg-neutral-700 p-4">
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Fecha de Expiración
            </label>
            <p className="mt-1 text-lg font-semibold text-white">
              {formatDate(parsedData.expirationDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-neutral-700 p-4">
          <span className="text-sm font-medium text-neutral-300">Vida útil restante:</span>
          <ShelfLifeIndicator expirationDate={parsedData.expirationDate} />
        </div>

        <div className="rounded-lg bg-green-900/30 p-4 border border-green-800">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-sm text-green-300">
              Se registrará automáticamente la fecha y hora de entrada al refrigerador.
            </span>
          </div>
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
            onClick={handleConfirm}
            disabled={isLoading || !did.trim() || (requiresManualEntry && !manufactureDate.trim())}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
