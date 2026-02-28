// i18n Hook for PixelSlicer
import { useState, useCallback } from 'react';
import { translations, type Language } from './translations';

export function useI18n() {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback(
    (key: keyof typeof translations.tr) => {
      return translations[language][key];
    },
    [language]
  );

  const changeLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
  }, []);

  return {
    language,
    changeLanguage,
    t,
  };
}
