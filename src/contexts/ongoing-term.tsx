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
import { toast } from 'sonner';

import { logger } from '@/lib/logger';

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
      try {
        const ongoingTerm = await termAction.checkCurrentTerm();
        if (ongoingTerm) {
          setOngoingTerm(ongoingTerm);
        }
      } catch (error) {
        logger.error({ error }, 'Failed to fetch ongoing term');
        toast.error('Gagal memuat data term berjalan');
      } finally {
        setIsLoading(false);
      }
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
