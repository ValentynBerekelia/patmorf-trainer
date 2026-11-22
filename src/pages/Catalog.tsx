import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Search, SlidersHorizontal, X } from 'lucide-react';
import PrepImage from '../components/PrepImage';
import {
  categoryLabel,
  categoryOrder,
  preparations,
  prepNumberLabel,
} from '../data/preparations';
import type { CategoryKey } from '../types';
import { useProgress } from '../context/ProgressContext';

type Filter = CategoryKey | 'all';

const normalize = (s: string) => s.toLowerCase().replace(/[’'`ʼ]/g, "'").trim();

export default function Catalog() {
  const { statsFor } = useProgress();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([['all', preparations.length]]);
    for (const key of categoryOrder) {
      map.set(key, preparations.filter((p) => p.category === key).length);
    }
    return map;
  }, []);

  const results = useMemo(() => {
    const q = normalize(query);
    return preparations.filter((p) => {
      if (filter !== 'all' && p.category !== filter) return false;
      if (!q) return true;
      const haystack = normalize(
        [p.diagnosis, p.organ, p.number ?? '', p.description.organ, p.dx.main].join(' '),
      );
      return haystack.includes(q);
    });
  }, [query, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Каталог препаратів</h1>
        <p className="text-sm text-slate-400">
          Усі {preparations.length} препаратів із PDF. Пошук за назвою, органом або номером.
        </p>
      </div>

      <div className="card space-y-4 p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Напр.: лейоміома, печінка, 552…"
            className="w-full rounded-xl border border-white/10 bg-ink-950/70 py-3 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:border-mint-400/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Очистити пошук"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          {(['all', ...categoryOrder] as Filter[]).map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-mint-400/60 bg-mint-500/15 text-mint-200'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {key === 'all' ? 'Усі' : categoryLabel(key)}
                <span className="ml-1.5 opacity-60">{counts.get(key) ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-slate-400">
        Знайдено: <span className="font-semibold text-slate-200">{results.length}</span>
      </p>

      {results.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          Нічого не знайдено. Спробуйте інший запит.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p, i) => {
            const s = statsFor(p.id);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.015, 0.25) }}
              >
                <Link to={`/catalog/${p.id}`} className="card card-hover block h-full overflow-hidden">
                  <div className="relative">
                    <PrepImage prep={p} heightClass="h-48" rounded="rounded-none" />
                    {s.known && (
                      <span className="absolute right-2 top-2 z-20 grid h-7 w-7 place-items-center rounded-full bg-emerald-500/90 text-ink-950">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="label">{prepNumberLabel(p)}</p>
                      <span className="text-[10px] uppercase tracking-wider text-violet-300/80">
                        {categoryLabel(p.category)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold leading-snug text-white">
                      {p.diagnosis}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{p.organ}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
