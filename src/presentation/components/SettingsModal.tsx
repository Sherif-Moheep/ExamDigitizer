import React from 'react';
import { useSettingsModal, GEMINI_MODELS } from '../hooks/useSettingsModal';
import { EyeIcon, EyeOffIcon } from './Icons';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    apiKey,
    setApiKey,
    selectedModel,
    handleModelChange,
    customModel,
    setCustomModel,
    showApiKey,
    toggleApiKeyVisibility,
    showCustomInput,
    showApiGuide,
    toggleApiGuide,
    saveSettings,
  } = useSettingsModal(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0f172a]/35 backdrop-blur-[6px] z-[100] flex items-center justify-center p-6 transition-all duration-200 print:hidden">
      <div className="w-full max-w-[480px] bg-app-card rounded-lg shadow-lg border border-border flex flex-col transition-all duration-200">
        <div className="p-5 px-6 border-b border-border flex items-center justify-between">
          <h3 className="text-[1.1rem] font-bold text-text-primary">Settings</h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-[24px] text-text-muted cursor-pointer leading-none hover:text-text-primary"
          >
            &times;
          </button>
        </div>
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[60vh]">
          {/* API Key Group */}
          <div className="flex flex-col gap-2">
            <label className="text-[0.85rem] font-semibold text-text-secondary">
              Gemini API Key
            </label>
            <div className="flex relative w-full">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Google AI Studio API key..."
                className="w-full py-[10px] pl-3.5 pr-12 text-[0.9rem] text-text-primary bg-app-card border border-border rounded-md outline-none font-mono transition-all duration-150 focus:border-primary focus:ring-[3px] focus:ring-focusring"
              />
              <button
                onClick={toggleApiKeyVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 text-text-muted flex items-center justify-center transition-colors duration-150 hover:text-text-primary"
                title="Toggle visibility"
              >
                {showApiKey ? (
                  <EyeOffIcon size={16} />
                ) : (
                  <EyeIcon size={16} />
                )}
              </button>
            </div>
            <div className="flex justify-between items-center text-[0.75rem]">
              <span className="text-text-muted">
                Get your API key for free from{' '}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary no-underline hover:underline font-semibold"
                >
                  Google AI Studio
                </a>
                .
              </span>
              <button
                type="button"
                onClick={toggleApiGuide}
                className="bg-transparent border-none text-primary cursor-pointer hover:underline font-semibold p-0"
              >
                {showApiGuide ? 'Hide Guide' : 'How to get a key?'}
              </button>
            </div>

            {showApiGuide && (
              <div className="mt-2 p-3.5 bg-app-bg border border-border rounded-md text-[0.8rem] text-text-secondary flex flex-col gap-2 transition-all duration-200">
                <p className="font-bold text-text-primary border-b border-border pb-1">
                  How to get your API Key:
                </p>
                <ol className="list-decimal pl-5 flex flex-col gap-1.5 text-text-muted">
                  <li>
                    Go to{' '}
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary no-underline hover:underline font-semibold"
                    >
                      Google AI Studio
                    </a>.
                  </li>
                  <li>Sign in with your Google account.</li>
                  <li>Click on <strong className="text-text-secondary">Get API key</strong> in the left sidebar menu.</li>
                  <li>Click the <strong className="text-text-secondary">Create API key</strong> button.</li>
                  <li>Select/create a project, copy your generated key, and paste it into the field above.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Model Preset Group */}
          <div className="flex flex-col gap-2">
            <label className="text-[0.85rem] font-semibold text-text-secondary">
              Gemini Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="py-[10px] px-3.5 text-[0.9rem] text-text-primary border border-border rounded-md outline-none bg-app-card cursor-pointer transition-all duration-150 focus:border-primary focus:ring-[3px] focus:ring-focusring font-sans"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
              <option value="custom">Custom Model...</option>
            </select>
          </div>

          {/* Custom Model ID Input */}
          {showCustomInput && (
            <div className="flex flex-col gap-2">
              <label className="text-[0.85rem] font-semibold text-text-secondary">
                Custom Model ID
              </label>
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g. gemini-2.5-flash"
                className="py-[10px] px-3.5 text-[0.9rem] text-text-primary bg-app-card border border-border rounded-md outline-none font-mono transition-all duration-150 focus:border-primary focus:ring-[3px] focus:ring-focusring"
              />
            </div>
          )}
        </div>
        <div className="p-4 px-6 border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 py-[10px] px-[18px] bg-app-card text-text-secondary border border-border text-sm font-semibold rounded-md cursor-pointer transition-all duration-200 hover:bg-app-hover hover:text-text-primary hover:border-text-muted shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={saveSettings}
            className="inline-flex items-center justify-center gap-2 py-[10px] px-[18px] bg-primary text-white border border-transparent text-sm font-semibold rounded-md cursor-pointer transition-all duration-200 hover:bg-primary-hover hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(79,70,229,0.25)] active:translate-y-0 shadow-sm"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
