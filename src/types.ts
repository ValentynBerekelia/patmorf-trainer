export type CategoryKey =
  | 'tumors'
  | 'inflammation'
  | 'circulation'
  | 'dystrophy'
  | 'necrosis'
  | 'adaptation'
  | 'other';

export interface PreparationImage {
  src: string;
  width: number;
  height: number;
}

export interface PreparationDescription {
  /** п.1 — анатомічна назва органу чи тканини */
  organ: string;
  /** п.2 — локалізація основного патологічного процесу */
  localization: string;
  /** п.3 — геометрична форма осередку */
  shape: string;
  /** п.4 — розміри осередку */
  size: string;
  /** п.5 — внутрішня структура осередку */
  structure: string;
}

export interface PreparationDiagnosis {
  /** 6.А — основний загальнопатологічний процес */
  main: string;
  /** 6.Б — інші видимі неозброєним оком процеси */
  visible: string;
  /** 6.В — інші вірогідні процеси, не видимі неозброєним оком */
  probable: string;
}

export interface Preparation {
  id: string;
  /** Порядковий номер у PDF (1..N) */
  index: number;
  /** Екзаменаційний номер препарату з PDF ("2", "22/27"), null якщо «Без номера» */
  number: string | null;
  /** Орган із заголовка препарату в PDF */
  organ: string;
  /** Коротка назва діагнозу (виписана з п.6.А) — правильна відповідь у квізі */
  diagnosis: string;
  category: CategoryKey;
  pdfPage: number;
  images: PreparationImage[];
  description: PreparationDescription;
  dx: PreparationDiagnosis;
  /** Заповнено, якщо в самому PDF є описка/суперечність і потрібна ручна перевірка */
  needsReview: string | null;
}

export interface PreparationDataset {
  source: string;
  generatedFrom: string;
  categories: Record<CategoryKey, string>;
  preparations: Preparation[];
}

/** Статистика по одному препарату */
export interface PrepProgress {
  correct: number;
  wrong: number;
  seen: number;
  /** позначено «Знаю» на картці */
  known: boolean;
  /** позначено «Потрібно повторити» */
  review: boolean;
  lastSeen: number | null;
}

export type SessionMode = 'quiz' | 'flashcards' | 'exam' | 'weak';

export interface SessionRecord {
  id: string;
  mode: SessionMode;
  date: number;
  total: number;
  correct: number;
  durationMs: number;
}

export interface ProgressState {
  version: number;
  preps: Record<string, PrepProgress>;
  sessions: SessionRecord[];
}
