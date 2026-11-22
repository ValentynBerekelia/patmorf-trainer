/**
 * Перевірка цілісності даних і логіки тренувань.
 * Запуск: node scripts/verify.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataset = JSON.parse(
  fs.readFileSync(path.join(root, 'src/data/preparations.json'), 'utf8'),
);
const preps = dataset.preparations;

let failures = 0;
const check = (name, ok, detail = '') => {
  if (ok) {
    console.log(`  OK   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}${detail ? ` -> ${detail}` : ''}`);
  }
};

console.log('\n== Дані ==');
check('116 препаратів', preps.length === 116, `отримано ${preps.length}`);
check(
  'у кожного є id, орган, діагноз, категорія',
  preps.every((p) => p.id && p.organ && p.diagnosis && p.category),
);
check('усі id унікальні', new Set(preps.map((p) => p.id)).size === preps.length);
check(
  'усі поля опису (п.1–5) заповнені',
  preps.every(
    (p) =>
      p.description.organ &&
      p.description.localization &&
      p.description.shape &&
      p.description.size &&
      p.description.structure,
  ),
);
check(
  'усі діагнози 6.А/Б/В заповнені',
  preps.every((p) => p.dx.main && p.dx.visible && p.dx.probable),
);
check(
  'категорії відомі',
  preps.every((p) => Object.hasOwn(dataset.categories, p.category)),
);

console.log('\n== Зображення ==');
const missing = [];
let imageCount = 0;
for (const p of preps) {
  if (!p.images.length) missing.push(`${p.id}: немає зображень`);
  for (const img of p.images) {
    imageCount += 1;
    const file = path.join(root, 'public', img.src);
    if (!fs.existsSync(file)) missing.push(`${p.id}: немає файлу ${img.src}`);
    else if (fs.statSync(file).size < 1024) missing.push(`${p.id}: підозріло малий файл ${img.src}`);
  }
}
check(`усі файли зображень на місці (${imageCount} шт.)`, missing.length === 0, missing.slice(0, 5).join('; '));
check(
  'немає спільних файлів у різних препаратів',
  new Set(preps.flatMap((p) => p.images.map((i) => i.src))).size === imageCount,
);
const orphan = fs
  .readdirSync(path.join(root, 'public/preparations'))
  .filter((f) => !preps.some((p) => p.images.some((i) => i.src === `preparations/${f}`)));
check('у папці немає зайвих зображень', orphan.length === 0, orphan.join(', '));

console.log('\n== Нумерація з PDF ==');
const numbered = preps.filter((p) => p.number);
check('108 препаратів мають екзаменаційний номер', numbered.length === 108, `${numbered.length}`);
check(
  'номери у форматі з PDF',
  numbered.every((p) => /^[0-9]+(\/[0-9]+)?$/.test(p.number)),
);

console.log('\n== Логіка квізу ==');
const cacheDir = path.join(root, 'node_modules/.cache-verify');
fs.mkdirSync(cacheDir, { recursive: true });

const compile = async (entry, outName) => {
  const outfile = path.join(cacheDir, outName);
  await esbuild.build({
    entryPoints: [path.join(root, entry)],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile,
    logLevel: 'silent',
  });
  return outfile;
};

const bundle = await compile('src/lib/quiz.ts', 'quiz.cjs');
const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);
const { buildQuestion, explainMistake } = require(bundle);

let optionProblems = 0;
let answerMissing = 0;
let duplicateOptions = 0;
for (let round = 0; round < 25; round += 1) {
  for (const p of preps) {
    const q = buildQuestion(p, preps);
    if (q.options.length !== 4) optionProblems += 1;
    if (!q.options.includes(q.answer)) answerMissing += 1;
    if (new Set(q.options).size !== q.options.length) duplicateOptions += 1;
  }
}
check('завжди рівно 4 варіанти', optionProblems === 0, `${optionProblems} випадків`);
check('правильна відповідь завжди присутня', answerMissing === 0, `${answerMissing} випадків`);
check('варіанти ніколи не дублюються', duplicateOptions === 0, `${duplicateOptions} випадків`);

const positions = new Map();
for (let round = 0; round < 400; round += 1) {
  const q = buildQuestion(preps[0], preps);
  const idx = q.options.indexOf(q.answer);
  positions.set(idx, (positions.get(idx) ?? 0) + 1);
}
check(
  'позиція правильної відповіді випадкова',
  [0, 1, 2, 3].every((i) => (positions.get(i) ?? 0) > 40),
  JSON.stringify([...positions.entries()]),
);
check(
  'пояснення помилки містить правильну відповідь',
  explainMistake(preps[0], 'Хибний варіант').includes(preps[0].diagnosis),
);

console.log('\n== Вибірка сесій ==');
const randomBundle = await compile('src/lib/random.ts', 'random.cjs');
const { sample, weightedSample, shuffle } = require(randomBundle);

let dupInSession = 0;
for (let i = 0; i < 300; i += 1) {
  const s = sample(preps, 20);
  if (s.length !== 20 || new Set(s.map((p) => p.id)).size !== 20) dupInSession += 1;
  const w = weightedSample(preps, 12, () => 1 + Math.random());
  if (w.length !== 12 || new Set(w.map((p) => p.id)).size !== 12) dupInSession += 1;
}
check('жодних повторів препарату в межах сесії', dupInSession === 0, `${dupInSession} сесій`);
check('shuffle зберігає всі елементи', shuffle(preps).length === preps.length);

const heavy = preps[5];
let heavyHits = 0;
for (let i = 0; i < 500; i += 1) {
  const picked = weightedSample(preps, 12, (p) => (p.id === heavy.id ? 20 : 1));
  if (picked.some((p) => p.id === heavy.id)) heavyHits += 1;
}
check(
  'препарати з більшою вагою випадають частіше',
  heavyHits > 300,
  `${heavyHits}/500 (очікувано >300)`,
);

console.log('\n== Збереження прогресу (LocalStorage) ==');
const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
};
const storageBundle = await compile('src/lib/storage.ts', 'storage.cjs');
const { loadProgress, saveProgress, clearProgress, emptyProgress } = require(storageBundle);

check('порожнє сховище -> чистий прогрес', loadProgress().sessions.length === 0);

const state = emptyProgress();
state.preps.p001 = { correct: 3, wrong: 1, seen: 4, known: true, review: false, lastSeen: 123 };
state.sessions.push({ id: 's1', mode: 'exam', date: 1, total: 20, correct: 17, durationMs: 5000 });
saveProgress(state);
const restored = loadProgress();
check(
  'прогрес переживає перезавантаження',
  restored.preps.p001.correct === 3 &&
    restored.preps.p001.known === true &&
    restored.sessions[0].correct === 17,
  JSON.stringify(restored.preps.p001),
);

store.set('pathoquiz:progress:v1', '{ це не json');
check('пошкоджені дані не ламають застосунок', loadProgress().sessions.length === 0);

store.set('pathoquiz:progress:v1', JSON.stringify({ preps: { p002: { correct: 'ні' } } }));
check('некоректні типи нормалізуються', loadProgress().preps.p002.correct === 0);

saveProgress(state);
clearProgress();
check('скидання прогресу очищає сховище', store.size === 0);

console.log(`\n${failures === 0 ? 'ВСІ ПЕРЕВІРКИ ПРОЙДЕНО' : `ПОМИЛОК: ${failures}`}\n`);
process.exit(failures === 0 ? 0 : 1);
