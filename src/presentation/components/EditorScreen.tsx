import React from 'react';

interface EditorScreenProps {
  markdown: string;
  onMarkdownChange: (text: string) => void;
  syncStatus: 'Synced' | 'Syncing...';
  htmlPreview: string;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({
  markdown,
  onMarkdownChange,
  syncStatus,
  htmlPreview,
}) => {
  return (
    <main className="flex-1 flex overflow-hidden p-5 gap-5 h-[calc(100vh-64px)] print:block print:p-0 print:m-0 print:h-auto print:overflow-visible">
      {/* 1. Editor column */}
      <section className="flex-1 flex flex-col gap-3 overflow-hidden print:hidden">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[0.95rem] font-semibold text-text-secondary">
            1. Raw Gemini Markdown
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
            2. Live Browser Rendering
          </h3>
          <span className="text-[0.8rem] text-text-secondary bg-border py-[2px] px-[6px] rounded-sm">
            A4 Document
          </span>
        </div>
        <div className="flex-1 bg-[#cbd5e1] rounded-lg border border-border p-6 overflow-y-auto shadow-sm flex justify-center items-start print:bg-transparent print:border-none print:p-0 print:shadow-none print:overflow-visible print:block print:h-auto">
          <div
            id="pdf-container"
            className="bg-white w-full max-w-[800px] min-h-[297mm] px-[70px] py-[60px] rounded-[4px] shadow-lg leading-[1.75] text-[#1e293b] text-[15px] print:border-none print:p-0 print:shadow-none print:max-w-full print:w-full print:min-h-0 print:bg-white print:text-black"
            dangerouslySetInnerHTML={{ __html: htmlPreview }}
          />
        </div>
      </section>
    </main>
  );
};
