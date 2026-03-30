// i18n Hook for PixelSlicer
import { useState, useCallback, useEffect } from 'react';
import { translations, type Language } from './translations';

const getInitialLanguage = (): Language => {
  // Check local storage first
  const savedLang = localStorage.getItem('pixelslicer_lang');
  if (savedLang === 'tr' || savedLang === 'en') {
    return savedLang;
  }
  
  // Detect browser language
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (browserLang && browserLang.toLowerCase().startsWith('tr')) {
      return 'tr';
    }
  }
  
  // Default to English
  return 'en';
};

export function useI18n() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem('pixelslicer_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: keyof typeof translations.en) => {
      // Fallback to English if translation is missing in the current language
      return translations[language][key as keyof typeof translations.tr] || translations['en'][key] || key;
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
