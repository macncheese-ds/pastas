/**
 * =====================================================
 * Componente: Tabs
 * =====================================================
 * Sistema de pestañas reutilizable
 */

'use client';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-neutral-700">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium
              ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-neutral-400 hover:border-neutral-500 hover:text-neutral-300'
              }
            `}
          >
            {tab.icon && (
              <span
                className={`mr-2 ${
                  activeTab === tab.id ? 'text-blue-400' : 'text-neutral-500 group-hover:text-neutral-400'
                }`}
              >
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
