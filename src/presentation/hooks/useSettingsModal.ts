import { useState, useEffect } from 'react';
import { useDependencies } from '../di/DiContext';

export const GEMINI_MODELS = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Recommended)' },
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' }
];


export function useSettingsModal(isOpen: boolean, onClose: () => void) {
  const { settingsRepository } = useDependencies();

  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showApiGuide, setShowApiGuide] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const storedKey = settingsRepository.getApiKey();
      const storedModel = settingsRepository.getModel();

      setApiKey(storedKey);
      setShowApiKey(false);
      setShowApiGuide(false);

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
        setSelectedModel(GEMINI_MODELS[0].id);
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
    showApiGuide,
    toggleApiGuide: () => setShowApiGuide((prev) => !prev),
    saveSettings,
  };
}
