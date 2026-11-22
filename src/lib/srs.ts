import type { PrepProgress, Preparation } from '../types';

/**
 * Вага препарату для черги тренування.
 * Що гірше користувач знає препарат — то більша вага, то частіше він випадає.
 */
export function weightFor(stats: PrepProgress): number {
  let w = 1;
  if (stats.seen === 0) w += 0.9; // нові препарати теж треба показувати
  if (stats.review) w += 2.5;
  if (stats.known) w -= 0.6;
  w += stats.wrong * 1.2;
  w -= Math.min(stats.correct, 4) * 0.18;

  // давно не бачений препарат поступово «спливає» нагору
  if (stats.lastSeen) {
    const days = (Date.now() - stats.lastSeen) / 86_400_000;
    w += Math.min(days * 0.25, 1.5);
  }
  return Math.max(w, 0.15);
}

/** Чи вважається препарат «слабким місцем». */
export function isWeak(stats: PrepProgress): boolean {
  return stats.wrong > 0 || stats.review;
}

/** Сортування слабких місць: спочатку найпроблемніші. */
export function sortWeak(
  preps: readonly Preparation[],
  statsFor: (id: string) => PrepProgress,
): Preparation[] {
  return preps
    .filter((p) => isWeak(statsFor(p.id)))
    .sort((a, b) => {
      const sa = statsFor(a.id);
      const sb = statsFor(b.id);
      if (sb.wrong !== sa.wrong) return sb.wrong - sa.wrong;
      const accA = sa.correct + sa.wrong ? sa.correct / (sa.correct + sa.wrong) : 0;
      const accB = sb.correct + sb.wrong ? sb.correct / (sb.correct + sb.wrong) : 0;
      return accA - accB;
    });
}

export function accuracyOf(stats: PrepProgress): number | null {
  const answered = stats.correct + stats.wrong;
  return answered ? Math.round((stats.correct / answered) * 100) : null;
}
