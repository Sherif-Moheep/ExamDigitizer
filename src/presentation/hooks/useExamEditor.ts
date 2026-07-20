import { useState, useEffect, useRef } from 'react';
import { useDependencies } from '../di/DiContext';
import { PdfPage } from '../../domain/models/PdfPage';

export function useExamEditor(
  initialMarkdown: string,
  initialPageImages: PdfPage[] = [],
  initialFigureImages: Record<string, string> = {}
) {
  const { compileExamUseCase } = useDependencies();
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [pageImages, setPageImages] = useState<PdfPage[]>(initialPageImages);
  const [figureImages, setFigureImages] = useState<Record<string, string>>(initialFigureImages);
  const [solveLines, setSolveLines] = useState(6);
  const [htmlPreview, setHtmlPreview] = useState('');
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Syncing...'>('Synced');
  const timerRef = useRef<number | null>(null);

  // Sync state if initial values change (e.g., freshly loaded digitized output)
  useEffect(() => {
    setMarkdown(initialMarkdown);
    setPageImages(initialPageImages);
    setFigureImages(initialFigureImages);
    setHtmlPreview(
      compileExamUseCase.execute(initialMarkdown, 6, initialFigureImages, initialPageImages)
    );
  }, [initialMarkdown, initialPageImages, initialFigureImages, compileExamUseCase]);

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
