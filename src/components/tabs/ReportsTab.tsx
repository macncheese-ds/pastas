/**
 * =====================================================
 * Componente: Reports Tab
 * =====================================================
 * Pestaña de reportes y estadísticas
 */

'use client';

import { useState, useEffect } from 'react';
import { SolderPaste, SolderPasteStatus, STATUS_LABELS, STATUS_COLORS } from '@/types';
import { calculateDaysRemaining } from '@/lib/qrParser';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface Stats {
  total: number;
  byStatus: Record<SolderPasteStatus, number>;
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

          let expiringSoon = 0;
          let expired = 0;

          pastes.forEach((paste) => {
            byStatus[paste.status]++;

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
        <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="ml-3 text-gray-500">Cargando estadísticas...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        Error al cargar las estadísticas
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Registros</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.byStatus.removed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Por Expirar (7d)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Expirados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución por estado */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                  <span className="text-gray-500">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
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

      {/* Información adicional */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumen del Sistema
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-600 font-medium">En Refrigerador</p>
            <p className="text-2xl font-bold text-blue-800">{stats.byStatus.in_fridge}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-orange-600 font-medium">En Proceso</p>
            <p className="text-2xl font-bold text-orange-800">
              {stats.byStatus.out_fridge + stats.byStatus.mixing + stats.byStatus.viscosity_ok + stats.byStatus.opened}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-red-600 font-medium">Rechazados</p>
            <p className="text-2xl font-bold text-red-800">{stats.byStatus.rejected}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
