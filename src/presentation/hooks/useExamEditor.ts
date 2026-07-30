import { useState, useEffect, useRef } from 'react';
import { useDependencies } from '../di/DiContext';
import { PdfPage } from '../../domain/models/PdfPage';

export function useExamEditor(
  initialMarkdown: string,
  initialPageImages: PdfPage[] = [],
  initialFigureImages: Record<string, string> = {},
  isStreaming = false
) {
  const { compileExamUseCase } = useDependencies();
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [pageImages, setPageImages] = useState<PdfPage[]>(initialPageImages);
  const [figureImages, setFigureImages] = useState<Record<string, string>>(initialFigureImages);
  const [solveLines, setSolveLines] = useState(6);
  const [htmlPreview, setHtmlPreview] = useState('');
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Syncing...' | 'Streaming...'>('Synced');
  const timerRef = useRef<number | null>(null);
  const lastCompileTimeRef = useRef<number>(0);
  const compileThrottleTimerRef = useRef<number | null>(null);

  // Sync state if initial values change (e.g., streaming chunks arriving or freshly loaded digitized output)
  useEffect(() => {
    setMarkdown(initialMarkdown);
    setPageImages(initialPageImages);
    setFigureImages(initialFigureImages);

    if (isStreaming) {
      setSyncStatus('Streaming...');
      // Throttle compilation to every 200ms while streaming
      const now = Date.now();
      if (now - lastCompileTimeRef.current >= 200) {
        lastCompileTimeRef.current = now;
        setHtmlPreview(
          compileExamUseCase.execute(initialMarkdown, 6, initialFigureImages, initialPageImages)
        );
      } else {
        if (!compileThrottleTimerRef.current) {
          compileThrottleTimerRef.current = window.setTimeout(() => {
            compileThrottleTimerRef.current = null;
            lastCompileTimeRef.current = Date.now();
            setHtmlPreview(
              compileExamUseCase.execute(initialMarkdown, 6, initialFigureImages, initialPageImages)
            );
          }, 200);
        }
      }
    } else {
      setSyncStatus('Synced');
      setHtmlPreview(
        compileExamUseCase.execute(initialMarkdown, solveLines, initialFigureImages, initialPageImages)
      );
    }
  }, [initialMarkdown, initialPageImages, initialFigureImages, compileExamUseCase, isStreaming, solveLines]);

  const triggerCompilation = (
    text: string,
    lines: number,
    figs: Record<string, string>,
    pages: PdfPage[]
  ) => {
    const compiled = compileExamUseCase.execute(text, lines, figs, pages);
    setHtmlPreview(compiled);
  };

  const updateMarkdown = (text: string) => {
    setMarkdown(text);
    triggerCompilation(text, solveLines, figureImages, pageImages);

    // Sync indicator logic (450ms delay)
    setSyncStatus('Syncing...');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setSyncStatus('Synced');
    }, 450);
  };

  const updateSolveLines = (lines: number) => {
    setSolveLines(lines);
    triggerCompilation(markdown, lines, figureImages, pageImages);
  };

  const updateFigureImage = (figureKey: string, base64: string | null) => {
    setFigureImages((prev) => {
      const next = { ...prev };
      if (base64 === null) {
        delete next[figureKey];
      } else {
        next[figureKey] = base64;
      }
      triggerCompilation(markdown, solveLines, next, pageImages);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (compileThrottleTimerRef.current) {
        clearTimeout(compileThrottleTimerRef.current);
      }
    };
  }, []);

  return {
    markdown,
    updateMarkdown,
    solveLines,
    updateSolveLines,
    pageImages,
    figureImages,
    updateFigureImage,
    htmlPreview,
    syncStatus,
  };
}
