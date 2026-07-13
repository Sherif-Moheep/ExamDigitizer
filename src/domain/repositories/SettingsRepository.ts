export interface SettingsRepository {
  getApiKey(): string;
  saveApiKey(key: string): void;
  getModel(): string;
  saveModel(model: string): void;
  getTheme(): 'light' | 'dark';
  saveTheme(theme: 'light' | 'dark'): void;
}
