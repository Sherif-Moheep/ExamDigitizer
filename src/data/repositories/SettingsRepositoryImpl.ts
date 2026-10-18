import { SettingsRepository } from '../../domain/repositories/SettingsRepository';

const DEPRECATED_MODEL_MIGRATIONS: Record<string, string> = {
  'gemini-3.7-flash': 'gemini-3.8-flash',
  'gemini-3.5-flash': 'gemini-3.6-flash',
  'gemini-3.1-flash-lite': 'gemini-3.5-flash-lite',
  'gemini-2.0-flash': 'gemini-3.6-flash',
  'gemini-2.0-flash-lite': 'gemini-3.5-flash-lite',
};

export class SettingsRepositoryImpl implements SettingsRepository {
  private API_KEY_KEY = 'examdigitizer_api_key';
  private MODEL_KEY = 'examdigitizer_model';
  private THEME_KEY = 'examdigitizer_theme';
  private DEFAULT_MODEL = 'gemini-3.8-flash';

  getApiKey(): string {
    return localStorage.getItem(this.API_KEY_KEY) || '';
  }

  saveApiKey(key: string): void {
    localStorage.setItem(this.API_KEY_KEY, key);
  }

  getModel(): string {
    const rawModel = localStorage.getItem(this.MODEL_KEY) || this.DEFAULT_MODEL;
    const migrated = DEPRECATED_MODEL_MIGRATIONS[rawModel];
    if (migrated) {
      this.saveModel(migrated);
      return migrated;
    }
    return rawModel;
  }

  saveModel(model: string): void {
    localStorage.setItem(this.MODEL_KEY, model);
  }

  getTheme(): 'light' | 'dark' {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return 'light';
  }

  saveTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(this.THEME_KEY, theme);
  }
}
