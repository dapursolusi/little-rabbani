'use client';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import * as termAction from '@/features/term/actions';
import { TermData } from '@/features/term/types';

type OngoingTermContextValue = {
  ongoingTerm: TermData | null;
  isLoading: boolean;
};

// Context

const OngoingTermContext = createContext<OngoingTermContextValue | null>(null);

// Provider

export function OngoingTermProvider({ children }: { children: ReactNode }) {
  const [ongoingTerm, setOngoingTerm] = useState<TermData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchOngoingTerm() {
      const results = await termAction.checkCurrentTerm();
      if (results.success) {
        setOngoingTerm(results.data);
      }
      setIsLoading(false);
    }

    void fetchOngoingTerm();
  }, []);

  return (
    <OngoingTermContext.Provider value={{ ongoingTerm, isLoading }}>
      {children}
    </OngoingTermContext.Provider>
  );
}

// Hooks

export function useOngoingTerm() {
  const context = useContext(OngoingTermContext);

  if (!context) {
    throw new Error('useOngoingTerm must be used within the provider');
  }

  return context;
}
