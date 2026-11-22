import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftRight,
  Check,
  Home,
  Layers,
  RotateCcw,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import PrepImage from '../components/PrepImage';
import PrepDetails from '../components/PrepDetails';
import { preparations, prepNumberLabel } from '../data/preparations';
import { weightedSample } from '../lib/random';
import { weightFor } from '../lib/srs';
import { useProgress } from '../context/ProgressContext';

const DECK_SIZE = 20;

/** Режим 2 — «Повторення»: інтерактивні картки з 3D-перевертанням. */
export default function Flashcards() {
  const { statsFor, markKnown, markForReview, addSession } = useProgress();

  const build = useCallback(
    () => weightedSample(preparations, DECK_SIZE, (p) => weightFor(statsFor(p.id))),
    [statsFor],
  );

  const [deck, setDeck] = useState(build);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [done, setDone] = useState(false);

  const prep = deck[index];

  const advance = (wasKnown: boolean) => {
    if (!prep) return;
    if (wasKnown) {
      markKnown(prep.id);
      setKnown((k) => k + 1);
    } else {
      markForReview(prep.id);
    }
    if (index === deck.length - 1) {
      addSession({
        mode: 'flashcards',
        total: deck.length,
        correct: known + (wasKnown ? 1 : 0),
        durationMs: 0,
      });
      setDone(true);
      return;
    }
    setFlipped(false);
    // даємо картці закритися перед зміною змісту
    window.setTimeout(() => setIndex((i) => i + 1), 180);
  };

  const restart = () => {
    setDeck(build());
    setIndex(0);
    setFlipped(false);
    setKnown(0);
    setDone(false);
  };

  if (!deck.length) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-300">Немає препаратів для повторення.</p>
      </div>
    );
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card mx-auto max-w-xl p-8 text-center sm:p-12"
      >
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-mint-400 to-violet-500 text-ink-950">
          <Sparkles className="h-8 w-8" />
        </span>
        <h2 className="mt-6 text-2xl font-extrabold">Колоду пройдено</h2>
        <p className="mt-2 text-slate-400">
          Знаю: <span className="font-bold text-mint-300">{known}</span> · Повторити:{' '}
          <span className="font-bold text-amber-300">{deck.length - known}</span>
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Препарати, позначені «Потрібно повторити», частіше з’являтимуться наступного разу.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={restart}>
            <RotateCcw className="h-4 w-4" /> Нова колода
          </button>
          <Link to="/" className="btn-ghost">
            <Home className="h-4 w-4" /> На головну
          </Link>
        </div>
      </motion.div>
    );
  }

  const stats = statsFor(prep.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <Layers className="h-6 w-6 text-violet-300" /> Повторення
          </h1>
          <p className="text-sm text-slate-400">
            Натисніть на картку, щоб перевернути. Оцініть себе чесно — це впливає на черговість.
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-300">
          Картка {index + 1} / {deck.length}
          <span className="ml-3 text-mint-300">✓ {known}</span>
        </p>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-400 to-mint-400"
          animate={{ width: `${((index + 1) / deck.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={prep.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28 }}
        >
          <div className="flip-scene mx-auto min-h-[620px] w-full max-w-3xl sm:min-h-[720px]">
            <div className={`flip-inner min-h-[620px] sm:min-h-[720px] ${flipped ? 'is-flipped' : ''}`}>
              {/* ЛИЦЬОВА СТОРОНА */}
              <button
                type="button"
                onClick={() => setFlipped(true)}
                aria-label="Перевернути картку"
                className="flip-face card flex w-full cursor-pointer flex-col items-center gap-4 p-5 text-left sm:p-7"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="chip border-mint-400/30 bg-mint-500/10 text-mint-200">
                    {prepNumberLabel(prep)}
                  </span>
                  {stats.review && <span className="chip text-amber-300">потрібно повторити</span>}
                </div>
                <PrepImage prep={prep} heightClass="w-full flex-1 min-h-[260px]" />
                <div className="mt-auto text-center">
                  <p className="text-lg font-bold text-white sm:text-xl">
                    Що зображено на препараті?
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Натисніть, щоб побачити відповідь
                  </p>
                </div>
              </button>

              {/* ЗВОРОТНА СТОРОНА */}
              <div className="flip-face flip-face--back card flex w-full flex-col p-5 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="label">{prepNumberLabel(prep)} · {prep.organ}</p>
                    <h2 className="mt-1 text-xl font-extrabold leading-tight text-white sm:text-2xl">
                      {prep.diagnosis}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFlipped(false)}
                    className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10"
                    aria-label="Перевернути назад"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative mt-4 min-h-0 flex-1">
                  <div className="thin-scroll h-full overflow-y-auto pr-1">
                    <PrepDetails prep={prep} compact />
                  </div>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-ink-900 to-transparent"
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => advance(true)}
                    className="btn border border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
                  >
                    <Check className="h-4 w-4" /> Знаю
                  </button>
                  <button
                    type="button"
                    onClick={() => advance(false)}
                    className="btn border border-amber-400/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25"
                  >
                    <RotateCcw className="h-4 w-4" /> Потрібно повторити
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
