/**
 * =====================================================
 * Componente: Tabla Principal de Pastas
 * =====================================================
 * Muestra todos los registros con sus estados
 */

'use client';

import { SolderPaste } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import ShelfLifeIndicator from '@/components/ui/ShelfLifeIndicator';
import { formatDate, formatDateTime } from '@/lib/qrParser';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';

interface PasteTableProps {
  pastes: SolderPaste[];
  onView?: (paste: SolderPaste) => void;
  onDelete?: (paste: SolderPaste) => void;
  isLoading?: boolean;
}

export default function PasteTable({
  pastes,
  onView,
  onDelete,
  isLoading = false,
}: PasteTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="ml-3 text-gray-500">Cargando registros...</span>
      </div>
    );
  }

  if (pastes.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros</h3>
        <p className="mt-1 text-sm text-gray-500">
          Escanee un código QR para registrar una nueva pasta.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Lote / Serial
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Número de Parte
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vida Útil
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Entrada Fridge
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Viscosidad
            </th>
            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pastes.map((paste) => (
            <tr key={paste.id} className="hover:bg-gray-50">
              <td className="px-4 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{paste.lot_number}</div>
                  <div className="text-sm text-gray-500">Serial: {paste.lot_serial}</div>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{paste.part_number}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <StatusBadge status={paste.status} size="sm" />
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <ShelfLifeIndicator expirationDate={paste.expiration_date} compact />
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {formatDateTime(paste.fridge_in_datetime)}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {paste.viscosity_value ? (
                  <span className={`text-sm font-medium ${
                    paste.status === 'rejected' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {paste.viscosity_value}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-center">
                <div className="flex items-center justify-center space-x-2">
                  {onView && (
                    <button
                      onClick={() => onView(paste)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Ver detalles"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(paste)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
