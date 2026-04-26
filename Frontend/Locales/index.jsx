/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from 'react';
import ru from './ru';
import en from './en';

const LOCALES = { ru, en };

const LocaleContext = createContext(ru);

/**
 * Оберни корневой компонент этим провайдером.
 * lang — значение из настроек (general.appLanguage): 'ru' | 'en'
 */
export function LocaleProvider({ lang, children }) {
  const strings = LOCALES[lang] ?? ru;
  return <LocaleContext.Provider value={strings}>{children}</LocaleContext.Provider>;
}

/**
 * Хук для получения словаря текущей локали.
 * Используй внутри любого компонента:
 *   const t = useLocale();
 *   <p>{t.common.save}</p>
 */
export function useLocale() {
  return useContext(LocaleContext);
}
