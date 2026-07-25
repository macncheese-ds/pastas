/**
 * =====================================================
 * Paste Table Component
 * =====================================================
 */

import { useState, useMemo } from 'react';
import StatusBadge from '../ui/StatusBadge';
import ShelfLifeIndicator from '../ui/ShelfLifeIndicator';
import WaitTimeCounter from '../ui/WaitTimeCounter';
import { formatDateTime, formatDate, calculateDaysRemaining } from '../../lib/qrParser';
import { useLanguage } from '../../i18n';
import { EyeIcon, ArrowDownTrayIcon, MagnifyingGlassIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function PasteTable({
  pastes,
  onAction,
  isLoading = false,
  preserveSort = false,  // when true, skip internal FEFO sort (API already sorted)
}) {
  const { t } = useLanguage();
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

  // Filter pastes — sort only when NOT preserving API order
  const filteredPastes = useMemo(() => {
    const filtered = pastes.filter(paste => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          paste.did?.toLowerCase().includes(search) ||
          paste.lot_number?.toLowerCase().includes(search) ||
          paste.lot_serial?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      if (filterPartNumber && paste.part_number !== filterPartNumber) return false;
      if (filterSmtLocation && paste.smt_location !== filterSmtLocation) return false;
      return true;
    });

    if (preserveSort) {
      // API already sorted — don't disturb the order
      return filtered;
    }

    // FEFO/FIFO for active-status tabs
    return filtered.sort((a, b) => {
      const expA = new Date(a.expiration_date).getTime();
      const expB = new Date(b.expiration_date).getTime();
      if (expA !== expB) return expA - expB;
      const createdA = new Date(a.fridge_in_datetime || a.created_at).getTime();
      const createdB = new Date(b.fridge_in_datetime || b.created_at).getTime();
      return createdA - createdB;
    });
  }, [pastes, searchTerm, filterPartNumber, filterSmtLocation, preserveSort]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPartNumber('');
    setFilterSmtLocation('');
  };

  const hasActiveFilters = searchTerm || filterPartNumber || filterSmtLocation;

  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/pastes/export/excel');
      if (!response.ok) throw new Error(t('errors.exportError'));
      
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
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="ml-3 text-zinc-400">{t('table.loading')}</span>
      </div>
    );
  }

  if (pastes.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-zinc-400"
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
          <h3 className="mt-2 text-sm font-medium text-white">{t('table.noRecords')}</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {t('table.noRecordsHint')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Export */}
      <div className="p-4 bg-[#202026] rounded-lg space-y-3 border border-[#2D2D33]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder={t('table.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-deadtimes-card border border-deadtimes-border rounded-lg text-sm text-white placeholder-gray-400/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Part Number Filter */}
          <select
            value={filterPartNumber}
            onChange={(e) => setFilterPartNumber(e.target.value)}
            className="px-3 py-2 bg-deadtimes-card border border-deadtimes-border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('table.allPartNumbers')}</option>
            {partNumbers.map(pn => (
              <option key={pn} value={pn}>{pn}</option>
            ))}
          </select>

          {/* SMT Location Filter */}
          <select
            value={filterSmtLocation}
            onChange={(e) => setFilterSmtLocation(e.target.value)}
            className="px-3 py-2 bg-deadtimes-card border border-deadtimes-border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('table.allSmtLines')}</option>
            {smtLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-deadtimes-card rounded-lg hover:bg-deadtimes-card transition-colors"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              {t('table.clear')}
            </button>
          )}

          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-deadtimes-card border border-deadtimes-border rounded-lg hover:bg-deadtimes-hover transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {t('table.exportExcel')}
          </button>
        </div>

        {/* Results count */}
        {hasActiveFilters && (
          <div className="text-sm text-zinc-400">
            {t('table.showing')} {filteredPastes.length} {t('table.of')} {pastes.length} {t('table.records')}
          </div>
        )}
      </div>
      
      {filteredPastes.length === 0 ? (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-2 text-sm font-medium text-white">{t('table.noResults')}</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {t('table.noResultsHint')}
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 inline-flex items-center px-3 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-400"
          >
            {t('table.clearFilters')}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-900/40">
          <thead className="bg-[#0a1628]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.did')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.lotSerial')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.partNumber')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.expiration')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.smtLine')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.status')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.waitTime')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.shelfLife')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.fridgeEntry')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.viscosity')}</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody className="card">
            {filteredPastes.map((paste) => {
              const isExpired = calculateDaysRemaining(paste.expiration_date) < 0;
              const hasDeviation = !!paste.deviation_authorized;
              const isDiscarded = paste.status === 'discarded';
              const isFinished = paste.status === 'removed' || paste.status === 'discarded';
              
              // Check 24h ambientacion exceeded
              const isAmbientacionExceeded = paste.status === 'out_fridge' && paste.fridge_out_datetime
                && (new Date().getTime() - new Date(paste.fridge_out_datetime).getTime()) >= 24 * 60 * 60 * 1000;

              const rowBgClass = isDiscarded 
                ? 'bg-red-900/20 hover:bg-red-900/30'
                : isAmbientacionExceeded
                  ? 'bg-orange-900/20 hover:bg-orange-900/30 border-l-2 border-orange-500'
                  : isExpired && !hasDeviation && !isFinished
                    ? 'bg-red-900/10 hover:bg-red-900/20' 
                    : 'hover:bg-deadtimes-card';

              return (
              <tr key={paste.id} className={rowBgClass}>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white font-mono">{paste.did || '-'}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-white">{paste.lot_number}</div>
                    <div className="text-sm text-zinc-400">{t('table.serial')}: {paste.lot_serial}</div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{paste.part_number}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${isExpired && !isFinished ? 'text-red-400' : 'text-white'}`}>
                    {formatDate(paste.expiration_date)}
                    {isExpired && !isFinished && (
                      <span className="ml-1 text-xs text-red-500 font-bold">⚠ {t('table.expired')}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {paste.smt_location ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#202026] text-zinc-200 border border-[#2D2D33]">
                      {paste.smt_location}
                    </span>
                  ) : (
                    <span className="text-sm text-zinc-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <StatusBadge status={paste.status} size="sm" expired={!isFinished && isExpired} deviation={hasDeviation} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {paste.status === 'out_fridge' && paste.fridge_out_datetime ? (
                    <WaitTimeCounter fridgeOutDatetime={paste.fridge_out_datetime} compact />
                  ) : (
                    <span className="text-sm text-zinc-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <ShelfLifeIndicator expirationDate={paste.expiration_date} compact />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-zinc-400">
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
                    <span className="text-sm text-zinc-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => onAction(paste, 'view')}
                      className="p-1 text-zinc-400 hover:text-zinc-400 transition-colors"
                      title={t('table.viewDetails')}
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    {paste.status === 'in_fridge' && (
                      <button
                        onClick={() => onAction(paste, 'editDid')}
                        className="p-1 text-zinc-400 hover:text-yellow-400 transition-colors"
                        title={t('table.editDid')}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    )}
                    {onAction && !isFinished && (
                      <button
                        onClick={() => onAction(paste, 'scan')}
                        className={`px-3 py-1 text-xs font-medium text-white rounded transition-colors ${
                          isExpired && !hasDeviation
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-blue-600 hover:bg-deadtimes-hover'
                        }`}
                        title={isExpired && !hasDeviation ? t('table.requiresDeviation') : t('table.process')}
                      >
                        {isExpired && !hasDeviation ? `⚠ ${t('table.deviation')}` : t('table.process')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
