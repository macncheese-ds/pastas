/**
 * =====================================================
 * Reports Tab Component
 * =====================================================
 */

import { useState, useEffect } from 'react';
import { STATUS_LABELS, STATUS_COLORS } from '../../types';
import {
  ChartBarIcon,
  ArrowPathIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export default function ReportsTab() {
  const [pastes, setPastes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    fetchPastes();
  }, []);

  const fetchPastes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pastes?include_removed=true');
      if (!response.ok) throw new Error('Error al cargar datos');
      const result = await response.json();
      // Handle both wrapped and direct array responses
      setPastes(result.data || result);
    } catch (err) {
      console.error('Error fetching pastes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter pastes by date range
  const getFilteredPastes = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return pastes.filter((paste) => {
      const pasteDate = new Date(paste.fridge_in_datetime);
      
      switch (dateRange) {
        case 'today':
          return pasteDate >= today;
        case 'week': {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return pasteDate >= weekAgo;
        }
        case 'month': {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return pasteDate >= monthAgo;
        }
        case 'all':
        default:
          return true;
      }
    });
  };

  const filteredPastes = getFilteredPastes();

  // Calculate statistics
  const stats = {
    total: filteredPastes.length,
    inFridge: filteredPastes.filter((p) => p.status === 'in_fridge').length,
    outFridge: filteredPastes.filter((p) => p.status === 'out_fridge').length,
    mixing: filteredPastes.filter((p) => p.status === 'mixing').length,
    viscosityOk: filteredPastes.filter((p) => p.status === 'viscosity_ok').length,
    opened: filteredPastes.filter((p) => p.status === 'opened').length,
    removed: filteredPastes.filter((p) => p.status === 'removed').length,
    rejected: filteredPastes.filter((p) => p.status === 'rejected').length,
  };

  // Get average time in each stage
  const calculateAverageTime = (fromField, toField) => {
    const pastesWithBothDates = filteredPastes.filter(
      (p) => p[fromField] && p[toField]
    );
    
    if (pastesWithBothDates.length === 0) return null;
    
    const totalMinutes = pastesWithBothDates.reduce((sum, p) => {
      const from = new Date(p[fromField]);
      const to = new Date(p[toField]);
      return sum + (to - from) / (1000 * 60);
    }, 0);
    
    const avgMinutes = totalMinutes / pastesWithBothDates.length;
    
    if (avgMinutes < 60) {
      return `${Math.round(avgMinutes)} min`;
    } else {
      const hours = Math.floor(avgMinutes / 60);
      const mins = Math.round(avgMinutes % 60);
      return `${hours}h ${mins}m`;
    }
  };

  const avgFridgeTime = calculateAverageTime('fridge_in_datetime', 'fridge_out_datetime');
  const avgWaitTime = calculateAverageTime('fridge_out_datetime', 'mixing_start_datetime');

  // SMT line distribution
  const smtDistribution = filteredPastes.reduce((acc, paste) => {
    const loc = paste.smt_location || 'Sin asignar';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});

  const StatCard = ({ label, value, color = 'neutral' }) => (
    <div className={`bg-${color}-900/20 border border-${color}-800 rounded-lg p-4`}>
      <p className="text-xs text-neutral-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold text-${color}-300 mt-1`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ChartBarIcon className="h-6 w-6 text-blue-400 mr-2" />
          <h2 className="text-xl font-semibold text-white">Reportes y Estadísticas</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-neutral-800 rounded-lg p-1">
            <CalendarIcon className="h-4 w-4 text-neutral-400 ml-2 mr-1" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-sm text-neutral-300 border-0 focus:ring-0 pr-8"
            >
              <option value="today">Hoy</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
              <option value="all">Todo</option>
            </select>
          </div>
          
          <button
            onClick={fetchPastes}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-300 bg-neutral-700 border border-neutral-600 rounded-md hover:bg-neutral-600 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
        <h3 className="text-lg font-medium text-white mb-4">Resumen General</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <p className="text-xs text-neutral-400 uppercase tracking-wide">Total Pastas</p>
            <p className="text-2xl font-bold text-blue-300 mt-1">{stats.total}</p>
          </div>
          <div className="bg-cyan-900/20 border border-cyan-800 rounded-lg p-4">
            <p className="text-xs text-neutral-400 uppercase tracking-wide">En Refrigerador</p>
            <p className="text-2xl font-bold text-cyan-300 mt-1">{stats.inFridge}</p>
          </div>
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <p className="text-xs text-neutral-400 uppercase tracking-wide">Completadas</p>
            <p className="text-2xl font-bold text-green-300 mt-1">{stats.removed}</p>
          </div>
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <p className="text-xs text-neutral-400 uppercase tracking-wide">Rechazadas</p>
            <p className="text-2xl font-bold text-red-300 mt-1">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
        <h3 className="text-lg font-medium text-white mb-4">Distribución por Estado</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <div
              key={status}
              className="bg-neutral-700 rounded-lg p-3 text-center"
            >
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
                {label}
              </span>
              <p className="text-xl font-bold text-white mt-2">
                {stats[status === 'in_fridge' ? 'inFridge' : 
                  status === 'out_fridge' ? 'outFridge' :
                  status === 'viscosity_ok' ? 'viscosityOk' :
                  status] || 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Time Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
          <h3 className="text-lg font-medium text-white mb-4">Tiempos Promedio</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-sm text-neutral-300">Tiempo en refrigerador</span>
              <span className="text-lg font-semibold text-blue-300">
                {avgFridgeTime || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-sm text-neutral-300">Tiempo de espera (4h)</span>
              <span className="text-lg font-semibold text-amber-300">
                {avgWaitTime || '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
          <h3 className="text-lg font-medium text-white mb-4">Distribución por Línea SMT</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(smtDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([smt, count]) => (
                <div
                  key={smt}
                  className="flex items-center justify-between p-2 bg-neutral-700 rounded"
                >
                  <span className="text-sm text-neutral-300">{smt}</span>
                  <div className="flex items-center">
                    <div
                      className="h-2 bg-purple-500 rounded mr-2"
                      style={{ width: `${(count / stats.total) * 100}px` }}
                    />
                    <span className="text-sm font-medium text-purple-300">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Viscosity Stats */}
      <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
        <h3 className="text-lg font-medium text-white mb-4">Estadísticas de Viscosidad</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            const viscosityValues = filteredPastes
              .filter((p) => p.viscosity_value)
              .map((p) => p.viscosity_value);
            
            if (viscosityValues.length === 0) {
              return (
                <p className="col-span-3 text-center text-neutral-400 py-4">
                  No hay datos de viscosidad disponibles
                </p>
              );
            }
            
            const avgViscosity = viscosityValues.reduce((a, b) => a + b, 0) / viscosityValues.length;
            const minViscosity = Math.min(...viscosityValues);
            const maxViscosity = Math.max(...viscosityValues);
            
            return (
              <>
                <div className="bg-neutral-700 rounded-lg p-4 text-center">
                  <p className="text-xs text-neutral-400 uppercase tracking-wide">Promedio</p>
                  <p className="text-2xl font-bold text-white mt-1">{avgViscosity.toFixed(1)}</p>
                </div>
                <div className="bg-neutral-700 rounded-lg p-4 text-center">
                  <p className="text-xs text-neutral-400 uppercase tracking-wide">Mínimo</p>
                  <p className="text-2xl font-bold text-white mt-1">{minViscosity}</p>
                </div>
                <div className="bg-neutral-700 rounded-lg p-4 text-center">
                  <p className="text-xs text-neutral-400 uppercase tracking-wide">Máximo</p>
                  <p className="text-2xl font-bold text-white mt-1">{maxViscosity}</p>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
