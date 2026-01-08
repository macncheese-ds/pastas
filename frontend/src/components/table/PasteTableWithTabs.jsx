/**
 * =====================================================
 * Paste Table With Tabs Component
 * =====================================================
 */

import { useState, useMemo } from 'react';
import { STATUS_LABELS } from '../../types';
import PasteTable from './PasteTable';

const TABS = [
  { id: 'all', label: 'Todos', statuses: null, color: 'blue' },
  { id: 'in_fridge', label: 'En Refrigerador', statuses: ['in_fridge'], color: 'cyan' },
  { id: 'out_fridge', label: 'Ambientacion', statuses: ['out_fridge'], color: 'yellow' },
  { id: 'mixing', label: 'Mix', statuses: ['mixing', 'rejected'], color: 'orange' },
  { id: 'viscosity_ok', label: 'Viscosidad OK', statuses: ['viscosity_ok'], color: 'green' },
  { id: 'opened', label: 'Abierto', statuses: ['opened'], color: 'purple' },
  { id: 'removed', label: 'Retirado', statuses: ['removed'], color: 'gray' },
];

const TAB_COLORS = {
  blue: {
    active: 'border-blue-500 text-blue-400',
    inactive: 'border-transparent text-neutral-400 hover:text-neutral-300 hover:border-neutral-600',
    badge: 'bg-blue-900/50 text-blue-300',
  },
  cyan: {
    active: 'border-cyan-500 text-cyan-400',
    inactive: 'border-transparent text-neutral-400 hover:text-neutral-300 hover:border-neutral-600',
    badge: 'bg-cyan-900/50 text-cyan-300',
  },
  yellow: {
    active: 'border-yellow-500 text-yellow-400',
    inactive: 'border-transparent text-neutral-400 hover:text-neutral-300 hover:border-neutral-600',
    badge: 'bg-yellow-900/50 text-yellow-300',
  },
  orange: {
    active: 'border-orange-500 text-orange-400',
    inactive: 'border-transparent text-neutral-400 hover:text-neutral-300 hover:border-neutral-600',
    badge: 'bg-orange-900/50 text-orange-300',
  },
  green: {
    active: 'border-green-500 text-green-400',
    inactive: 'border-transparent text-neutral-400 hover:text-neutral-300 hover:border-neutral-600',
    badge: 'bg-green-900/50 text-green-300',
  },
  purple: {
    active: 'border-purple-500 text-purple-400',
    inactive: 'border-transparent text-neutral-400 hover:text-neutral-300 hover:border-neutral-600',
    badge: 'bg-purple-900/50 text-purple-300',
  },
  gray: {
    active: 'border-gray-500 text-gray-400',
    inactive: 'border-transparent text-neutral-400 hover:text-neutral-300 hover:border-neutral-600',
    badge: 'bg-gray-900/50 text-gray-300',
  },
};

export default function PasteTableWithTabs({
  pastes,
  onAction,
  isLoading = false,
}) {
  const [activeTab, setActiveTab] = useState('all');

  const counts = useMemo(() => {
    const countMap = { all: pastes.length };
    TABS.forEach((tab) => {
      if (tab.statuses) {
        countMap[tab.id] = pastes.filter((p) => tab.statuses.includes(p.status)).length;
      }
    });
    return countMap;
  }, [pastes]);

  const filteredPastes = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTab);
    if (!tab || !tab.statuses) {
      return pastes;
    }
    return pastes.filter((p) => tab.statuses.includes(p.status));
  }, [pastes, activeTab]);

  return (
    <div>
      <div className="border-b border-neutral-700">
        <nav className="flex overflow-x-auto px-4" aria-label="Tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const colors = TAB_COLORS[tab.color];
            const count = counts[tab.id] || 0;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center whitespace-nowrap py-3 px-4 border-b-2 text-sm font-medium transition-colors
                  ${isActive ? colors.active : colors.inactive}
                `}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${isActive ? colors.badge : 'bg-neutral-700 text-neutral-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <PasteTable
        pastes={filteredPastes}
        onAction={onAction}
        isLoading={isLoading}
      />
    </div>
  );
}
