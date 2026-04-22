'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  detectPreferredLanguage,
  getDirection,
  LANGUAGE_OPTIONS,
  STORAGE_KEY,
  TRANSLATIONS,
  type LanguageCode,
  type LanguageOption,
  type TranslationKey,
} from '@/lib/i18n';

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  languages: LanguageOption[];
  t: (key: TranslationKey) => string;
  direction: 'ltr' | 'rtl';
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage: LanguageCode;
}) {
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (saved && LANGUAGE_OPTIONS.some((item) => item.code === saved)) {
      if (saved !== language) {
        setLanguage(saved);
      }
      return;
    }

    const detected = detectPreferredLanguage(window.navigator.languages);
    if (detected !== language) {
      setLanguage(detected);
    }
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = getDirection(language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: TranslationKey) => TRANSLATIONS[language][key] ?? TRANSLATIONS.en[key];

    return {
      language,
      setLanguage,
      languages: LANGUAGE_OPTIONS,
      t,
      direction: getDirection(language),
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
}
