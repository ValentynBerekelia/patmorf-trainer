import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { Preparation, SessionMode } from "../types";
import { buildQuestions, explainMistake } from "../lib/quiz";
import PrepImage from "./PrepImage";
import PrepDetails from "./PrepDetails";
import { useProgress } from "../context/ProgressContext";
import { prepNumberLabel } from "../data/preparations";

interface Props {
  /** Черга препаратів сесії — без повторів */
  queue: Preparation[];
  /** З чого беруться відволікачі (зазвичай уся база) */
  pool: Preparation[];
  mode: SessionMode;
  title: string;
  subtitle: string;
  onRestart: () => void;
}

export default function QuizRunner({
  queue,
  pool,
  mode,
  title,
  subtitle,
  onRestart,
}: Props) {
  const { recordAnswer, addSession } = useProgress();
  const questions = useMemo(() => buildQuestions(queue, pool), [queue, pool]);

  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());
  const saved = useRef(false);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const answered = chosen !== null;
  const isCorrect = answered && chosen === question?.answer;

  const finish = useCallback(
    (finalCorrect: number) => {
      if (!saved.current) {
        saved.current = true;
        addSession({
          mode,
          total: questions.length,
          correct: finalCorrect,
          durationMs: Date.now() - startedAt.current,
        });
      }
      setFinished(true);
    },
    [addSession, mode, questions.length],
  );

  const choose = (option: string) => {
    if (answered || !question) return;
    setChosen(option);
    const ok = option === question.answer;
    if (ok) setCorrectCount((c) => c + 1);
    recordAnswer(question.prep.id, ok);
  };

  const next = () => {
    if (isLast) {
      finish(correctCount);
      return;
    }
    setIndex((i) => i + 1);
    setChosen(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // клавіатура: 1–4 вибір, Enter / → далі
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished || !question) return;
      if (!answered && ["1", "2", "3", "4"].includes(e.key)) {
        const opt = question.options[Number(e.key) - 1];
        if (opt) choose(opt);
      } else if (answered && (e.key === "Enter" || e.key === "ArrowRight")) {
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!questions.length) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-300">Немає препаратів для цього режиму.</p>
        <Link to="/" className="btn-ghost mt-5">
          <Home className="h-4 w-4" /> На головну
        </Link>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="card mx-auto max-w-xl p-8 text-center sm:p-12"
      >
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-mint-400 to-violet-500 text-ink-950">
          <Sparkles className="h-8 w-8" />
        </span>
        <h2 className="mt-6 text-2xl font-extrabold">Сесію завершено</h2>
        <p className="mt-2 text-slate-400">{title}</p>
        <div className="mt-7 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-extrabold text-mint-300">
              {correctCount}
            </p>
            <p className="label mt-1">Правильно</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-extrabold text-rose-300">
              {questions.length - correctCount}
            </p>
            <p className="label mt-1">Помилок</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-extrabold text-violet-300">{pct}%</p>
            <p className="label mt-1">Успішність</p>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              saved.current = false;
              startedAt.current = Date.now();
              setIndex(0);
              setChosen(null);
              setCorrectCount(0);
              setFinished(false);
              onRestart();
            }}
          >
            <RotateCcw className="h-4 w-4" /> Ще раз
          </button>
          <Link to="/" className="btn-ghost">
            <Home className="h-4 w-4" /> На головну
          </Link>
        </div>
      </motion.div>
    );
  }

  const progress = ((index + (answered ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
            <p className="text-sm text-slate-400">{subtitle}</p>
          </div>
          <p className="text-sm font-semibold text-slate-300">
            Питання {index + 1} / {questions.length}
            <span className="ml-3 text-mint-300">✓ {correctCount}</span>
          </p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-mint-400 to-violet-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.prep.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"
        >
          <div className="card relative self-start overflow-hidden p-3 sm:p-4">
            <div className="relative">
              <PrepImage
                prep={question.prep}
                heightClass="h-[300px] sm:h-[440px]"
              />
              <AnimatePresence>
                {isCorrect && (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 16,
                      }}
                      className="flex flex-col items-center gap-3 rounded-3xl bg-emerald-500/20 px-10 py-8 backdrop-blur-md ring-1 ring-emerald-400/50"
                    >
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.25, 1] }}
                        transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                        className="grid h-20 w-20 place-items-center rounded-full bg-emerald-400 text-ink-950 shadow-[0_0_60px_rgba(52,211,153,0.7)]"
                      >
                        <CheckCircle2 className="h-11 w-11" strokeWidth={2.5} />
                      </motion.span>
                      <p className="text-2xl font-extrabold text-emerald-50">
                        Правильно!
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="mt-3 text-center text-xs text-slate-500">
              {answered
                ? prepNumberLabel(question.prep)
                : "Номер препарату відкриється після відповіді"}
            </p>
          </div>

          <div className="space-y-3">
            <div className="card p-5">
              <p className="label">Питання</p>
              <h2 className="mt-1 text-xl font-bold">Який це препарат?</h2>
              <div className="mt-4 space-y-2.5">
                {question.options.map((option, i) => {
                  const right = option === question.answer;
                  const picked = option === chosen;
                  let cls =
                    "w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200";
                  if (!answered) {
                    cls +=
                      " border-white/10 bg-white/5 hover:border-mint-400/50 hover:bg-white/10 active:scale-[0.99]";
                  } else if (right) {
                    cls +=
                      " border-emerald-400/60 bg-emerald-500/15 text-emerald-100";
                  } else if (picked) {
                    cls += " border-rose-400/60 bg-rose-500/15 text-rose-100";
                  } else {
                    cls += " border-white/5 bg-white/[0.02] text-slate-500";
                  }
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={answered}
                      onClick={() => choose(option)}
                      className={cls}
                    >
                      <span className="flex items-start gap-3">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-white/15 text-[11px] font-bold text-slate-400">
                          {i + 1}
                        </span>
                        <span className="flex-1">{option}</span>
                        {answered && right && (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                        )}
                        {answered && picked && !right && (
                          <XCircle className="h-5 w-5 shrink-0 text-rose-300" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!answered && (
                <p className="mt-3 text-xs text-slate-500">
                  Підказка: можна натискати клавіші 1–4
                </p>
              )}
            </div>

            <AnimatePresence>
              {answered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div
                    className={`card p-5 ${
                      isCorrect ? "border-emerald-400/40" : "border-rose-400/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-300" />
                      )}
                      <p
                        className={`font-bold ${isCorrect ? "text-emerald-200" : "text-rose-200"}`}
                      >
                        {isCorrect ? "Правильно!" : "Неправильно"}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      {isCorrect
                        ? `Це ${question.prep.diagnosis.toLowerCase()} (${prepNumberLabel(question.prep)}).`
                        : explainMistake(question.prep, chosen as string)}
                    </p>
                  </div>

                  <div className="card p-5">
                    <p className="label mb-3">Опис препарату з PDF</p>
                    <PrepDetails prep={question.prep} />
                  </div>

                  <button
                    type="button"
                    onClick={next}
                    className="btn-primary w-full"
                  >
                    {isLast ? "Завершити сесію" : "Наступний препарат"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
