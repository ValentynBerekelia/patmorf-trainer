import type { Preparation } from '../types';
import { shuffle } from './random';

export interface QuizQuestion {
  prep: Preparation;
  options: string[];
  answer: string;
}

const OPTIONS_PER_QUESTION = 4;

/**
 * Генерує 4 варіанти відповіді: правильний діагноз препарату + 3 відволікачі.
 * Відволікачі беруться з реальних діагнозів інших препаратів PDF, у першу чергу
 * з тієї ж категорії (щоб питання було складнішим), і ніколи не дублюють
 * правильну відповідь за текстом.
 */
export function buildQuestion(prep: Preparation, pool: readonly Preparation[]): QuizQuestion {
  const answer = prep.diagnosis;

  const uniqueDiagnoses = (list: readonly Preparation[]): string[] => {
    const seen = new Set<string>([answer]);
    const out: string[] = [];
    for (const p of list) {
      if (seen.has(p.diagnosis)) continue;
      seen.add(p.diagnosis);
      out.push(p.diagnosis);
    }
    return out;
  };

  const sameCategory = shuffle(pool.filter((p) => p.category === prep.category && p.id !== prep.id));
  const otherCategory = shuffle(pool.filter((p) => p.category !== prep.category));

  const distractors = uniqueDiagnoses([...sameCategory, ...otherCategory]).slice(
    0,
    OPTIONS_PER_QUESTION - 1,
  );

  return {
    prep,
    answer,
    options: shuffle([answer, ...distractors]),
  };
}

export function buildQuestions(preps: readonly Preparation[], pool: readonly Preparation[]): QuizQuestion[] {
  return preps.map((prep) => buildQuestion(prep, pool));
}

/**
 * Коротке пояснення помилки — складене виключно з даних PDF
 * (п.5 «внутрішня структура» та п.6.А «основний процес»).
 */
export function explainMistake(prep: Preparation, chosen: string): string {
  const hint = prep.description.structure?.trim();
  const base = `Ви обрали «${chosen}», але правильна відповідь — «${prep.diagnosis}».`;
  if (!hint) return base;
  return `${base} Орієнтир для впізнавання: ${hint.replace(/\s+$/, '')}`;
}
