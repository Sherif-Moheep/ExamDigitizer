import React, { useEffect, useState } from 'react';
import { PdfPage } from '../../domain/models/PdfPage';
import { PdfThumbnails } from './PdfThumbnails';
import { FigureCropper } from './FigureCropper';

interface EditorScreenProps {
  markdown: string;
  onMarkdownChange: (text: string) => void;
  syncStatus: 'Synced' | 'Syncing...';
  htmlPreview: string;
  pageImages: PdfPage[];
  figureImages: Record<string, string>;
  solveLines: number;
  onSolveLinesChange: (lines: number) => void;
  onUpdateFigureImage: (figureKey: string, base64: string | null) => void;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({
  markdown,
  onMarkdownChange,
  syncStatus,
  htmlPreview,
  pageImages,
  figureImages,
  solveLines,
  onSolveLinesChange,
  onUpdateFigureImage,
}) => {
  const [thumbnailsCollapsed, setThumbnailsCollapsed] = useState(false);
  const [cropTarget, setCropTarget] = useState<{ figureKey: string; pageNum: number } | null>(
    null
  );

  // Handle click events on crop buttons inside the rendered HTML container
  useEffect(() => {
    const container = document.getElementById('pdf-container');
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cropBtn = target.closest('.crop-btn');
      if (cropBtn) {
        const figureKey = cropBtn.getAttribute('data-figure-key');
        const pageNumAttr = cropBtn.getAttribute('data-page');
        const pageNum = pageNumAttr ? parseInt(pageNumAttr, 10) : null;
        if (figureKey && pageNum) {
          setCropTarget({ figureKey, pageNum });
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [htmlPreview]);

  return (
    <main className="flex-1 flex overflow-hidden p-5 gap-5 h-[calc(100vh-64px)] print:block print:p-0 print:m-0 print:h-auto print:overflow-visible">
      {/* PDF Thumbnails Sidebar */}
      <PdfThumbnails
        pageImages={pageImages}
        collapsed={thumbnailsCollapsed}
        onToggleCollapse={() => setThumbnailsCollapsed(!thumbnailsCollapsed)}
      />

      {/* 1. Editor column */}
      <section className="flex-1 flex flex-col gap-3 overflow-hidden print:hidden">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[0.95rem] font-semibold text-text-secondary">
            1. Editable Exam Markup
          </h3>
          <span
            className="text-[0.8rem] text-text-muted flex items-center gap-1.5 transition-opacity duration-200"
            style={{ opacity: syncStatus === 'Syncing...' ? 0.7 : 1 }}
          >
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            {syncStatus}
          </span>
        </div>
        <textarea
          value={markdown}
          onChange={(e) => onMarkdownChange(e.target.value)}
          placeholder="Type raw markdown here..."
          className="flex-1 w-full font-mono text-[13.5px] leading-[1.6] p-4 border border-border rounded-lg bg-app-card text-text-primary resize-none shadow-sm outline-none transition-all duration-200 focus:border-primary focus:shadow-md focus:ring-[3px] focus:ring-focusring"
        />
      </section>

      {/* 2. Preview column */}
      <section className="flex-1 flex flex-col gap-3 overflow-hidden print:block print:p-0 print:m-0 print:h-auto print:overflow-visible">
        <div className="flex items-center justify-between px-1 print:hidden">
          <h3 className="text-[0.95rem] font-semibold text-text-secondary">
            2. Live Print-Ready Preview
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[0.8rem] text-text-secondary">Answer Lines:</span>
              <input
                type="range"
                min={2}
                max={20}
                value={solveLines}
                onChange={(e) => onSolveLinesChange(parseInt(e.target.value, 10))}
                className="w-24 h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[0.8rem] text-text-secondary font-mono bg-border py-[2px] px-[6px] rounded-sm">
                {solveLines}
              </span>
            </div>
            <span className="text-[0.8rem] text-text-secondary bg-border py-[2px] px-[6px] rounded-sm">
              A4 Document
            </span>
          </div>
        </div>
        <div className="flex-1 bg-[#cbd5e1] dark:bg-slate-900 rounded-lg border border-border p-6 overflow-y-auto shadow-sm flex justify-center items-start print:bg-transparent print:border-none print:p-0 print:shadow-none print:overflow-visible print:block print:h-auto">
          <div
            id="pdf-container"
            className="bg-white w-full max-w-[800px] min-h-[297mm] px-[70px] py-[60px] rounded-[4px] shadow-lg leading-[1.75] text-[#1e293b] text-[15px] print:border-none print:p-0 print:shadow-none print:max-w-full print:w-full print:min-h-0 print:bg-white print:text-black"
            dangerouslySetInnerHTML={{ __html: htmlPreview }}
          />
        </div>
      </section>

      {/* Manual Figure Cropper Modal */}
      {cropTarget && (
        <FigureCropper
          pageImage={pageImages.find((p) => p.pageNum === cropTarget.pageNum)?.base64 || ''}
          figureKey={cropTarget.figureKey}
          onApply={(key, base64) => {
            onUpdateFigureImage(key, base64);
            setCropTarget(null);
          }}
          onCancel={() => setCropTarget(null)}
          existingCrop={!!figureImages[cropTarget.figureKey]}
        />
      )}
    </main>
  );
};
