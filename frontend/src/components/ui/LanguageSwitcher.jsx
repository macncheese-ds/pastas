/**
 * =====================================================
 * Language Switcher Component
 * =====================================================
 */

import { useLanguage } from '../../i18n';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

const FLAGS = { en: '🇺🇸', es: '🇲🇽', ko: '🇰🇷' };

export default function LanguageSwitcher({ collapsed = false }) {
  const { language, setLanguage, t } = useLanguage();

  const langs = ['en', 'es', 'ko'];

  if (collapsed) {
    // Cycle through languages on click when sidebar is collapsed
    const nextLang = langs[(langs.indexOf(language) + 1) % langs.length];
    return (
      <button
        onClick={() => setLanguage(nextLang)}
        className="flex items-center justify-center w-full py-2 text-lg hover:bg-white/10 rounded-md transition-colors"
        title={t('language.' + nextLang)}
      >
        {FLAGS[language]}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2">
      <GlobeAltIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
      {langs.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            language === lang
              ? 'bg-white text-gray-800 font-bold'
              : 'text-gray-500/60 hover:text-gray-600 hover:bg-white/5'
          }`}
          title={t('language.' + lang)}
        >
          {FLAGS[lang]} {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
