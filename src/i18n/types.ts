import type viMessages from '@/messages/vi.json';

export type Locale = 'vi' | 'en';

export type Messages = typeof viMessages;

export type TranslationParams = Record<string, string | number>;

export interface I18nContextValue {
  locale: Locale;
  setLocale: (nextLocale: Locale) => void;
  t: (key: string, params?: TranslationParams) => string;
  messages: Messages;
  hasProvider: boolean;
}
