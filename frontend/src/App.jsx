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
import LanguageSwitcher from './components/ui/LanguageSwitcher';
import { useLanguage } from './i18n';
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
  const { t } = useLanguage();
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
            `${t('access.denied')} ${result.user.rol}`
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
    { id: 'fridge-in', label: t('sidebar.dashboard'), Icon: ClipboardDocumentListIcon },
    { id: 'reports', label: t('sidebar.reports'), Icon: ChartBarIcon },
  ];

  const configLinks = [
    { id: 'settings', label: t('sidebar.partNumbers'), Icon: CogIcon },
  ];

  return (
    <div className="layout">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <CpuChipIcon className="brand-icon text-deadtimes-accent" />
          <span className="brand-text">
            <span className="brand-title">{t('app.brandTitle')}</span>
            <span className="brand-subtitle">{t('app.brandSubtitle')}</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {/* Toggle button - at top of nav */}
          <button
            className="nav-link sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(prev => !prev)}
            title={sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          >
            <span className="nav-icon">
              {sidebarCollapsed
                ? <Bars3Icon className="h-5 w-5" />
                : <ChevronLeftIcon className="h-5 w-5" />
              }
            </span>
            <span className="nav-label">{t('sidebar.collapse')}</span>
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
              title={sidebarCollapsed ? t('sidebar.config') : undefined}
            >
              <span className="section-label">{t('sidebar.config')}</span>
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
            <LanguageSwitcher collapsed={sidebarCollapsed} />
            {authenticatedUser && (
              <>
                <span className="user-chip">
                  {sidebarCollapsed
                    ? authenticatedUser.nombre?.charAt(0)
                      : `${authenticatedUser.num_empleado} - ${authenticatedUser.nombre} (${authenticatedUser.rol})`}
                </span>
                <button onClick={handleLogout} className="nav-link sidebar-logout-btn">
                  <span className="nav-icon">
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </span>
                  <span className="nav-label">{t('sidebar.logout')}</span>
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
              <h2 className="text-lg font-semibold text-white mb-4">{t('settings.title')}</h2>
              <div className="space-y-6">
                <div className="border-b border-deadtimes-border pb-6">
                  <h3 className="text-sm font-medium text-white mb-2">{t('settings.viscosityRange')}</h3>
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-xs text-zinc-400">{t('settings.minimum')}</label>
                      <input type="number" defaultValue={150} disabled
                        className="mt-1 block w-24 rounded-md border-deadtimes-border bg-deadtimes-card text-white shadow-sm text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400">{t('settings.maximum')}</label>
                      <input type="number" defaultValue={180} disabled
                        className="mt-1 block w-24 rounded-md border-deadtimes-border bg-deadtimes-card text-white shadow-sm text-sm" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">{t('settings.viscosityNote')}</p>
                </div>
                <div className="border-b border-deadtimes-border pb-6">
                  <h3 className="text-sm font-medium text-white mb-2">{t('settings.database')}</h3>
                  <p className="text-sm text-zinc-400">{t('settings.databaseNote')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">{t('settings.qrFormat')}</h3>
                  <div className="bg-deadtimes-card border border-deadtimes-border rounded-lg p-4 text-sm font-mono text-zinc-300">
                    <p className="mb-2">{t('settings.expectedFormat')}</p>
                    <p className="text-zinc-500">lote,parte,expiración,fabricación,serial</p>
                    <p className="mt-2 text-zinc-500/70">{t('settings.example')}</p>
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
