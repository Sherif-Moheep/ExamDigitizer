import React from 'react';

type ProcessingOverlayProps = {
  isOpen: boolean;
  status: string;
  onCancel: () => void;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  isOpen,
  status,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0f172a]/35 backdrop-blur-[6px] z-[100] flex items-center justify-center p-6 transition-all duration-200 print:hidden">
      <div className="w-full max-w-[320px] bg-app-card rounded-lg shadow-lg p-8 text-center flex flex-col items-center gap-4 transition-all duration-200">
        <div className="w-12 h-12 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
        <h3 className="font-bold text-text-primary text-[1.1rem]">Digitizing Exam...</h3>
        <p className="text-text-muted text-sm">{status}</p>

        <button
          onClick={onCancel}
          className="inline-flex items-center justify-center gap-2 py-1.5 px-3 bg-danger text-white border border-transparent text-[0.8rem] font-semibold rounded-sm cursor-pointer transition-all duration-200 hover:bg-danger-hover mt-5 shadow-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
