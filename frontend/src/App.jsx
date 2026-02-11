/**
 * =====================================================
 * Main App Component - SMT Paste Tracker
 * =====================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Tabs from './components/ui/Tabs';
import FridgeInTab from './components/tabs/FridgeInTab';
import ReportsTab from './components/tabs/ReportsTab';
import PartNumbersConfig from './components/tabs/PartNumbersConfig';
import LoginModal from './components/modals/LoginModal';
import { login } from './api';
import {
  HomeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

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
    locked: true,
  },
];

// Allowed roles for configuration access
const ALLOWED_CONFIG_ROLES = ['Ingeniero', 'Administrador'];

// Inactivity timeout in milliseconds (2 minutes)
const INACTIVITY_TIMEOUT = 2 * 60 * 1000;

export default function App() {
  const [activeTab, setActiveTab] = useState('fridge-in');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState(null);
  
  // Inactivity timer ref
  const inactivityTimerRef = useRef(null);

  // Check if user has access to settings tab
  const hasSettingsAccess = authenticatedUser && ALLOWED_CONFIG_ROLES.includes(authenticatedUser.rol);

  // Logout function
  const handleLogout = useCallback(() => {
    setAuthenticatedUser(null);
    setActiveTab('fridge-in');
    // Clear any existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (authenticatedUser) {
      inactivityTimerRef.current = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [authenticatedUser, handleLogout]);

  // Set up activity listeners for inactivity timeout
  useEffect(() => {
    if (!authenticatedUser) {
      // Clear timer when not authenticated
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    // Start the inactivity timer
    resetInactivityTimer();

    // Activity events to track
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Reset timer on any activity
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [authenticatedUser, resetInactivityTimer]);

  const handleTabChange = (tabId) => {
    if (tabId === 'settings') {
      if (hasSettingsAccess) {
        setActiveTab(tabId);
        resetInactivityTimer(); // Reset timer on tab change
      } else {
        // Need to login
        setAccessDeniedMessage(null);
        setShowLoginModal(true);
      }
    } else {
      // If leaving settings tab and authenticated, log out
      if (activeTab === 'settings' && authenticatedUser) {
        handleLogout();
      }
      setActiveTab(tabId);
    }
  };

  const handleLogin = async (credentials) => {
    setLoginBusy(true);
    setAccessDeniedMessage(null);
    try {
      const result = await login(credentials);
      if (result.success && result.user) {
        if (ALLOWED_CONFIG_ROLES.includes(result.user.rol)) {
          setAuthenticatedUser(result.user);
          setShowLoginModal(false);
          setActiveTab('settings');
        } else {
          setAccessDeniedMessage(`Acceso denegado. Solo usuarios con rol Ingeniero o Administrador pueden acceder a la configuración. Tu rol actual: ${result.user.rol}`);
        }
      }
    } catch (err) {
      throw err;
    } finally {
      setLoginBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="bg-neutral-800 shadow-sm border-b border-neutral-700">
        <div className="px-4 sm:px-6 lg:px-8">
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
                <h1 className="text-xl font-bold text-white">
                  HKL Solder Paste Management System
                </h1>
                <p className="text-xs text-neutral-400">
                  Sistema de Trazabilidad de Pastas de Soldadura
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {authenticatedUser && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-green-400">
                    {authenticatedUser.nombre} ({authenticatedUser.rol})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
              <span className="text-sm text-neutral-400">
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
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="bg-neutral-800 rounded-lg shadow-sm mb-6 border border-neutral-700">
          <div className="px-6">
            <Tabs 
              tabs={tabs.map(tab => ({
                ...tab,
                icon: tab.id === 'settings' && !hasSettingsAccess ? (
                  <LockClosedIcon className="h-5 w-5" />
                ) : tab.icon
              }))} 
              activeTab={activeTab} 
              onChange={handleTabChange} 
            />
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'fridge-in' && <FridgeInTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'settings' && hasSettingsAccess && (
            <div className="space-y-6">
              <div className="bg-neutral-800 rounded-lg shadow-sm border border-neutral-700 p-6">
                <PartNumbersConfig />
              </div>

              <div className="bg-neutral-800 rounded-lg shadow-sm border border-neutral-700 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Configuración General
                </h2>
                <div className="space-y-6">
                  <div className="border-b border-neutral-700 pb-6">
                    <h3 className="text-sm font-medium text-white mb-2">
                      Rango de Viscosidad Válido
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-xs text-neutral-400">Mínimo</label>
                        <input
                          type="number"
                          defaultValue={150}
                          className="mt-1 block w-24 rounded-md border-neutral-600 bg-neutral-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400">Máximo</label>
                        <input
                          type="number"
                          defaultValue={180}
                          className="mt-1 block w-24 rounded-md border-neutral-600 bg-neutral-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          disabled
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-neutral-400">
                      El rango de viscosidad está configurado en el código.
                    </p>
                  </div>

                  <div className="border-b border-neutral-700 pb-6">
                    <h3 className="text-sm font-medium text-white mb-2">
                      Base de Datos
                    </h3>
                    <p className="text-sm text-neutral-300">
                      Conexión a MySQL configurada en variables de entorno del backend.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-white mb-2">
                      Formato de Código QR
                    </h3>
                    <div className="bg-neutral-700 rounded-lg p-4 text-sm font-mono text-neutral-200">
                      <p className="mb-2">Formato esperado (5 campos separados por comas):</p>
                      <p className="text-blue-400">lote,parte,expiración,fabricación,serial</p>
                      <p className="mt-2 text-neutral-400">Ejemplo:</p>
                      <p className="text-green-400">50822985,k01.005-00m-2,260218,250909,017</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-800 border-t border-neutral-700 mt-8">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-neutral-400">
            SMT Paste Tracker - Sistema de Trazabilidad v1.0
          </p>
        </div>
      </footer>

      {/* Login Modal for Settings Access */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setAccessDeniedMessage(null);
        }}
        onConfirm={handleLogin}
        busy={loginBusy}
      />

      {/* Access Denied Message */}
      {accessDeniedMessage && showLoginModal && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-[60]">
          <div className="bg-red-900/90 border border-red-700 rounded-lg p-4 shadow-lg">
            <p className="text-sm text-red-200">{accessDeniedMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
