import raw from './preparations.json';
import type { CategoryKey, Preparation, PreparationDataset } from '../types';

/**
 * Єдине джерело даних застосунку.
 * JSON згенеровано напряму з «Патоморфологія препарати.pdf» (41 сторінка),
 * зображення витягнуті з того самого PDF у public/preparations/.
 * Щоб додати нові препарати — достатньо дописати записи в preparations.json
 * та покласти файли зображень у public/preparations/. UI змінювати не треба.
 */
const dataset = raw as unknown as PreparationDataset;

export const preparations: Preparation[] = dataset.preparations;

export const categories = dataset.categories;

export const sourceName = dataset.source;

export const categoryOrder: CategoryKey[] = (
  ['tumors', 'circulation', 'inflammation', 'dystrophy', 'adaptation', 'necrosis', 'other'] as CategoryKey[]
).filter((key) => preparations.some((p) => p.category === key));

export const categoryLabel = (key: CategoryKey): string => categories[key] ?? key;

const byId = new Map(preparations.map((p) => [p.id, p]));

export const getPreparation = (id: string): Preparation | undefined => byId.get(id);

/** Повний URL зображення з урахуванням base (працює і в dev, і в build). */
export const imageUrl = (src: string): string => {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.endsWith('/') ? base : `${base}/`}${src}`;
};

/** Підпис препарату: «№ 2 · Фрагмент аорти» або «Без номера · Яєчник». */
export const prepLabel = (p: Preparation): string =>
  `${p.number ? `№ ${p.number}` : 'Без номера'} · ${p.organ}`;

export const prepNumberLabel = (p: Preparation): string =>
  p.number ? `№ ${p.number}` : 'Без номера';
