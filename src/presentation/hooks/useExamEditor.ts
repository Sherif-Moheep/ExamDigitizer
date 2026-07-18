import { useState, useEffect, useRef } from 'react';
import { useDependencies } from '../di/DiContext';

export function useExamEditor(initialMarkdown: string) {
  const { compileExamUseCase } = useDependencies();
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [htmlPreview, setHtmlPreview] = useState('');
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Syncing...'>('Synced');
  const timerRef = useRef<number | null>(null);

  // Sync state if initialMarkdown changes (e.g., freshly loaded digitized output)
  useEffect(() => {
    setMarkdown(initialMarkdown);
    setHtmlPreview(compileExamUseCase.execute(initialMarkdown));
  }, [initialMarkdown, compileExamUseCase]);

  const updateMarkdown = (text: string) => {
    setMarkdown(text);

    // Sync render
    const compiled = compileExamUseCase.execute(text);
    setHtmlPreview(compiled);

    // Sync indicator logic (450ms delay)
    setSyncStatus('Syncing...');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setSyncStatus('Synced');
    }, 450);
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
    htmlPreview,
    syncStatus,
  };
}
