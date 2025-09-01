'use client';

import React, { createContext, useContext, ReactNode } from 'react';

type Translations = {
  [key: string]: any;
};

type TranslationContextType = {
  t: (key: string) => string;
  locale: string;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ 
  children, 
  translations, 
  locale 
}: { 
  children: ReactNode; 
  translations: Translations; 
  locale: string; 
}) {
  const t = (key: string): string => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <TranslationContext.Provider value={{ t, locale }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslations(namespace?: string) {
  const context = useContext(TranslationContext);
  
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationProvider');
  }
  
  const { t, locale } = context;
  
  return {
    t: (key: string) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return t(fullKey);
    },
    locale
  };
}

export function useLocale() {
  const context = useContext(TranslationContext);
  
  if (!context) {
    throw new Error('useLocale must be used within a TranslationProvider');
  }
  
  return context.locale;
}