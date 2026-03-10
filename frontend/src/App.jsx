/**
 * =====================================================
 * Main App Component – Solder Paste Tracker
 * Collapsible sidebar layout matching Herramental style
 * =====================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import FridgeInTab from './components/tabs/FridgeInTab';
import ReportsTab from './components/tabs/ReportsTab';
import PartNumbersConfig from './components/tabs/PartNumbersConfig';
import LoginModal from './components/modals/LoginModal';
import { login } from './api';
import {
  Bars3Icon,
  ChevronLeftIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  CpuChipIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const ALLOWED_CONFIG_ROLES = ['Ingeniero', 'Administrador'];
const INACTIVITY_TIMEOUT = 2 * 60 * 1000;

export default function App() {
  const [activeTab, setActiveTab] = useState('fridge-in');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const inactivityTimerRef = useRef(null);

  const hasSettingsAccess = authenticatedUser && ALLOWED_CONFIG_ROLES.includes(authenticatedUser.rol);

  const handleLogout = useCallback(() => {
    setAuthenticatedUser(null);
    setActiveTab('fridge-in');
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (authenticatedUser) {
      inactivityTimerRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    }
  }, [authenticatedUser, handleLogout]);

  useEffect(() => {
    if (!authenticatedUser) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }
    resetInactivityTimer();
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handle = () => resetInactivityTimer();
    events.forEach(e => document.addEventListener(e, handle, { passive: true }));
    return () => {
      events.forEach(e => document.removeEventListener(e, handle));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
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
      if (activeTab === 'settings' && authenticatedUser) handleLogout();
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
          setAccessDeniedMessage(
            `Acceso denegado. Solo Ingeniero o Administrador pueden acceder. Tu rol: ${result.user.rol}`
          );
        }
      }
    } catch (err) {
      throw err;
    } finally {
      setLoginBusy(false);
    }
  };

  /* ─── Sidebar items ─────────────────────────────────── */
  const mainLinks = [
    { id: 'fridge-in', label: 'Dashboard', Icon: ClipboardDocumentListIcon },
    { id: 'reports', label: 'Reportes', Icon: ChartBarIcon },
  ];

  const configLinks = [
    { id: 'settings', label: 'Part Numbers', Icon: CogIcon },
  ];

  return (
    <div className="layout">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <CpuChipIcon className="brand-icon" style={{ color: '#60a5fa' }} />
          <span className="brand-text">
            <span className="brand-title">HKL Solder Paste Management System</span>
            <span className="brand-subtitle">Sistema de Trazabilidad de Pastas de Soldadura</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {/* Toggle button - at top of nav */}
          <button
            className="nav-link sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(prev => !prev)}
            title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <span className="nav-icon">
              {sidebarCollapsed
                ? <Bars3Icon className="h-5 w-5" />
                : <ChevronLeftIcon className="h-5 w-5" />
              }
            </span>
            <span className="nav-label">Colapsar</span>
          </button>

          <div className="sidebar-divider" />

          {mainLinks.map(link => (
            <button
              key={link.id}
              className={`nav-link ${activeTab === link.id ? 'active' : ''}`}
              onClick={() => handleTabChange(link.id)}
              title={sidebarCollapsed ? link.label : undefined}
            >
              <span className="nav-icon">
                <link.Icon className="h-5 w-5" />
              </span>
              <span className="nav-label">{link.label}</span>
            </button>
          ))}

          {/* Config section */}
          <div className="sidebar-section">
            <button
              className="sidebar-section-toggle"
              onClick={() => setConfigOpen(prev => !prev)}
              title={sidebarCollapsed ? 'Configuración' : undefined}
            >
              <span className="section-label">Configuración</span>
              <span className={`toggle-arrow ${configOpen ? 'open' : ''}`}>
                <ChevronRightIcon className="h-3 w-3" />
              </span>
            </button>
            {configOpen && (
              <div className="sidebar-section-links">
                {configLinks.map(link => (
                  <button
                    key={link.id}
                    className={`nav-link ${activeTab === link.id ? 'active' : ''}`}
                    onClick={() => handleTabChange(link.id)}
                    title={sidebarCollapsed ? link.label : undefined}
                  >
                    <span className="nav-icon">
                      <link.Icon className="h-5 w-5" />
                    </span>
                    <span className="nav-label">{link.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sidebar-footer">
            {authenticatedUser && (
              <>
                <span className="user-chip">
                  {sidebarCollapsed
                    ? authenticatedUser.nombre?.charAt(0)
                    : `${authenticatedUser.nombre} (${authenticatedUser.rol})`}
                </span>
                <button onClick={handleLogout} className="nav-link sidebar-logout-btn">
                  <span className="nav-icon">
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </span>
                  <span className="nav-label">Cerrar sesión</span>
                </button>
              </>
            )}
          </div>
        </nav>
      </aside>

      {/* ── Main Content ────────────────────────────────── */}
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        {activeTab === 'fridge-in' && <FridgeInTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'settings' && hasSettingsAccess && (
          <div className="space-y-6">
            <div className="card"><PartNumbersConfig /></div>
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Configuración General</h2>
              <div className="space-y-6">
                <div className="border-b border-neutral-700 pb-6">
                  <h3 className="text-sm font-medium text-white mb-2">Rango de Viscosidad Válido</h3>
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-xs text-neutral-400">Mínimo</label>
                      <input type="number" defaultValue={150} disabled
                        className="mt-1 block w-24 rounded-md border-neutral-600 bg-neutral-700 text-white shadow-sm text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400">Máximo</label>
                      <input type="number" defaultValue={180} disabled
                        className="mt-1 block w-24 rounded-md border-neutral-600 bg-neutral-700 text-white shadow-sm text-sm" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-neutral-400">El rango de viscosidad está configurado en el código.</p>
                </div>
                <div className="border-b border-neutral-700 pb-6">
                  <h3 className="text-sm font-medium text-white mb-2">Base de Datos</h3>
                  <p className="text-sm text-neutral-300">Conexión a MySQL configurada en variables de entorno del backend.</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Formato de Código QR</h3>
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

      {/* Login Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => { setShowLoginModal(false); setAccessDeniedMessage(null); }}
        onConfirm={handleLogin}
        busy={loginBusy}
      />

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
