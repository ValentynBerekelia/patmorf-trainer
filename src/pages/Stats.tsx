import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Brain,
  CheckCircle2,
  GraduationCap,
  Layers,
  Percent,
  Target,
  Trash2,
  XCircle,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useProgress } from '../context/ProgressContext';
import { categoryLabel, categoryOrder, preparations } from '../data/preparations';
import type { SessionMode } from '../types';

const MODE_META: Record<SessionMode, { label: string; icon: typeof Brain }> = {
  quiz: { label: 'Вгадай препарат', icon: Brain },
  flashcards: { label: 'Повторення', icon: Layers },
  exam: { label: 'Складний іспит', icon: GraduationCap },
  weak: { label: 'Слабкі місця', icon: Target },
};

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function Stats() {
  const { totals, state, statsFor, reset } = useProgress();
  const [confirming, setConfirming] = useState(false);

  const byCategory = useMemo(
    () =>
      categoryOrder.map((key) => {
        const list = preparations.filter((p) => p.category === key);
        const studied = list.filter((p) => statsFor(p.id).seen > 0).length;
        const correct = list.reduce((a, p) => a + statsFor(p.id).correct, 0);
        const wrong = list.reduce((a, p) => a + statsFor(p.id).wrong, 0);
        const answered = correct + wrong;
        return {
          key,
          label: categoryLabel(key),
          total: list.length,
          studied,
          accuracy: answered ? Math.round((correct / answered) * 100) : null,
        };
      }),
    [statsFor],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <BarChart3 className="h-6 w-6 text-mint-300" /> Статистика та прогрес
        </h1>
        <p className="text-sm text-slate-400">
          Усі дані зберігаються локально у вашому браузері (LocalStorage).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Правильних" value={totals.correct} accent="mint" />
        <StatCard icon={XCircle} label="Помилок" value={totals.wrong} accent="rose" />
        <StatCard
          icon={Percent}
          label="Успішність"
          value={`${totals.accuracy}%`}
          hint={`${totals.answered} відповідей`}
          accent="violet"
        />
        <StatCard
          icon={Target}
          label="На повторення"
          value={totals.review}
          hint={`вивчено ${totals.known}`}
          accent={totals.review ? 'rose' : 'slate'}
        />
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold">Покриття бази</h2>
        <p className="mt-1 text-sm text-slate-400">
          Пройдено {totals.studied} із {totals.total} препаратів
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-mint-400 to-violet-400"
            initial={{ width: 0 }}
            animate={{ width: `${totals.total ? (totals.studied / totals.total) * 100 : 0}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <div className="mt-6 space-y-3">
          {byCategory.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-200">{c.label}</span>
                <span className="text-slate-400">
                  {c.studied}/{c.total}
                  {c.accuracy !== null && <span className="ml-2 text-mint-300">{c.accuracy}%</span>}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400/80 to-mint-400/80"
                  initial={{ width: 0 }}
                  animate={{ width: `${c.total ? (c.studied / c.total) * 100 : 0}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold">Історія тренувань</h2>
        {state.sessions.length === 0 ? (
          <div className="mt-3">
            <p className="text-sm text-slate-400">Ще немає завершених сесій.</p>
            <Link to="/quiz" className="btn-ghost mt-3">
              Почати квіз
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-white/[0.08]">
            {state.sessions.map((s) => {
              const meta = MODE_META[s.mode] ?? MODE_META.quiz;
              const Icon = meta.icon;
              const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
              return (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-violet-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">{meta.label}</p>
                    <p className="text-xs text-slate-500">{fmtDate(s.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-100">
                      {s.correct} / {s.total}
                    </p>
                    <p
                      className={`text-xs font-semibold ${
                        pct >= 75 ? 'text-mint-300' : pct >= 50 ? 'text-amber-300' : 'text-rose-300'
                      }`}
                    >
                      {pct}%
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card border-rose-400/20 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Скидання прогресу</h2>
        <p className="mt-1 text-sm text-slate-400">
          Видалить усю статистику, позначки «Знаю» та історію сесій. Дію не можна скасувати.
        </p>
        {confirming ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn border border-rose-400/50 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30"
              onClick={() => {
                reset();
                setConfirming(false);
              }}
            >
              <Trash2 className="h-4 w-4" /> Так, видалити все
            </button>
            <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>
              Скасувати
            </button>
          </div>
        ) : (
          <button type="button" className="btn-ghost mt-4" onClick={() => setConfirming(true)}>
            <Trash2 className="h-4 w-4" /> Скинути прогрес
          </button>
        )}
      </section>
    </div>
  );
}
