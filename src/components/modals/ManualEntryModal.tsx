/**
 * =====================================================
 * Componente: ManualEntryModal
 * =====================================================
 * Modal para ingresar datos de pasta manualmente cuando el escáner falla
 * Permite seleccionar número de parte de los registrados y llenar los demás campos
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import { 
  PencilSquareIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  HashtagIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (qrData: string) => void;
}

interface PartNumber {
  id: number;
  part_number: string;
  description: string | null;
}

export default function ManualEntryModal({
  isOpen,
  onClose,
  onSubmit,
}: ManualEntryModalProps) {
  // Campos del formulario
  const [lotNumber, setLotNumber] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [manufactureDate, setManufactureDate] = useState('');
  const [serial, setSerial] = useState('');
  
  // Estado
  const [partNumbers, setPartNumbers] = useState<PartNumber[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar números de parte registrados
  const fetchPartNumbers = useCallback(async () => {
    setIsLoadingParts(true);
    try {
      const response = await fetch('/api/part-lines');
      const data = await response.json();

      if (data.success && data.data?.partNumbers) {
        setPartNumbers(data.data.partNumbers);
      }
    } catch (error) {
      console.error('Error fetching part numbers:', error);
    } finally {
      setIsLoadingParts(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPartNumbers();
    }
  }, [isOpen, fetchPartNumbers]);

  // Limpiar formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      setLotNumber('');
      setPartNumber('');
      setExpirationDate('');
      setManufactureDate('');
      setSerial('');
      setErrors({});
    }
  }, [isOpen]);

  // Convertir fecha de input (YYYY-MM-DD) a formato QR (YYMMDD)
  const dateToQRFormat = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!lotNumber.trim()) {
      newErrors.lotNumber = 'El número de lote es requerido';
    }

    if (!partNumber) {
      newErrors.partNumber = 'Seleccione un número de parte';
    }

    if (!expirationDate) {
      newErrors.expirationDate = 'La fecha de expiración es requerida';
    } else {
      // Validar que no esté vencida
      const expDate = new Date(expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expDate < today) {
        newErrors.expirationDate = 'No se puede registrar una pasta vencida';
      }
    }

    if (!manufactureDate) {
      newErrors.manufactureDate = 'La fecha de fabricación es requerida';
    } else {
      // Validar que fabricación sea anterior a expiración
      if (expirationDate) {
        const mfgDate = new Date(manufactureDate);
        const expDate = new Date(expirationDate);
        
        if (mfgDate >= expDate) {
          newErrors.manufactureDate = 'La fecha de fabricación debe ser anterior a la de expiración';
        }
      }
    }

    if (!serial.trim()) {
      newErrors.serial = 'El serial es requerido';
    } else if (!/^\d+$/.test(serial.trim())) {
      newErrors.serial = 'El serial debe ser un número';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // Construir el código QR en el formato esperado: lote,parte,expiración,fabricación,serial
    const qrCode = [
      lotNumber.trim(),
      partNumber,
      dateToQRFormat(expirationDate),
      dateToQRFormat(manufactureDate),
      serial.trim().padStart(3, '0'),
    ].join(',');

    onSubmit(qrCode);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  // Obtener fecha mínima para expiración (hoy)
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Entrada Manual de Pasta"
      size="lg"
    >
      <div className="space-y-5">
        {/* Instrucciones */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <div className="flex items-start">
            <PencilSquareIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-300">
              <p>Complete los campos con la información de la etiqueta de la pasta.</p>
              <p className="mt-1 text-xs text-blue-400">
                El número de parte se selecciona de los registrados en el sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Campos del formulario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Número de Lote */}
          <div>
            <label className="flex items-center text-sm font-medium text-neutral-300 mb-2">
              <HashtagIcon className="h-4 w-4 mr-1.5 text-neutral-500" />
              Número de Lote <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              type="text"
              value={lotNumber}
              onChange={(e) => {
                setLotNumber(e.target.value);
                if (errors.lotNumber) setErrors((prev) => ({ ...prev, lotNumber: '' }));
              }}
              placeholder="Ej: 50822985"
              className={`
                w-full px-3 py-2 bg-neutral-700 border rounded-lg text-white placeholder-neutral-500
                focus:outline-none focus:ring-2
                ${errors.lotNumber 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-neutral-600 focus:ring-blue-500'}
              `}
            />
            {errors.lotNumber && (
              <p className="mt-1 text-xs text-red-400 flex items-center">
                <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1" />
                {errors.lotNumber}
              </p>
            )}
          </div>

          {/* Serial */}
          <div>
            <label className="flex items-center text-sm font-medium text-neutral-300 mb-2">
              <DocumentTextIcon className="h-4 w-4 mr-1.5 text-neutral-500" />
              Serial <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              type="text"
              value={serial}
              onChange={(e) => {
                setSerial(e.target.value);
                if (errors.serial) setErrors((prev) => ({ ...prev, serial: '' }));
              }}
              placeholder="Ej: 017"
              className={`
                w-full px-3 py-2 bg-neutral-700 border rounded-lg text-white placeholder-neutral-500
                focus:outline-none focus:ring-2
                ${errors.serial 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-neutral-600 focus:ring-blue-500'}
              `}
            />
            {errors.serial && (
              <p className="mt-1 text-xs text-red-400 flex items-center">
                <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1" />
                {errors.serial}
              </p>
            )}
          </div>

          {/* Número de Parte - Selector */}
          <div className="sm:col-span-2">
            <label className="flex items-center text-sm font-medium text-neutral-300 mb-2">
              <DocumentTextIcon className="h-4 w-4 mr-1.5 text-neutral-500" />
              Número de Parte <span className="text-red-400 ml-1">*</span>
            </label>
            {isLoadingParts ? (
              <div className="flex items-center justify-center py-3 bg-neutral-700 border border-neutral-600 rounded-lg">
                <svg className="animate-spin h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-neutral-400">Cargando...</span>
              </div>
            ) : partNumbers.length > 0 ? (
              <select
                value={partNumber}
                onChange={(e) => {
                  setPartNumber(e.target.value);
                  if (errors.partNumber) setErrors((prev) => ({ ...prev, partNumber: '' }));
                }}
                className={`
                  w-full px-3 py-2 bg-neutral-700 border rounded-lg text-white
                  focus:outline-none focus:ring-2
                  ${errors.partNumber 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-neutral-600 focus:ring-blue-500'}
                `}
              >
                <option value="">Seleccione un número de parte...</option>
                {partNumbers.map((pn) => (
                  <option key={pn.id} value={pn.part_number}>
                    {pn.part_number} {pn.description ? `- ${pn.description}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="py-3 px-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-400">
                  No hay números de parte registrados. Configure los números de parte primero.
                </p>
              </div>
            )}
            {errors.partNumber && (
              <p className="mt-1 text-xs text-red-400 flex items-center">
                <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1" />
                {errors.partNumber}
              </p>
            )}
          </div>

          {/* Fecha de Fabricación */}
          <div>
            <label className="flex items-center text-sm font-medium text-neutral-300 mb-2">
              <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-neutral-500" />
              Fecha de Fabricación <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              type="date"
              value={manufactureDate}
              onChange={(e) => {
                setManufactureDate(e.target.value);
                if (errors.manufactureDate) setErrors((prev) => ({ ...prev, manufactureDate: '' }));
              }}
              className={`
                w-full px-3 py-2 bg-neutral-700 border rounded-lg text-white
                focus:outline-none focus:ring-2
                ${errors.manufactureDate 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-neutral-600 focus:ring-blue-500'}
              `}
            />
            {errors.manufactureDate && (
              <p className="mt-1 text-xs text-red-400 flex items-center">
                <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1" />
                {errors.manufactureDate}
              </p>
            )}
          </div>

          {/* Fecha de Expiración */}
          <div>
            <label className="flex items-center text-sm font-medium text-neutral-300 mb-2">
              <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-neutral-500" />
              Fecha de Expiración <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => {
                setExpirationDate(e.target.value);
                if (errors.expirationDate) setErrors((prev) => ({ ...prev, expirationDate: '' }));
              }}
              min={getTodayString()}
              className={`
                w-full px-3 py-2 bg-neutral-700 border rounded-lg text-white
                focus:outline-none focus:ring-2
                ${errors.expirationDate 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-neutral-600 focus:ring-blue-500'}
              `}
            />
            {errors.expirationDate && (
              <p className="mt-1 text-xs text-red-400 flex items-center">
                <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1" />
                {errors.expirationDate}
              </p>
            )}
          </div>
        </div>

        {/* Aviso de pasta vencida */}
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
          <p className="text-xs text-red-400 flex items-center">
            <ExclamationCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            Las pastas con fecha de expiración vencida no pueden ser registradas.
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-700">
          <button
            onClick={handleClose}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-700 border border-neutral-600 rounded-lg hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500"
          >
            <XCircleIcon className="h-4 w-4 mr-2" />
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={partNumbers.length === 0}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Continuar
          </button>
        </div>
      </div>
    </Modal>
  );
}
