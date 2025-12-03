/**
 * =====================================================
 * Componente: Reports Tab
 * =====================================================
 * Pestaña de reportes y estadísticas
 */

'use client';

import { useState, useEffect } from 'react';
import { SolderPaste, SolderPasteStatus, STATUS_LABELS, STATUS_COLORS, SMTLocation } from '@/types';
import { calculateDaysRemaining } from '@/lib/qrParser';
import { getAllSMTLocations } from '@/config/smtMapping';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface Stats {
  total: number;
  byStatus: Record<SolderPasteStatus, number>;
  bySMTLocation: Record<SMTLocation, number>;
  expiringSoon: number;
  expired: number;
}

export default function ReportsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/pastes');
        const data = await response.json();

        if (data.success && data.data) {
          const pastes: SolderPaste[] = data.data;

          // Calcular estadísticas
          const byStatus: Record<SolderPasteStatus, number> = {
            in_fridge: 0,
            out_fridge: 0,
            mixing: 0,
            viscosity_ok: 0,
            opened: 0,
            removed: 0,
            rejected: 0,
          };

          const bySMTLocation: Record<SMTLocation, number> = {
            SMT: 0,
            SMT2: 0,
            SMT3: 0,
            SMT4: 0,
          };

          let expiringSoon = 0;
          let expired = 0;

          pastes.forEach((paste) => {
            byStatus[paste.status]++;

            if (paste.smt_location) {
              bySMTLocation[paste.smt_location]++;
            }

            const daysRemaining = calculateDaysRemaining(paste.expiration_date);
            if (daysRemaining < 0) {
              expired++;
            } else if (daysRemaining <= 7) {
              expiringSoon++;
            }
          });

          setStats({
            total: pastes.length,
            byStatus,
            bySMTLocation,
            expiringSoon,
            expired,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="ml-3 text-neutral-400">Cargando estadísticas...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-neutral-400">
        Error al cargar las estadísticas
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800 rounded-lg shadow-sm border border-neutral-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-900/50 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Total Registros</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg shadow-sm border border-neutral-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-900/50 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Completados</p>
              <p className="text-2xl font-bold text-white">{stats.byStatus.removed}</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg shadow-sm border border-neutral-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-900/50 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Por Expirar (7d)</p>
              <p className="text-2xl font-bold text-white">{stats.expiringSoon}</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg shadow-sm border border-neutral-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-900/50 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Expirados</p>
              <p className="text-2xl font-bold text-white">{stats.expired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución por estado */}
      <div className="bg-neutral-800 rounded-lg shadow-sm border border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Distribución por Estado
        </h3>
        <div className="space-y-4">
          {(Object.keys(stats.byStatus) as SolderPasteStatus[]).map((status) => {
            const count = stats.byStatus[status];
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

            return (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="text-neutral-400">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-neutral-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      status === 'removed' ? 'bg-gray-500' :
                      status === 'rejected' ? 'bg-red-500' :
                      status === 'in_fridge' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribución por Línea SMT */}
      <div className="bg-neutral-800 rounded-lg shadow-sm border border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <MapPinIcon className="h-5 w-5 mr-2 text-purple-400" />
          Distribución por Línea SMT
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getAllSMTLocations().map((location) => {
            const count = stats.bySMTLocation[location] || 0;
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
            
            return (
              <div key={location} className="p-4 bg-purple-900/30 rounded-lg text-center border border-purple-800">
                <p className="text-purple-300 font-medium text-sm">{location}</p>
                <p className="text-2xl font-bold text-purple-200">{count}</p>
                <p className="text-xs text-purple-400">{percentage.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-neutral-800 rounded-lg shadow-sm border border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Resumen del Sistema
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-800">
            <p className="text-blue-300 font-medium">En Refrigerador</p>
            <p className="text-2xl font-bold text-blue-200">{stats.byStatus.in_fridge}</p>
          </div>
          <div className="p-4 bg-orange-900/30 rounded-lg border border-orange-800">
            <p className="text-orange-300 font-medium">En Proceso</p>
            <p className="text-2xl font-bold text-orange-200">
              {stats.byStatus.out_fridge + stats.byStatus.mixing + stats.byStatus.viscosity_ok + stats.byStatus.opened}
            </p>
          </div>
          <div className="p-4 bg-red-900/30 rounded-lg border border-red-800">
            <p className="text-red-300 font-medium">Rechazados</p>
            <p className="text-2xl font-bold text-red-200">{stats.byStatus.rejected}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
