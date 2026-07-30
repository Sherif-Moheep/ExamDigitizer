import React, { useState, useMemo, useEffect } from 'react';
import { DependencyProvider, useDependencies } from './di/DiContext';
import { CompileExamUseCase } from '../domain/usecases/CompileExamUseCase';
import { DigitizeExamUseCase } from '../domain/usecases/DigitizeExamUseCase';
import { MarkdownParserImpl } from '../data/services/MarkdownParserImpl.ts';
import { SettingsRepositoryImpl } from '../data/repositories/SettingsRepositoryImpl.ts';
import { GeminiServiceImpl } from '../data/services/GeminiServiceImpl';
import { PdfServiceImpl } from '../data/services/PdfServiceImpl';
import { useUploadScreen } from './hooks/useUploadScreen';
import { useExamEditor } from './hooks/useExamEditor';
import { Header } from './components/Header';
import { UploadScreen } from './components/UploadScreen';
import { EditorScreen } from './components/EditorScreen';
import { SettingsModal } from './components/SettingsModal';
import { ProcessingOverlay } from './components/ProcessingOverlay';

import { PdfPage } from '../domain/models/PdfPage';

const DigitizerApp: React.FC = () => {
  const { settingsRepository } = useDependencies();
  const [view, setView] = useState<'upload' | 'editor'>('upload');
  const [digitizedMarkdown, setDigitizedMarkdown] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => settingsRepository.getTheme());

  const [isStreaming, setIsStreaming] = useState(false);

  // PDF Page and Figure images states
  const [pageImages, setPageImages] = useState<PdfPage[]>([]);
  const [figureImages, setFigureImages] = useState<Record<string, string>>({});

  // Apply theme class to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    settingsRepository.saveTheme(nextTheme);
  };

  // Sync document title matching original logic
  useEffect(() => {
    if (view === 'editor' && fileName) {
      const cleanName = fileName.replace(/\.[^/.]+$/, '');
      document.title = `${cleanName} - Digitized`;
    } else {
      document.title = 'Exam Digitizer';
    }
  }, [view, fileName]);

  const handleStreamStart = (file: File, pages: PdfPage[]) => {
    setIsStreaming(true);
    setFileName(file.name);
    setPageImages(pages);
    setDigitizedMarkdown('');
    setFigureImages({});
    setView('editor');
  };

  const handleStreamChunk = (chunkMarkdown: string) => {
    setDigitizedMarkdown(chunkMarkdown);
  };

  const handleDigitizationSuccess = (
    markdownResult: string,
    file: File,
    pages: PdfPage[],
    autoFigures: Record<string, string>
  ) => {
    setDigitizedMarkdown(markdownResult);
    setFileName(file.name);
    setPageImages(pages);
    setFigureImages(autoFigures);
    setIsStreaming(false);
    setView('editor');
  };

  const {
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
  } = useUploadScreen({
    onSuccess: handleDigitizationSuccess,
    onOpenSettings: () => setSettingsOpen(true),
    onStreamStart: handleStreamStart,
    onStreamChunk: handleStreamChunk,
  });

  const handleNewExam = () => {
    setIsStreaming(false);
    setDigitizedMarkdown('');
    setFileName(null);
    setPageImages([]);
    setFigureImages({});
    setView('upload');
    removeSelectedFile();
  };

  const handleCancelStreaming = () => {
    cancelProcessing();
    setIsStreaming(false);
  };

  const {
    markdown,
    updateMarkdown,
    solveLines,
    updateSolveLines,
    pageImages: editorPageImages,
    figureImages: editorFigureImages,
    updateFigureImage,
    htmlPreview,
    syncStatus,
  } = useExamEditor(digitizedMarkdown, pageImages, figureImages, isStreaming);

  return (
    <div className="font-sans bg-app-bg text-text-primary flex flex-col h-screen overflow-hidden antialiased print:h-auto print:overflow-visible print:bg-white select-none">
      <Header
        view={view}
        onNewExam={handleNewExam}
        onOpenSettings={() => setSettingsOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {view === 'upload' ? (
        <UploadScreen
          selectedFile={selectedFile}
          error={error}
          isDragOver={isDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileSelect={handleFileSelection}
          onRemoveFile={removeSelectedFile}
          onProcess={processExam}
        />
      ) : (
        <EditorScreen
          markdown={markdown}
          onMarkdownChange={updateMarkdown}
          syncStatus={syncStatus}
          htmlPreview={htmlPreview}
          pageImages={editorPageImages}
          figureImages={editorFigureImages}
          solveLines={solveLines}
          onSolveLinesChange={updateSolveLines}
          onUpdateFigureImage={updateFigureImage}
          isStreaming={isStreaming}
          onCancelStreaming={handleCancelStreaming}
        />
      )}

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <ProcessingOverlay
        isOpen={isProcessing}
        status={processingStatus}
        onCancel={cancelProcessing}
      />
    </div>
  );
};

export const App: React.FC = () => {
  const dependencies = useMemo(() => {
    const parser = new MarkdownParserImpl();
    const compileExamUseCase = new CompileExamUseCase(parser);
    const settingsRepository = new SettingsRepositoryImpl();
    const geminiService = new GeminiServiceImpl();
    const digitizeExamUseCase = new DigitizeExamUseCase(geminiService);
    const pdfService = new PdfServiceImpl();

    return {
      compileExamUseCase,
      digitizeExamUseCase,
      settingsRepository,
      pdfService,
    };
  }, []);

  return (
    <DependencyProvider dependencies={dependencies}>
      <DigitizerApp />
    </DependencyProvider>
  );
};
