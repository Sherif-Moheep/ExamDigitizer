import React from 'react';
import { LaptopIcon } from './Icons';

interface MobileGuardScreenProps {
  onBypass: () => void;
}

export const MobileGuardScreen: React.FC<MobileGuardScreenProps> = ({ onBypass }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-app-bg text-text-primary text-center font-sans select-none">
      <div className="w-full max-w-[480px] bg-app-card rounded-2xl p-8 sm:p-10 shadow-2xl border border-border flex flex-col items-center gap-6 animate-fadeIn">
        {/* Laptop / Monitor Icon Badge */}
        <div className="w-20 h-20 rounded-2xl bg-primary-light text-primary flex items-center justify-center shadow-inner">
          <LaptopIcon size={48} />
        </div>

        {/* Title & Headline */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            Desktop & Laptop Recommended
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">Exam Digitizer</span> requires a larger screen viewport to render side-by-side Markdown editing, diagram cropping, and print-ready A4 worksheets.
          </p>
        </div>

        {/* Key Reason Bullets */}
        <div className="w-full bg-app-hover rounded-xl p-4 border border-border text-left space-y-2.5 text-xs text-text-secondary">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>Side-by-side live split Markdown editor</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>Interactive canvas figure cropping tool</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>Print-ready A4 PDF worksheet export</span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-3 pt-2">
          <div className="text-xs text-text-muted px-4">
            For the best experience, please re-open this app on your PC, laptop, or tablet.
          </div>

          <button
            onClick={onBypass}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl cursor-pointer shadow-md hover:shadow-lg shadow-primary/25 transition-all duration-200 active:scale-[0.98]"
          >
            Proceed Anyway (Experimental Mobile View)
          </button>
        </div>
      </div>
    </div>
  );
};
