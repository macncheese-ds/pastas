/**
 * =====================================================
 * Página Principal - Sistema de Trazabilidad SMT
 * =====================================================
 * Aplicación para control y trazabilidad de pastas de soldadura
 */

'use client';

import { useState } from 'react';
import Tabs from '@/components/ui/Tabs';
import FridgeInTab from '@/components/tabs/FridgeInTab';
import ReportsTab from '@/components/tabs/ReportsTab';
import {
  HomeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

// Definición de pestañas
const tabs = [
  {
    id: 'fridge-in',
    label: 'Fridge In',
    icon: <HomeIcon className="h-5 w-5" />,
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: <ChartBarIcon className="h-5 w-5" />,
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: <Cog6ToothIcon className="h-5 w-5" />,
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('fridge-in');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">
                  SMT Paste Tracker
                </h1>
                <p className="text-xs text-gray-500">
                  Sistema de Trazabilidad de Pastas de Soldadura
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'fridge-in' && <FridgeInTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Configuración
              </h2>
              <div className="space-y-6">
                {/* Configuración de viscosidad */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Rango de Viscosidad Válido
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-xs text-gray-500">Mínimo</label>
                      <input
                        type="number"
                        defaultValue={150}
                        className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Máximo</label>
                      <input
                        type="number"
                        defaultValue={180}
                        className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        disabled
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    El rango de viscosidad está configurado en el código. Contacte al administrador para modificarlo.
                  </p>
                </div>

                {/* Información de conexión */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Base de Datos
                  </h3>
                  <p className="text-sm text-gray-600">
                    Conexión a MySQL configurada en variables de entorno.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Ver archivo .env.local para configuración.
                  </p>
                </div>

                {/* Formato QR */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Formato de Código QR
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-700">
                    <p className="mb-2">Formato esperado (5 campos separados por comas):</p>
                    <p className="text-blue-600">lote,parte,expiración,fabricación,serial</p>
                    <p className="mt-2 text-gray-500">Ejemplo:</p>
                    <p className="text-green-600">50822985,k01.005-00m-2,260218,250909,017</p>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    <p><strong>Posición 1:</strong> Número de lote</p>
                    <p><strong>Posición 2:</strong> Número de parte</p>
                    <p><strong>Posición 3:</strong> Fecha expiración (YYMMDD)</p>
                    <p><strong>Posición 4:</strong> Fecha fabricación (YYMMDD)</p>
                    <p><strong>Posición 5:</strong> Serial del lote</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            SMT Paste Tracker - Sistema de Trazabilidad v1.0
          </p>
        </div>
      </footer>
    </div>
  );
}
