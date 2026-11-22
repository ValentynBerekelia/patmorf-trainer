import { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Home,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react';
import PrepImage from '../components/PrepImage';
import PrepDetails from '../components/PrepDetails';
import { preparations, prepNumberLabel } from '../data/preparations';
import { sample } from '../lib/random';
import { buildQuestions } from '../lib/quiz';
import { useProgress } from '../context/ProgressContext';

const EXAM_SIZE = 20;

/** Режим 3 — «Складний іспит»: 20 питань, без підказок до кінця. */
export default function Exam() {
  const { recordAnswer, addSession } = useProgress();

  const buildQueue = useCallback(() => sample(preparations, EXAM_SIZE), []);
  const [queue, setQueue] = useState(buildQueue);
  const questions = useMemo(() => buildQuestions(queue, preparations), [queue]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(() => questions.map(() => null));
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());

  const question = questions[index];
  const chosen = answers[index];
  const isLast = index === questions.length - 1;

  const pick = (option: string) => {
    setAnswers((prev) => {
      const next = prev.slice();
      next[index] = option;
      return next;
    });
  };

  const submit = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      const ok = answers[i] === q.answer;
      if (ok) correct += 1;
      recordAnswer(q.prep.id, ok);
    });
    addSession({
      mode: 'exam',
      total: questions.length,
      correct,
      durationMs: Date.now() - startedAt.current,
    });
    setFinished(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const restart = () => {
    const q = buildQueue();
    setQueue(q);
    setAnswers(q.map(() => null));
    setIndex(0);
    setFinished(false);
    startedAt.current = Date.now();
  };

  if (!questions.length) {
    return <div className="card p-10 text-center text-slate-300">Немає препаратів для іспиту.</div>;
  }

  if (finished) {
    const correct = questions.filter((q, i) => answers[i] === q.answer).length;
    const pct = Math.round((correct / questions.length) * 100);
    const wrongOnes = questions
      .map((q, i) => ({ q, chosen: answers[i] }))
      .filter(({ q, chosen: c }) => c !== q.answer);

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="card p-8 text-center sm:p-10"
        >
          <span
            className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl text-ink-950 ${
              pct >= 75
                ? 'bg-gradient-to-br from-mint-400 to-emerald-400'
                : 'bg-gradient-to-br from-amber-300 to-rose-400'
            }`}
          >
            <Trophy className="h-8 w-8" />
          </span>
          <h2 className="mt-6 text-3xl font-extrabold">Результат: {pct}%</h2>
          <p className="mt-2 text-slate-400">
            {correct} правильних із {questions.length}
          </p>

          <div className="mt-7 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-extrabold text-mint-300">{correct}</p>
              <p className="label mt-1">Правильно</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-extrabold text-rose-300">{questions.length - correct}</p>
              <p className="label mt-1">Помилок</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-extrabold text-violet-300">
                {Math.round((Date.now() - startedAt.current) / 60000)} хв
              </p>
              <p className="label mt-1">Витрачено</p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn-primary" onClick={restart}>
              <RotateCcw className="h-4 w-4" /> Новий іспит
            </button>
            <Link to="/weak" className="btn-ghost">
              Опрацювати помилки
            </Link>
            <Link to="/" className="btn-ghost">
              <Home className="h-4 w-4" /> На головну
            </Link>
          </div>
        </motion.div>

        {wrongOnes.length > 0 && (
          <section>
            <h3 className="mb-3 text-lg font-bold">Розбір помилок ({wrongOnes.length})</h3>
            <div className="space-y-4">
              {wrongOnes.map(({ q, chosen: c }) => (
                <div key={q.prep.id} className="card grid gap-4 p-5 md:grid-cols-[220px_minmax(0,1fr)]">
                  <PrepImage prep={q.prep} heightClass="h-48" />
                  <div>
                    <p className="label">{prepNumberLabel(q.prep)} · {q.prep.organ}</p>
                    <p className="mt-1.5 flex items-center gap-2 text-sm text-rose-200">
                      <XCircle className="h-4 w-4 shrink-0" /> Ваша відповідь: {c ?? '— не обрано —'}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-emerald-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0" /> Правильно: {q.answer}
                    </p>
                    <div className="mt-3">
                      <PrepDetails prep={q.prep} compact />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const answeredCount = answers.filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <GraduationCap className="h-6 w-6 text-rose-300" /> Складний іспит
          </h1>
          <p className="text-sm text-slate-400">
            {EXAM_SIZE} питань у випадковому порядку. Правильні відповіді — тільки після завершення.
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-300">
          {index + 1} / {questions.length} · відповіли {answeredCount}
        </p>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-rose-400 to-violet-400"
          animate={{ width: `${((index + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.prep.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"
        >
          <div className="card p-3 sm:p-4">
            <PrepImage prep={question.prep} heightClass="h-[300px] sm:h-[440px]" />
          </div>

          <div className="card p-5">
            <p className="label">Питання {index + 1}</p>
            <h2 className="mt-1 text-xl font-bold">Який це препарат?</h2>
            <div className="mt-4 space-y-2.5">
              {question.options.map((option, i) => {
                const picked = option === chosen;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => pick(option)}
                    className={`w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200 ${
                      picked
                        ? 'border-violet-400/70 bg-violet-500/20 text-white'
                        : 'border-white/10 bg-white/5 hover:border-violet-400/40 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-white/15 text-[11px] font-bold text-slate-400">
                        {i + 1}
                      </span>
                      <span className="flex-1">{option}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-ghost"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                Назад
              </button>
              {isLast ? (
                <button type="button" className="btn-primary flex-1" onClick={submit}>
                  Завершити іспит <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary flex-1"
                  onClick={() => setIndex((i) => i + 1)}
                >
                  Далі <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Можна повертатися до попередніх питань і змінювати відповідь.
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
