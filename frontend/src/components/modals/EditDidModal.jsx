/**
 * =====================================================
 * Edit DID Modal Component
 * =====================================================
 * Permite editar el DID solo cuando la pasta está en refrigerador
 */

import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { PencilIcon } from '@heroicons/react/24/outline';

export default function EditDidModal({
  isOpen,
  onClose,
  paste,
  onSave,
}) {
  const [did, setDid] = useState(paste?.did || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens or paste changes
  useEffect(() => {
    if (paste) {
      setDid(paste.did || '');
      setError('');
    }
  }, [paste]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedDid = did.trim();

    if (!trimmedDid) {
      setError('El DID es obligatorio');
      return;
    }

    if (trimmedDid === paste.did) {
      setError('El DID no ha cambiado');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(paste.id, trimmedDid);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar el DID');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setDid(paste?.did || '');
      setError('');
      onClose();
    }
  };

  if (!paste) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar DID" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Info */}
        <div className="bg-neutral-700 rounded-lg p-4 space-y-2">
          <div className="text-sm">
            <span className="text-neutral-400">Lote:</span>
            <span className="ml-2 text-white font-medium">{paste.lot_number}</span>
          </div>
          <div className="text-sm">
            <span className="text-neutral-400">Serial:</span>
            <span className="ml-2 text-white font-medium">{paste.lot_serial}</span>
          </div>
          <div className="text-sm">
            <span className="text-neutral-400">Número de Parte:</span>
            <span className="ml-2 text-white font-medium">{paste.part_number}</span>
          </div>
        </div>

        {/* DID Input */}
        <div>
          <label htmlFor="did-input" className="block text-sm font-medium text-neutral-300 mb-2">
            DID (Document Identification)
          </label>
          <input
            id="did-input"
            type="text"
            value={did}
            onChange={(e) => setDid(e.target.value)}
            className="block w-full rounded-md border-neutral-600 bg-neutral-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
            placeholder="Ingrese el DID"
            autoFocus
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-neutral-400">
            DID actual: <span className="text-blue-400 font-medium">{paste.did}</span>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-900/50 p-3 border border-red-800">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Warning */}
        <div className="rounded-md bg-yellow-900/30 p-3 border border-yellow-700">
          <p className="text-xs text-yellow-300">
            ⚠️ Solo se puede editar el DID cuando la pasta está en el refrigerador
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-700">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-neutral-700 border border-neutral-600 rounded-md shadow-sm hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <PencilIcon className="h-4 w-4 mr-1.5" />
                Guardar
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
