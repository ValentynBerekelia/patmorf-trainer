import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { PrepProgress, ProgressState, SessionMode, SessionRecord } from '../types';
import {
  MAX_SESSION_HISTORY,
  clearProgress,
  emptyPrepProgress,
  emptyProgress,
  loadProgress,
  saveProgress,
} from '../lib/storage';
import { preparations } from '../data/preparations';

export interface Totals {
  correct: number;
  wrong: number;
  answered: number;
  accuracy: number;
  studied: number;
  known: number;
  review: number;
  total: number;
}

interface ProgressApi {
  state: ProgressState;
  totals: Totals;
  statsFor: (id: string) => PrepProgress;
  recordAnswer: (id: string, correct: boolean) => void;
  markKnown: (id: string) => void;
  markForReview: (id: string) => void;
  markSeen: (id: string) => void;
  addSession: (session: Omit<SessionRecord, 'id' | 'date'>) => void;
  reset: () => void;
}

const ProgressContext = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => loadProgress());
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    saveProgress(state);
  }, [state]);

  const mutatePrep = useCallback((id: string, fn: (prev: PrepProgress) => PrepProgress) => {
    setState((prev) => {
      const current = prev.preps[id] ?? emptyPrepProgress();
      return { ...prev, preps: { ...prev.preps, [id]: fn(current) } };
    });
  }, []);

  const recordAnswer = useCallback(
    (id: string, correct: boolean) => {
      mutatePrep(id, (p) => ({
        ...p,
        correct: p.correct + (correct ? 1 : 0),
        wrong: p.wrong + (correct ? 0 : 1),
        seen: p.seen + 1,
        // правильна відповідь знімає позначку «повторити», помилка — ставить її
        review: correct ? false : true,
        known: correct ? p.known : false,
        lastSeen: Date.now(),
      }));
    },
    [mutatePrep],
  );

  const markKnown = useCallback(
    (id: string) => {
      mutatePrep(id, (p) => ({
        ...p,
        known: true,
        review: false,
        seen: p.seen + 1,
        lastSeen: Date.now(),
      }));
    },
    [mutatePrep],
  );

  const markForReview = useCallback(
    (id: string) => {
      mutatePrep(id, (p) => ({
        ...p,
        known: false,
        review: true,
        seen: p.seen + 1,
        lastSeen: Date.now(),
      }));
    },
    [mutatePrep],
  );

  const markSeen = useCallback(
    (id: string) => {
      mutatePrep(id, (p) => ({ ...p, seen: p.seen + 1, lastSeen: Date.now() }));
    },
    [mutatePrep],
  );

  const addSession = useCallback((session: Omit<SessionRecord, 'id' | 'date'>) => {
    setState((prev) => ({
      ...prev,
      sessions: [
        {
          ...session,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          date: Date.now(),
        },
        ...prev.sessions,
      ].slice(0, MAX_SESSION_HISTORY),
    }));
  }, []);

  const reset = useCallback(() => {
    clearProgress();
    setState(emptyProgress());
  }, []);

  const statsFor = useCallback(
    (id: string): PrepProgress => state.preps[id] ?? emptyPrepProgress(),
    [state.preps],
  );

  const totals = useMemo<Totals>(() => {
    const values = Object.values(state.preps);
    const correct = values.reduce((acc, p) => acc + p.correct, 0);
    const wrong = values.reduce((acc, p) => acc + p.wrong, 0);
    const answered = correct + wrong;
    return {
      correct,
      wrong,
      answered,
      accuracy: answered ? Math.round((correct / answered) * 100) : 0,
      studied: values.filter((p) => p.seen > 0).length,
      known: values.filter((p) => p.known).length,
      review: values.filter((p) => p.review).length,
      total: preparations.length,
    };
  }, [state.preps]);

  const value = useMemo<ProgressApi>(
    () => ({ state, totals, statsFor, recordAnswer, markKnown, markForReview, markSeen, addSession, reset }),
    [state, totals, statsFor, recordAnswer, markKnown, markForReview, markSeen, addSession, reset],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress має використовуватись усередині <ProgressProvider>');
  return ctx;
}

export type { SessionMode };
