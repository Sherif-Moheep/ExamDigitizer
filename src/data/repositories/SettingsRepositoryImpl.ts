import { SettingsRepository } from '../../domain/repositories/SettingsRepository';

export class SettingsRepositoryImpl implements SettingsRepository {
  private API_KEY_KEY = 'examdigitizer_api_key';
  private MODEL_KEY = 'examdigitizer_model';
  private THEME_KEY = 'examdigitizer_theme';
  private DEFAULT_MODEL = 'gemini-3.7-flash';

  getApiKey(): string {
    return localStorage.getItem(this.API_KEY_KEY) || '';
  }

  saveApiKey(key: string): void {
    localStorage.setItem(this.API_KEY_KEY, key);
  }

  getModel(): string {
    return localStorage.getItem(this.MODEL_KEY) || this.DEFAULT_MODEL;
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
