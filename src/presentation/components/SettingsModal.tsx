import React from 'react';
import { useSettingsModal, GEMINI_MODELS } from '../hooks/useSettingsModal';

interface SettingsModalProps {
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[0.75rem] text-text-muted">
              Get your API key for free from{' '}
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary no-underline hover:underline"
              >
                Google AI Studio
              </a>
              .
            </p>
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
                placeholder="e.g. gemini-3.5-flash-medium"
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
