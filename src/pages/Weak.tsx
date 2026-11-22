import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ShieldCheck, Target } from 'lucide-react';
import QuizRunner from '../components/QuizRunner';
import PrepImage from '../components/PrepImage';
import { preparations, prepNumberLabel } from '../data/preparations';
import { accuracyOf, sortWeak } from '../lib/srs';
import { useProgress } from '../context/ProgressContext';
import { shuffle } from '../lib/random';

const MAX_IN_SESSION = 15;

/** Режим 4 — «Слабкі місця»: препарати, на яких користувач помиляється найчастіше. */
export default function Weak() {
  const { statsFor } = useProgress();
  const weak = useMemo(() => sortWeak(preparations, statsFor), [statsFor]);
  const [running, setRunning] = useState(false);
  const [queue, setQueue] = useState<typeof preparations>([]);

  const start = () => {
    setQueue(shuffle(weak.slice(0, MAX_IN_SESSION)));
    setRunning(true);
  };

  if (running && queue.length) {
    return (
      <QuizRunner
        queue={queue}
        pool={preparations}
        mode="weak"
        title="Слабкі місця"
        subtitle={`${queue.length} препаратів, на яких ви помилялися`}
        onRestart={() => setQueue(shuffle(sortWeak(preparations, statsFor).slice(0, MAX_IN_SESSION)))}
      />
    );
  }

  if (!weak.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mx-auto max-w-lg p-10 text-center"
      >
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-mint-400 to-emerald-400 text-ink-950">
          <ShieldCheck className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold">Слабких місць поки немає</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Сюди потрапляють препарати, на яких ви помилилися у квізі чи іспиті, або які позначили
          «Потрібно повторити» на картці.
        </p>
        <Link to="/quiz" className="btn-primary mt-7">
          <Play className="h-4 w-4" /> Почати квіз
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <Target className="h-6 w-6 text-amber-300" /> Слабкі місця
          </h1>
          <p className="text-sm text-slate-400">
            {weak.length} препаратів потребують уваги. Відсортовано за кількістю помилок.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={start}>
          <Play className="h-4 w-4" /> Тренувати ({Math.min(weak.length, MAX_IN_SESSION)})
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {weak.map((p, i) => {
          const s = statsFor(p.id);
          const acc = accuracyOf(s);
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.3) }}
            >
              <Link to={`/catalog/${p.id}`} className="card card-hover block overflow-hidden">
                <PrepImage prep={p} heightClass="h-44" rounded="rounded-none" />
                <div className="p-4">
                  <p className="label">{prepNumberLabel(p)}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-white">{p.diagnosis}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{p.organ}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="chip text-rose-300">помилок: {s.wrong}</span>
                    {s.correct > 0 && <span className="chip text-mint-300">вірно: {s.correct}</span>}
                    {acc !== null && <span className="chip">{acc}%</span>}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
