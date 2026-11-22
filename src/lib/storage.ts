import type { PrepProgress, ProgressState, SessionRecord } from '../types';

const STORAGE_KEY = 'pathoquiz:progress:v1';
const MAX_SESSIONS = 20;

export const emptyPrepProgress = (): PrepProgress => ({
  correct: 0,
  wrong: 0,
  seen: 0,
  known: false,
  review: false,
  lastSeen: null,
});

export const emptyProgress = (): ProgressState => ({
  version: 1,
  preps: {},
  sessions: [],
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Акуратно читає й валідує збережений стан; будь-яке сміття -> чистий прогрес. */
export function loadProgress(): ProgressState {
  if (typeof window === 'undefined') return emptyProgress();
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return emptyProgress();
    const parsed: unknown = JSON.parse(rawValue);
    if (!isRecord(parsed)) return emptyProgress();

    const preps: Record<string, PrepProgress> = {};
    if (isRecord(parsed.preps)) {
      for (const [id, value] of Object.entries(parsed.preps)) {
        if (!isRecord(value)) continue;
        preps[id] = {
          correct: Number(value.correct) || 0,
          wrong: Number(value.wrong) || 0,
          seen: Number(value.seen) || 0,
          known: Boolean(value.known),
          review: Boolean(value.review),
          lastSeen: typeof value.lastSeen === 'number' ? value.lastSeen : null,
        };
      }
    }

    const sessions: SessionRecord[] = Array.isArray(parsed.sessions)
      ? parsed.sessions
          .filter(isRecord)
          .map((s) => ({
            id: String(s.id ?? ''),
            mode: (s.mode as SessionRecord['mode']) ?? 'quiz',
            date: Number(s.date) || Date.now(),
            total: Number(s.total) || 0,
            correct: Number(s.correct) || 0,
            durationMs: Number(s.durationMs) || 0,
          }))
          .slice(0, MAX_SESSIONS)
      : [];

    return { version: 1, preps, sessions };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(state: ProgressState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* приватний режим або переповнене сховище — працюємо без збереження */
  }
}

export function clearProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const MAX_SESSION_HISTORY = MAX_SESSIONS;
