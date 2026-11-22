import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import PrepImage from '../components/PrepImage';
import PrepDetails from '../components/PrepDetails';
import { getPreparation, preparations, prepNumberLabel } from '../data/preparations';
import { useProgress } from '../context/ProgressContext';
import { accuracyOf } from '../lib/srs';

export default function PreparationDetail() {
  const { id = '' } = useParams();
  const prep = getPreparation(id);
  const { statsFor } = useProgress();
  const [shot, setShot] = useState(0);

  if (!prep) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-300">Такого препарату немає в базі.</p>
        <Link to="/catalog" className="btn-ghost mt-5">
          <ArrowLeft className="h-4 w-4" /> До каталогу
        </Link>
      </div>
    );
  }

  const pos = preparations.findIndex((p) => p.id === prep.id);
  const prev = pos > 0 ? preparations[pos - 1] : null;
  const next = pos < preparations.length - 1 ? preparations[pos + 1] : null;
  const s = statsFor(prep.id);
  const acc = accuracyOf(s);

  return (
    <motion.div
      key={prep.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/catalog" className="btn-ghost">
          <ArrowLeft className="h-4 w-4" /> До каталогу
        </Link>
        <div className="flex gap-2">
          {prev && (
            <Link to={`/catalog/${prev.id}`} className="btn-ghost px-3" aria-label="Попередній препарат">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          )}
          {next && (
            <Link to={`/catalog/${next.id}`} className="btn-ghost px-3" aria-label="Наступний препарат">
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="card p-3 sm:p-4">
            <PrepImage prep={prep} imageIndex={shot} heightClass="h-[340px] sm:h-[520px]" />
          </div>
          {prep.images.length > 1 && (
            <div className="flex gap-2">
              {prep.images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setShot(i)}
                  className={`overflow-hidden rounded-xl border transition-colors ${
                    i === shot ? 'border-mint-400/70' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <PrepImage
                    prep={prep}
                    imageIndex={i}
                    heightClass="h-20 w-28"
                    rounded="rounded-none"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5 sm:p-6">
            <p className="label">{prepNumberLabel(prep)} · {prep.organ}</p>
            <h1 className="mt-1.5 text-2xl font-extrabold leading-tight sm:text-3xl">
              {prep.diagnosis}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="chip">переглядів: {s.seen}</span>
              <span className="chip text-mint-300">вірно: {s.correct}</span>
              <span className="chip text-rose-300">помилок: {s.wrong}</span>
              {acc !== null && <span className="chip text-violet-300">точність {acc}%</span>}
              {s.known && <span className="chip text-emerald-300">знаю</span>}
              {s.review && <span className="chip text-amber-300">потрібно повторити</span>}
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <PrepDetails prep={prep} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
