import { Injectable, signal } from '@angular/core';
import es from '../i18n/es.json';
import en from '../i18n/en.json';
import {
  AppLanguage,
  getStoredLanguage,
  setStoredLanguage,
} from '../utils/profile-language';

type Dictionary = Record<string, unknown>;

const DICTIONARIES: Record<AppLanguage, Dictionary> = {
  es: es as unknown as Dictionary,
  en: en as unknown as Dictionary,
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
  readonly currentLang = signal<AppLanguage>(getStoredLanguage());

  setLanguage(lang: AppLanguage): void {
    this.currentLang.set(lang);
    setStoredLanguage(lang);
  }

  translate(key: string, params?: Record<string, unknown>): string {
    const dict = DICTIONARIES[this.currentLang()];
    // Plurales básicos: si count === 1 y existe la variante `.one`, úsala.
    const count = params?.['count'];
    const singularKey =
      (count === 1 || count === '1') && typeof key === 'string' ? `${key}.one` : null;
    const lookup = (k: string): string | null => {
      const keys = k.split('.');
      let current: unknown = dict;
      for (const part of keys) {
        if (current && typeof current === 'object' && part in current) {
          current = (current as Dictionary)[part];
        } else {
          return null;
        }
      }
      return typeof current === 'string' ? current : null;
    };
    const template = (singularKey ? lookup(singularKey) : null) ?? lookup(key) ?? key;
    if (!params) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (_, p: string) => {
      const val = params[p];
      return val !== undefined ? String(val) : `{{${p}}}`;
    });
  }
}
