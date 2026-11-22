/** Перемішування Фішера–Єйтса (не мутує вхідний масив). */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Випадкова вибірка без повторів. */
export function sample<T>(items: readonly T[], count: number): T[] {
  return shuffle(items).slice(0, Math.max(0, Math.min(count, items.length)));
}

/**
 * Зважена вибірка без повторів: елементи з більшою вагою частіше
 * опиняються на початку черги.
 */
export function weightedSample<T>(
  items: readonly T[],
  count: number,
  weightOf: (item: T) => number,
): T[] {
  const pool = items.map((item) => {
    const w = Math.max(weightOf(item), 0.01);
    // Ключ Ефраїмідіса–Спіракіса для зваженої вибірки без повернення
    return { item, key: Math.pow(Math.random(), 1 / w) };
  });
  pool.sort((a, b) => b.key - a.key);
  return pool.slice(0, Math.max(0, Math.min(count, pool.length))).map((p) => p.item);
}
