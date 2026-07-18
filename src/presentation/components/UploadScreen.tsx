import React, { useRef } from 'react';

interface UploadScreenProps {
  selectedFile: File | null;
  error: string | null;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  onProcess: () => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({
  selectedFile,
  error,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onRemoveFile,
  onProcess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoneClick = () => {
    if (selectedFile) return;
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex-1 flex items-center justify-center p-10 overflow-y-auto print:hidden">
      <div className="w-full max-w-[580px] bg-app-card rounded-xl p-10 shadow-lg border border-border flex flex-col gap-7">
        <div className="text-center">
          <h2 className="text-[1.8rem] font-bold tracking-tight text-text-primary mb-2">
            Digitize Your Exam
          </h2>
          <p className="text-text-secondary text-[0.95rem] leading-[1.5]">
            Convert your paper exam PDFs into clean, editable, and print-ready digital exams.
          </p>
        </div>

        <div
          onClick={handleZoneClick}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-lg py-10 px-5 text-center cursor-pointer transition-all duration-200 relative select-none ${
            isDragOver || selectedFile
              ? 'border-primary bg-[rgba(79,70,229,0.02)] shadow-glow'
              : 'border-border bg-app-hover hover:border-primary hover:bg-[rgba(79,70,229,0.02)] hover:shadow-glow'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf"
            className="hidden"
          />

          {!selectedFile ? (
            <div className="flex flex-col items-center gap-3">
              <div className="text-primary bg-primary-light w-16 h-16 rounded-full flex items-center justify-center mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <h3 className="font-bold text-text-primary text-[1.1rem]">
                Drag & drop your exam PDF here
              </h3>
              <p className="text-text-muted text-sm">or click to browse files</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-2 py-1.5 px-3 bg-app-card text-text-secondary border border-border text-[0.8rem] font-semibold rounded-sm cursor-pointer transition-all duration-200 hover:bg-app-hover hover:text-text-primary shadow-sm"
              >
                Browse Files
              </button>
              <p className="text-[0.75rem] text-text-muted">PDF files up to 20MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-4 bg-app-card border border-border rounded-md p-4 w-full max-w-[440px] mb-3 shadow-sm text-left">
                <div className="text-2xl select-none">📄</div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-semibold text-[0.9rem] text-text-primary truncate">
                    {selectedFile.name}
                  </div>
                  <div className="text-[0.8rem] text-text-muted">
                    {formatSize(selectedFile.size)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile();
                  }}
                  className="bg-transparent border-none text-[20px] text-text-muted cursor-pointer p-1 rounded-full flex items-center justify-center leading-none transition-all duration-150 hover:text-danger hover:bg-danger-light w-8 h-8"
                  title="Remove file"
                >
                  &times;
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onProcess();
                }}
                className="inline-flex items-center justify-center gap-2 py-3.5 px-7 bg-primary text-white text-base font-semibold rounded-lg border border-transparent cursor-pointer transition-all duration-200 hover:bg-primary-hover hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(79,70,229,0.25)] active:translate-y-0 w-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                Digitize Exam
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="py-3 px-4 rounded-md text-[0.85rem] leading-[1.4] font-medium border bg-danger-light border-[rgba(239,68,68,0.2)] text-danger-hover text-left">
            ⚠️ <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2.5 items-start p-3 bg-[#faf5ff] rounded-md text-[#6b21a8] text-[0.8rem] leading-[1.4] border border-[#f3e8ff] text-left">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0 mt-[2px]"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>
            Your API key and files are processed strictly in your browser. Nothing is uploaded to any server other than Google's official Gemini API.
          </span>
        </div>
      </div>
    </div>
  );
};
