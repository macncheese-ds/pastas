/**
 * =====================================================
 * Paste Table Component
 * =====================================================
 */

import { useState, useMemo } from 'react';
import StatusBadge from '../ui/StatusBadge';
import ShelfLifeIndicator from '../ui/ShelfLifeIndicator';
import { formatDateTime, formatDate } from '../../lib/qrParser';
import { EyeIcon, ArrowDownTrayIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function PasteTable({
  pastes,
  onAction,
  isLoading = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartNumber, setFilterPartNumber] = useState('');
  const [filterSmtLocation, setFilterSmtLocation] = useState('');

  // Get unique part numbers and SMT locations for filters
  const partNumbers = useMemo(() => {
    const unique = [...new Set(pastes.map(p => p.part_number).filter(Boolean))];
    return unique.sort();
  }, [pastes]);

  const smtLocations = useMemo(() => {
    const unique = [...new Set(pastes.map(p => p.smt_location).filter(Boolean))];
    return unique.sort();
  }, [pastes]);

  // Filter pastes based on search and filters
  const filteredPastes = useMemo(() => {
    return pastes.filter(paste => {
      // Search term filter (DID, lot_number, lot_serial)
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          paste.did?.toLowerCase().includes(search) ||
          paste.lot_number?.toLowerCase().includes(search) ||
          paste.lot_serial?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      // Part number filter
      if (filterPartNumber && paste.part_number !== filterPartNumber) return false;
      // SMT location filter
      if (filterSmtLocation && paste.smt_location !== filterSmtLocation) return false;
      return true;
    });
  }, [pastes, searchTerm, filterPartNumber, filterSmtLocation]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPartNumber('');
    setFilterSmtLocation('');
  };

  const hasActiveFilters = searchTerm || filterPartNumber || filterSmtLocation;

  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/pastes/export/excel');
      if (!response.ok) throw new Error('Error al exportar');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pastas_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar los registros');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="ml-3 text-neutral-400">Cargando registros...</span>
      </div>
    );
  }

  if (pastes.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-neutral-500"
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
          <h3 className="mt-2 text-sm font-medium text-white">No hay registros</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Escanee un código QR para registrar una nueva pasta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Export */}
      <div className="p-4 bg-neutral-900 rounded-lg space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por DID, Lote o Serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Part Number Filter */}
          <select
            value={filterPartNumber}
            onChange={(e) => setFilterPartNumber(e.target.value)}
            className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los números de parte</option>
            {partNumbers.map(pn => (
              <option key={pn} value={pn}>{pn}</option>
            ))}
          </select>

          {/* SMT Location Filter */}
          <select
            value={filterSmtLocation}
            onChange={(e) => setFilterSmtLocation(e.target.value)}
            className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las líneas SMT</option>
            {smtLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-300 bg-neutral-700 rounded-lg hover:bg-neutral-600 transition-colors"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Limpiar
            </button>
          )}

          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Exportar Excel
          </button>
        </div>

        {/* Results count */}
        {hasActiveFilters && (
          <div className="text-sm text-neutral-400">
            Mostrando {filteredPastes.length} de {pastes.length} registros
          </div>
        )}
      </div>
      
      {filteredPastes.length === 0 ? (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-neutral-500" />
          <h3 className="mt-2 text-sm font-medium text-white">Sin resultados</h3>
          <p className="mt-1 text-sm text-neutral-400">
            No se encontraron pastas con los filtros aplicados.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 inline-flex items-center px-3 py-2 text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-700">
          <thead className="bg-neutral-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">DID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Lote / Serial</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Número de Parte</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Vencimiento</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Línea SMT</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Vida Útil</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Entrada Fridge</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Viscosidad</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-neutral-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-neutral-800 divide-y divide-neutral-700">
            {filteredPastes.map((paste) => (
              <tr key={paste.id} className="hover:bg-neutral-700">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-blue-400">{paste.did}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-white">{paste.lot_number}</div>
                    <div className="text-sm text-neutral-400">Serial: {paste.lot_serial}</div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-200">{paste.part_number}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{formatDate(paste.expiration_date)}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {paste.smt_location ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300">
                      {paste.smt_location}
                    </span>
                  ) : (
                    <span className="text-sm text-neutral-500">-</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <StatusBadge status={paste.status} size="sm" />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <ShelfLifeIndicator expirationDate={paste.expiration_date} compact />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-400">
                    {formatDateTime(paste.fridge_in_datetime)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {paste.viscosity_value ? (
                    <span className={`text-sm font-medium ${
                      paste.status === 'rejected' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {paste.viscosity_value}
                    </span>
                  ) : (
                    <span className="text-sm text-neutral-500">-</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => onAction(paste, 'view')}
                      className="p-1 text-neutral-400 hover:text-blue-400 transition-colors"
                      title="Ver detalles"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    {onAction && paste.status !== 'removed' && (
                      <button
                        onClick={() => onAction(paste, 'scan')}
                        className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                        title="Procesar"
                      >
                        Procesar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
