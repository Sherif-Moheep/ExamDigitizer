import { useState, useRef } from 'react';
import { useDependencies } from '../di/DiContext';
import { PdfPage } from '../../domain/models/PdfPage';
import { PdfService } from '../../domain/services/PdfService';

interface UseUploadScreenProps {
  onSuccess: (
    markdownResult: string,
    file: File,
    pageImages: PdfPage[],
    autoFigures: Record<string, string>
  ) => void;
  onOpenSettings: () => void;
  onStreamStart?: (file: File, pages: PdfPage[]) => void;
  onStreamChunk?: (chunkMarkdown: string) => void;
}

export function useUploadScreen({
  onSuccess,
  onOpenSettings,
  onStreamStart,
  onStreamChunk,
}: UseUploadScreenProps) {
  const { digitizeExamUseCase, settingsRepository, pdfService } = useDependencies();

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

      setProcessingStatus('Rendering PDF pages...');
      const pages = await pdfService.renderPdfPages(base64Data);

      if (abortControllerRef.current.signal.aborted) return;

      // Dismiss initial processing modal and open editor in streaming mode
      setIsProcessing(false);
      if (onStreamStart) {
        onStreamStart(selectedFile, pages);
      }

      const result = await digitizeExamUseCase.executeStream(
        base64Data,
        apiKey,
        model,
        (accumulatedText) => {
          if (onStreamChunk) {
            onStreamChunk(accumulatedText);
          }
        },
        abortControllerRef.current.signal
      );

      if (abortControllerRef.current.signal.aborted) return;

      const autoFigures = await autoExtractFigures(result, pages, pdfService);

      onSuccess(result, selectedFile, pages, autoFigures);
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

  const buildFigureKey = (
    parsed: { pageNum: number; coords: { y1: number; x1: number; y2: number; x2: number } | null; description: string },
    index: number
  ): string => {
    if (parsed.coords) {
      return `fig-${parsed.pageNum}-${parsed.coords.y1}_${parsed.coords.x1}_${parsed.coords.y2}_${parsed.coords.x2}`;
    }
    return `fig-${parsed.pageNum}-idx${index}`;
  };

  const autoExtractFigures = async (
    markdownText: string,
    pages: PdfPage[],
    pdfServiceInstance: PdfService
  ): Promise<Record<string, string>> => {
    const figureRegex = /\[FIGURE:[^\]]+\]/gi;
    const matches = markdownText.match(figureRegex) || [];
    const newFigures: Record<string, string> = {};

    let figureIndex = 0;
    for (const match of matches) {
      const parsed = parseFigureMarker(match);
      if (!parsed) continue;

      const figureKey = buildFigureKey(parsed, figureIndex++);
      const page = pages.find((p) => p.pageNum === parsed.pageNum);

      if (page && parsed.coords) {
        try {
          const cropped = await pdfServiceInstance.cropFigureFromPage(
            page.base64,
            page.width,
            page.height,
            parsed.coords
          );
          newFigures[figureKey] = cropped;
        } catch (err) {
          console.warn(`Failed to crop figure ${figureKey}:`, err);
        }
      }
    }

    return newFigures;
  };

  const parseFigureMarker = (markerText: string) => {
    const match = markerText.match(
      /\[FIGURE:(\d+):(\d+),(\d+),(\d+),(\d+):([^\]]+)\]/i
    );
    if (!match) {
      const simpleMatch = markerText.match(/\[FIGURE:(\d+):([^\]]+)\]/i);
      if (simpleMatch) {
        return {
          pageNum: parseInt(simpleMatch[1], 10),
          coords: null,
          description: simpleMatch[2].trim(),
        };
      }
      return null;
    }
    return {
      pageNum: parseInt(match[1], 10),
      coords: {
        y1: parseInt(match[2], 10),
        x1: parseInt(match[3], 10),
        y2: parseInt(match[4], 10),
        x2: parseInt(match[5], 10),
      },
      description: match[6].trim(),
    };
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  return {
    selectedFile,
    error,
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
