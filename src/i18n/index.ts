/* eslint-disable import/no-named-as-default-member */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import az from './locales/az.json';
import tr from './locales/tr.json';

export const LANGUAGE_STORAGE_KEY = 'orbit_user_language_preference';
export type AppLanguage = 'en' | 'az' | 'tr';

export const resources = {
  en: { translation: en },
  az: { translation: az },
  tr: { translation: tr },
};

// Initialize i18next instance
i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false,
  },
});

/**
 * Initializes the language preference from local AsyncStorage.
 */
export async function initializeLanguage(): Promise<AppLanguage> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'az' || saved === 'tr' || saved === 'en') {
      await i18n.changeLanguage(saved);
      return saved;
    }
  } catch (err) {
    console.warn('Failed to load saved language preference:', err);
  }
  return 'en';
}

/**
 * Changes language instantly across the application and persists to AsyncStorage.
 */
export async function changeAppLanguage(lang: AppLanguage): Promise<void> {
  try {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (err) {
    console.warn('Failed to persist language change:', err);
  }
}

/**
 * Returns current active language code.
 */
export function getCurrentLanguage(): AppLanguage {
  const current = i18n.language;
  if (current.startsWith('az')) return 'az';
  if (current.startsWith('tr')) return 'tr';
  return 'en';
}

export default i18n;
