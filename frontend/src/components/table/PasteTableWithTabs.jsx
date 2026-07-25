/**
 * =====================================================
 * Paste Table With Tabs Component
 * Per-tab lazy fetch with in-memory cache for speed
 * =====================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../i18n';
import PasteTable from './PasteTable';

function useTabs() {
  const { t } = useLanguage();
  return [
    {
      id: 'all',
      label: t('tabs.all'),
      // Fetch all non-removed active pastes + removed — sorted newest first
      apiParams: '?sort=newest',
      sortPreserved: true, // don't re-sort in PasteTable
      color: 'blue',
    },
    {
      id: 'in_fridge',
      label: t('tabs.inFridge'),
      apiParams: '?status=in_fridge&sort=fefo',
      sortPreserved: false,
      color: 'cyan',
    },
    {
      id: 'out_fridge',
      label: t('tabs.ambientacion'),
      apiParams: '?status=out_fridge&sort=fefo',
      sortPreserved: false,
      color: 'yellow',
    },
    {
      id: 'mixing',
      label: t('tabs.mix'),
      apiParams: '?status_in=mixing,rejected&sort=fefo',
      sortPreserved: false,
      color: 'orange',
    },
    {
      id: 'viscosity_ok',
      label: t('tabs.viscosityOk'),
      apiParams: '?status=viscosity_ok&sort=fefo',
      sortPreserved: false,
      color: 'green',
    },
    {
      id: 'opened',
      label: t('tabs.opened'),
      apiParams: '?status=opened&sort=fefo',
      sortPreserved: false,
      color: 'purple',
    },
    {
      id: 'removed',
      label: t('tabs.removed'),
      // Sort by removed_datetime DESC — most recently retired first
      apiParams: '?status=removed&sort=removed_desc',
      sortPreserved: true, // don't re-sort in PasteTable
      color: 'gray',
    },
  ];
}

const TAB_COLORS = {
  blue: {
    active: 'border-blue-500 text-blue-300',
    inactive: 'border-transparent text-zinc-300 hover:text-white hover:border-zinc-500',
    badge: 'bg-blue-900/50 text-blue-200',
  },
  cyan: {
    active: 'border-cyan-500 text-cyan-300',
    inactive: 'border-transparent text-zinc-300 hover:text-white hover:border-zinc-500',
    badge: 'bg-cyan-900/50 text-cyan-200',
  },
  yellow: {
    active: 'border-yellow-500 text-yellow-300',
    inactive: 'border-transparent text-zinc-300 hover:text-white hover:border-zinc-500',
    badge: 'bg-yellow-900/50 text-yellow-200',
  },
  orange: {
    active: 'border-orange-500 text-orange-300',
    inactive: 'border-transparent text-zinc-300 hover:text-white hover:border-zinc-500',
    badge: 'bg-orange-900/50 text-orange-200',
  },
  green: {
    active: 'border-green-500 text-green-300',
    inactive: 'border-transparent text-zinc-300 hover:text-white hover:border-zinc-500',
    badge: 'bg-green-900/50 text-green-200',
  },
  purple: {
    active: 'border-purple-500 text-purple-300',
    inactive: 'border-transparent text-zinc-300 hover:text-white hover:border-zinc-500',
    badge: 'bg-purple-900/50 text-purple-200',
  },
  gray: {
    active: 'border-slate-400 text-slate-200',
    inactive: 'border-transparent text-zinc-300 hover:text-white hover:border-zinc-500',
    badge: 'bg-slate-700/50 text-slate-200',
  },
  red: {
    active: 'border-red-500 text-red-300',
    inactive: 'border-transparent text-zinc-300 hover:text-white hover:border-zinc-500',
    badge: 'bg-red-900/50 text-red-200',
  },
};

/**
 * PasteTableWithTabs
 * Props:
 *   onAction   - callback(paste, action) from parent
 *   refreshKey - increment this to force all tabs to re-fetch (e.g. after a scan)
 */
export default function PasteTableWithTabs({ onAction, refreshKey = 0 }) {
  const [activeTab, setActiveTab] = useState('all');
  const [tabData, setTabData] = useState({});      // { tabId: pastesArray }
  const [tabLoading, setTabLoading] = useState({}); // { tabId: bool }
  const [counts, setCounts] = useState({});         // { tabId: number }
  const cacheRef = useRef({});   // same shape as tabData but persists across renders
  const refreshRef = useRef(refreshKey);

  const TABS = useTabs();

  // Fetch data for a single tab
  const fetchTab = useCallback(async (tab, force = false) => {
    const cacheKey = tab.id;

    // Use cache unless forced
    if (!force && cacheRef.current[cacheKey]) {
      setTabData(prev => ({ ...prev, [cacheKey]: cacheRef.current[cacheKey] }));
      return;
    }

    setTabLoading(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const res = await fetch(`/api/pastes${tab.apiParams}`);
      if (!res.ok) throw new Error('Error al cargar tab');
      const result = await res.json();
      const data = result.data || result;
      cacheRef.current[cacheKey] = data;
      setTabData(prev => ({ ...prev, [cacheKey]: data }));
      setCounts(prev => ({ ...prev, [cacheKey]: data.length }));
    } catch (err) {
      console.error(`Error fetching tab ${tab.id}:`, err);
      cacheRef.current[cacheKey] = [];
      setTabData(prev => ({ ...prev, [cacheKey]: [] }));
    } finally {
      setTabLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, []);

  // On mount: fetch "all" tab immediately, then pre-fetch others in the background
  useEffect(() => {
    const activeTabObj = TABS.find(t => t.id === activeTab) || TABS[0];
    fetchTab(activeTabObj, true);

    // Stagger background pre-fetches so they don't all hit the DB at once
    TABS.forEach((tab, i) => {
      if (tab.id !== activeTab) {
        setTimeout(() => fetchTab(tab, true), (i + 1) * 200);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When refreshKey changes (parent signals a data change), invalidate cache and re-fetch all
  useEffect(() => {
    if (refreshKey === refreshRef.current) return;
    refreshRef.current = refreshKey;
    cacheRef.current = {};
    TABS.forEach(tab => fetchTab(tab, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // When switching tabs, fetch if not cached
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab.id);
    fetchTab(tab, false);
  }, [fetchTab]);

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];
  const currentPastes = tabData[activeTab] || [];
  const isLoading = !!tabLoading[activeTab];

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b border-deadtimes-border">
        <nav className="flex overflow-x-auto px-4" aria-label="Tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const colors = TAB_COLORS[tab.color];
            const count = counts[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab)}
                className={`
                  flex items-center whitespace-nowrap py-3 px-4 border-b-2 text-sm font-medium transition-colors
                  ${isActive ? colors.active : colors.inactive}
                `}
              >
                {tab.label}
                {count != null && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${isActive ? colors.badge : 'bg-[#202026] text-zinc-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <PasteTable
        pastes={currentPastes}
        onAction={onAction}
        isLoading={isLoading}
        preserveSort={currentTab.sortPreserved}
      />
    </div>
  );
}
