/**
 * =====================================================
 * Main App Component - SMT Paste Tracker
 * Sidebar layout matching Herramental style
 * =====================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import FridgeInTab from './components/tabs/FridgeInTab';
import ReportsTab from './components/tabs/ReportsTab';
import PartNumbersConfig from './components/tabs/PartNumbersConfig';
import LoginModal from './components/modals/LoginModal';
import { login } from './api';

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
  const [configOpen, setConfigOpen] = useState(false);
  
  // Inactivity timer ref
  const inactivityTimerRef = useRef(null);

  // Check if user has access to settings tab
  const hasSettingsAccess = authenticatedUser && ALLOWED_CONFIG_ROLES.includes(authenticatedUser.rol);

  // Logout function
  const handleLogout = useCallback(() => {
    setAuthenticatedUser(null);
    setActiveTab('fridge-in');
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
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    resetInactivityTimer();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => resetInactivityTimer();

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

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
        resetInactivityTimer();
      } else {
        setAccessDeniedMessage(null);
        setShowLoginModal(true);
      }
    } else {
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

  // Main navigation links
  const mainLinks = [
    { id: 'fridge-in', label: 'Dashboard', icon: '📋' },
    { id: 'reports', label: 'Reportes', icon: '📊' },
  ];

  // Config sub-links
  const configLinks = [
    { id: 'settings', label: 'Part Numbers', icon: '⚙️', locked: true },
  ];

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <svg className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          Solder Paste
        </div>
        <nav className="sidebar-nav">
          {mainLinks.map((link) => (
            <button
              key={link.id}
              className={`nav-link ${activeTab === link.id ? 'active' : ''}`}
              onClick={() => handleTabChange(link.id)}
            >
              <span>{link.icon}</span>
              {link.label}
            </button>
          ))}

          {/* Collapsible config section */}
          <div className="sidebar-section">
            <button
              className="sidebar-section-toggle"
              onClick={() => setConfigOpen((prev) => !prev)}
            >
              <span>Configuración</span>
              <span className={`toggle-arrow ${configOpen ? 'open' : ''}`}>▸</span>
            </button>
            {configOpen && (
              <div className="sidebar-section-links">
                {configLinks.map((link) => (
                  <button
                    key={link.id}
                    className={`nav-link ${activeTab === link.id ? 'active' : ''}`}
                    onClick={() => handleTabChange(link.id)}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            {authenticatedUser && (
              <>
                <span className="user-chip">
                  {authenticatedUser.nombre} ({authenticatedUser.rol})
                </span>
                <button onClick={handleLogout} className="btn btn-danger btn-sm">
                  Cerrar sesión
                </button>
              </>
            )}
            <span className="user-chip" style={{ fontSize: '.7rem', opacity: 0.6 }}>
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'fridge-in' && <FridgeInTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'settings' && hasSettingsAccess && (
          <div className="space-y-6">
            <div className="card">
              <PartNumbersConfig />
            </div>

            <div className="card">
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
      </main>

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
