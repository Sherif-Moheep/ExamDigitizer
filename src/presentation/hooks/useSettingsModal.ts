import { useState, useEffect } from 'react';
import { useDependencies } from '../di/DiContext';

export const GEMINI_MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Recommended)' },
  { id: 'gemini-3.5-pro', name: 'Gemini 3.5 Pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Stable)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Stable)' }
];

export function useSettingsModal(isOpen: boolean, onClose: () => void) {
  const { settingsRepository } = useDependencies();

  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const storedKey = settingsRepository.getApiKey();
      const storedModel = settingsRepository.getModel();

      setApiKey(storedKey);
      setShowApiKey(false);

      const isPreset = GEMINI_MODELS.some((m) => m.id === storedModel);
      if (isPreset) {
        setSelectedModel(storedModel);
        setCustomModel('');
        setShowCustomInput(false);
      } else if (storedModel) {
        setSelectedModel('custom');
        setCustomModel(storedModel);
        setShowCustomInput(true);
      } else {
        setSelectedModel('gemini-3.5-flash');
        setCustomModel('');
        setShowCustomInput(false);
      }
    }
  }, [isOpen, settingsRepository]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    if (modelId === 'custom') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
    }
  };

  const saveSettings = () => {
    const key = apiKey.trim();
    const finalModel = selectedModel === 'custom' ? customModel.trim() : selectedModel;

    if (selectedModel === 'custom' && !finalModel) {
      alert('Please enter a custom Model ID.');
      return;
    }

    settingsRepository.saveApiKey(key);
    settingsRepository.saveModel(finalModel);
    onClose();
  };

  return {
    apiKey,
    setApiKey,
    selectedModel,
    handleModelChange,
    customModel,
    setCustomModel,
    showApiKey,
    toggleApiKeyVisibility: () => setShowApiKey((prev) => !prev),
    showCustomInput,
    saveSettings,
  };
}
