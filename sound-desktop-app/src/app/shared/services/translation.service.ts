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
    const keys = key.split('.');
    let current: unknown = dict;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = (current as Dictionary)[k];
      } else {
        return key;
      }
    }

    const result = typeof current === 'string' ? current : key;
    if (!params) return result;
    return result.replace(/\{\{(\w+)\}\}/g, (_, p: string) => {
      const val = params[p];
      return val !== undefined ? String(val) : `{{${p}}}`;
    });
  }
}
