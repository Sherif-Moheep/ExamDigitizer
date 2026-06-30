import React, { useState, useMemo, useEffect } from 'react';
import { DependencyProvider } from './di/DiContext';
import { CompileExamUseCase } from '../domain/usecases/CompileExamUseCase';
import { DigitizeExamUseCase } from '../domain/usecases/DigitizeExamUseCase';
import { MarkdownParserImpl } from '../data/services/MarkdownParserImpl.ts';
import { SettingsRepositoryImpl } from '../data/repositories/SettingsRepositoryImpl.ts';
import { GeminiServiceImpl } from '../data/services/GeminiServiceImpl';
import { useUploadScreen } from './hooks/useUploadScreen';
import { useExamEditor } from './hooks/useExamEditor';
import { Header } from './components/Header';
import { UploadScreen } from './components/UploadScreen';
import { EditorScreen } from './components/EditorScreen';
import { SettingsModal } from './components/SettingsModal';
import { ProcessingOverlay } from './components/ProcessingOverlay';

const DigitizerApp: React.FC = () => {
  const [view, setView] = useState<'upload' | 'editor'>('upload');
  const [digitizedMarkdown, setDigitizedMarkdown] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Sync document title matching original logic
  useEffect(() => {
    if (view === 'editor' && fileName) {
      const cleanName = fileName.replace(/\.[^/.]+$/, '');
      document.title = `${cleanName} - Digitized`;
    } else {
      document.title = 'Exam Digitizer - Native Print';
    }
  }, [view, fileName]);

  const handleDigitizationSuccess = (markdownResult: string, file: File) => {
    setDigitizedMarkdown(markdownResult);
    setFileName(file.name);
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
  });

  const handleNewExam = () => {
    setDigitizedMarkdown('');
    setFileName(null);
    setView('upload');
    removeSelectedFile();
  };

  const { markdown, updateMarkdown, htmlPreview, syncStatus } = useExamEditor(digitizedMarkdown);

  return (
    <div className="font-sans bg-app-bg text-text-primary flex flex-col h-screen overflow-hidden antialiased print:h-auto print:overflow-visible print:bg-white select-none">
      <Header
        view={view}
        onNewExam={handleNewExam}
        onOpenSettings={() => setSettingsOpen(true)}
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

    return {
      compileExamUseCase,
      digitizeExamUseCase,
      settingsRepository,
    };
  }, []);

  return (
    <DependencyProvider dependencies={dependencies}>
      <DigitizerApp />
    </DependencyProvider>
  );
};
