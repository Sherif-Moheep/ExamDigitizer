import React, { createContext, useContext } from 'react';
import { CompileExamUseCase } from '../../domain/usecases/CompileExamUseCase';
import { DigitizeExamUseCase } from '../../domain/usecases/DigitizeExamUseCase';
import { SettingsRepository } from '../../domain/repositories/SettingsRepository';

export interface Dependencies {
  compileExamUseCase: CompileExamUseCase;
  digitizeExamUseCase: DigitizeExamUseCase;
  settingsRepository: SettingsRepository;
}

const DependencyContext = createContext<Dependencies | null>(null);

export const DependencyProvider: React.FC<{ dependencies: Dependencies; children: React.ReactNode }> = ({
  dependencies,
  children,
}) => (
  <DependencyContext.Provider value={dependencies}>
    {children}
  </DependencyContext.Provider>
);

export const useDependencies = () => {
  const context = useContext(DependencyContext);
  if (!context) {
    throw new Error('useDependencies must be used within a DependencyProvider');
  }
  return context;
};
