/** Supported UI languages. */
export type AppLanguage = 'en' | 'ar';

export interface LanguageOption {
  code: AppLanguage;
  /** Display name in the language itself */
  nativeLabel: string;
  /** Translation key for localized label */
  labelKey: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGE_STORAGE_KEY = 'procurement_locale';

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', nativeLabel: 'English', labelKey: 'LANGUAGE.ENGLISH', dir: 'ltr' },
  { code: 'ar', nativeLabel: 'العربية', labelKey: 'LANGUAGE.ARABIC', dir: 'rtl' },
] as const;

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === 'en' || value === 'ar';
}

export function languageDir(lang: AppLanguage): 'ltr' | 'rtl' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}
