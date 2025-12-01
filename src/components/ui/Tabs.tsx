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
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium
              ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }
            `}
          >
            {tab.icon && (
              <span
                className={`mr-2 ${
                  activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
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
