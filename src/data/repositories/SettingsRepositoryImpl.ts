import { SettingsRepository } from '../../domain/repositories/SettingsRepository';

export class SettingsRepositoryImpl implements SettingsRepository {
  private API_KEY_KEY = 'examdigitizer_api_key';
  private MODEL_KEY = 'examdigitizer_model';
  private DEFAULT_MODEL = 'gemini-3.5-flash';

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
}
