/**
 * =====================================================
 * Language Context – i18n Provider
 * =====================================================
 */

import { createContext, useContext, useState, useCallback } from 'react';
import translations from './translations';

const LanguageContext = createContext();

const STORAGE_KEY = 'solder-paste-lang';

function getInitialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && translations[stored]) return stored;
  } catch {}
  return 'en';
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
    }
  }, []);

  // Nested key lookup: t('sidebar.dashboard') -> translations[lang].sidebar.dashboard
  const t = useCallback((key, params) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      if (value == null) return key;
      value = value[k];
    }
    if (value == null) return key;
    if (typeof value === 'string' && params) {
      return value.replace(/\{(\w+)\}/g, (_, p) => params[p] ?? `{${p}}`);
    }
    return value;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
