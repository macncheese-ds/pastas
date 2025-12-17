/**
 * =====================================================
 * Manual Entry Modal Component
 * =====================================================
 */

import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function ManualEntryModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) {
  const [formData, setFormData] = useState({
    did: '',
    lotNumber: '',
    lotSerial: '',
    partNumber: '',
    manufactureDate: '',
    expirationDate: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setFormData({
          did: '',
          lotNumber: '',
          lotSerial: '',
          partNumber: '',
          manufactureDate: '',
          expirationDate: '',
        });
        setErrors({});
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.did.trim()) {
      newErrors.did = 'El DID es obligatorio';
    }
    if (!formData.lotNumber.trim()) {
      newErrors.lotNumber = 'El número de lote es obligatorio';
    }
    if (!formData.lotSerial.trim()) {
      newErrors.lotSerial = 'El serial es obligatorio';
    }
    if (!formData.partNumber.trim()) {
      newErrors.partNumber = 'El número de parte es obligatorio';
    }
    if (!formData.manufactureDate) {
      newErrors.manufactureDate = 'La fecha de fabricación es obligatoria';
    }
    if (!formData.expirationDate) {
      newErrors.expirationDate = 'La fecha de expiración es obligatoria';
    }

    if (formData.manufactureDate && formData.expirationDate) {
      const mfgDate = new Date(formData.manufactureDate);
      const expDate = new Date(formData.expirationDate);
      if (expDate <= mfgDate) {
        newErrors.expirationDate = 'La fecha de expiración debe ser posterior a la fecha de fabricación';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const parsedData = {
      did: formData.did.trim(),
      lotNumber: formData.lotNumber.trim(),
      lotSerial: formData.lotSerial.trim(),
      partNumber: formData.partNumber.trim(),
      manufactureDate: new Date(formData.manufactureDate),
      expirationDate: new Date(formData.expirationDate),
    };

    onConfirm(parsedData);
  };

  const inputClasses = (field) => `
    block w-full rounded-md border px-3 py-2 text-sm bg-neutral-700 text-white
    focus:outline-none focus:ring-2 placeholder-neutral-400
    ${errors[field]
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-neutral-600 focus:border-blue-500 focus:ring-blue-500'
    }
  `;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ingreso Manual de Pasta" size="lg">
      <div className="space-y-6">
        <div className="rounded-lg bg-blue-900/30 p-4 border border-blue-800">
          <p className="text-sm text-blue-300">
            Use este formulario cuando el código QR no pueda ser escaneado correctamente.
            Todos los campos son obligatorios.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="did" className="block text-sm font-medium text-neutral-300 mb-1">
              DID (Document Identification) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="did"
              value={formData.did}
              onChange={handleChange('did')}
              placeholder="Ingrese el DID..."
              className={inputClasses('did')}
            />
            {errors.did && (
              <p className="mt-1 flex items-center text-sm text-red-400">
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                {errors.did}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="lotNumber" className="block text-sm font-medium text-neutral-300 mb-1">
                Número de Lote <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="lotNumber"
                value={formData.lotNumber}
                onChange={handleChange('lotNumber')}
                placeholder="Ej: LOT123456"
                className={inputClasses('lotNumber')}
              />
              {errors.lotNumber && (
                <p className="mt-1 flex items-center text-sm text-red-400">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {errors.lotNumber}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="lotSerial" className="block text-sm font-medium text-neutral-300 mb-1">
                Serial <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="lotSerial"
                value={formData.lotSerial}
                onChange={handleChange('lotSerial')}
                placeholder="Ej: 001"
                className={inputClasses('lotSerial')}
              />
              {errors.lotSerial && (
                <p className="mt-1 flex items-center text-sm text-red-400">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {errors.lotSerial}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="partNumber" className="block text-sm font-medium text-neutral-300 mb-1">
              Número de Parte <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="partNumber"
              value={formData.partNumber}
              onChange={handleChange('partNumber')}
              placeholder="Ej: M800SA"
              className={inputClasses('partNumber')}
            />
            {errors.partNumber && (
              <p className="mt-1 flex items-center text-sm text-red-400">
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                {errors.partNumber}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="manufactureDate" className="block text-sm font-medium text-neutral-300 mb-1">
                Fecha de Fabricación <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                id="manufactureDate"
                value={formData.manufactureDate}
                onChange={handleChange('manufactureDate')}
                className={inputClasses('manufactureDate')}
              />
              {errors.manufactureDate && (
                <p className="mt-1 flex items-center text-sm text-red-400">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {errors.manufactureDate}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="expirationDate" className="block text-sm font-medium text-neutral-300 mb-1">
                Fecha de Expiración <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                id="expirationDate"
                value={formData.expirationDate}
                onChange={handleChange('expirationDate')}
                className={inputClasses('expirationDate')}
              />
              {errors.expirationDate && (
                <p className="mt-1 flex items-center text-sm text-red-400">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {errors.expirationDate}
                </p>
              )}
            </div>
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
            onClick={handleSubmit}
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
                Registrar Pasta
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
