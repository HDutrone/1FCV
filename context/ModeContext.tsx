import React, { createContext, useContext, useState } from 'react';
import { ListingType } from '@/lib/types';

interface ModeContextType {
  mode: ListingType;
  setMode: (mode: ListingType) => void;
  hasSelectedMode: boolean;
  selectMode: (mode: ListingType) => void;
}

const ModeContext = createContext<ModeContextType | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ListingType>('rent');
  const [hasSelectedMode, setHasSelectedMode] = useState(false);

  const setMode = (m: ListingType) => {
    setModeState(m);
  };

  const selectMode = (m: ListingType) => {
    setModeState(m);
    setHasSelectedMode(true);
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, hasSelectedMode, selectMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within ModeProvider');
  return ctx;
}
