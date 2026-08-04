import React from 'react';
import logo from '../../assets/logo.png';
import { GithubIcon, ArrowLeftIcon, MoonIcon, SunIcon, SettingsIcon, PrintIcon } from './Icons';

type HeaderProps = {
  view: 'upload' | 'editor';
  onNewExam: () => void;
  onOpenSettings: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  view,
  onNewExam,
  onOpenSettings,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="bg-app-card border-b border-border py-3 px-6 flex items-center justify-between h-16 z-10 shadow-sm print:hidden">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Exam Digitizer Logo" className="w-[22px] h-[22px] object-contain select-none" />
        <h1 className="text-[1.15rem] font-bold tracking-tight text-text-primary">
          Exam Digitizer
        </h1>
      </div>
      <div className="flex items-center gap-2.5">
        <a
          href="https://github.com/Sherif-Moheep/ExamDigitizer"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center p-[10px] bg-app-card text-text-secondary border border-border rounded-md cursor-pointer transition-all duration-200 hover:bg-app-hover hover:text-text-primary hover:border-text-muted shadow-sm"
          title="View source on GitHub"
        >
          <GithubIcon size={16} />
        </a>

        {view === 'editor' && (
          <button
            onClick={onNewExam}
            className="inline-flex items-center justify-center gap-2 py-[10px] px-[18px] bg-app-card text-text-secondary border border-border text-sm font-semibold rounded-md cursor-pointer transition-all duration-200 hover:bg-app-hover hover:text-text-primary hover:border-text-muted shadow-sm"
          >
            <ArrowLeftIcon size={16} />
            New Exam
          </button>
        )}

        <button
          onClick={onToggleTheme}
          className="inline-flex items-center justify-center p-[10px] bg-app-card text-text-secondary border border-border rounded-md cursor-pointer transition-all duration-200 hover:bg-app-hover hover:text-text-primary hover:border-text-muted shadow-sm"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <MoonIcon size={16} />
          ) : (
            <SunIcon size={16} />
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="inline-flex items-center justify-center gap-2 py-[10px] px-[18px] bg-app-card text-text-secondary border border-border text-sm font-semibold rounded-md cursor-pointer transition-all duration-200 hover:bg-app-hover hover:text-text-primary hover:border-text-muted shadow-sm"
        >
          <SettingsIcon size={16} />
          Settings
        </button>

        {view === 'editor' && (
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 py-[10px] px-[18px] bg-primary text-white text-sm font-semibold rounded-md border border-transparent cursor-pointer transition-all duration-200 hover:bg-primary-hover hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(79,70,229,0.25)] active:translate-y-0 shadow-sm"
          >
            <PrintIcon size={16} />
            Print / Save as PDF
          </button>
        )}
      </div>
    </header>
  );
};
