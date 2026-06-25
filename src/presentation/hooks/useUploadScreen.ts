import { useState, useRef, useEffect } from 'react';
import { useDependencies } from '../di/DiContext';

interface UseUploadScreenProps {
  onSuccess: (markdownResult: string, file: File) => void;
  onOpenSettings: () => void;
}

export function useUploadScreen({ onSuccess, onOpenSettings }: UseUploadScreenProps) {
  const { digitizeExamUseCase, settingsRepository } = useDependencies();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileSelection = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }

    // 20MB limit
    if (file.size > 20 * 1024 * 1024) {
      setError('File is too large. Maximum size is 20MB.');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const processExam = async () => {
    const apiKey = settingsRepository.getApiKey();
    const model = settingsRepository.getModel();

    if (!apiKey) {
      setError('Please configure your Gemini API Key in Settings first.');
      onOpenSettings();
      return;
    }

    if (!selectedFile) {
      setError('Please select an exam PDF first.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Reading PDF file...');
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const base64Data = await fileToBase64(selectedFile);

      setProcessingStatus('Analyzing exam content with Gemini...');
      const result = await digitizeExamUseCase.execute(
        base64Data,
        apiKey,
        model,
        abortControllerRef.current.signal
      );

      setIsProcessing(false);
      onSuccess(result, selectedFile);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Processing aborted.');
        return;
      }
      console.error(err);
      setIsProcessing(false);
      setError(err.message || 'An error occurred during digitizing.');
    } finally {
      abortControllerRef.current = null;
    }
  };

  const cancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelection(file);
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    selectedFile,
    error,
    setError,
    isProcessing,
    processingStatus,
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelection,
    removeSelectedFile,
    processExam,
    cancelProcessing,
  };
}
