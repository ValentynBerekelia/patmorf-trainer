import { AlertTriangle } from 'lucide-react';
import type { Preparation } from '../types';
import { categoryLabel } from '../data/preparations';

interface Props {
  prep: Preparation;
  /** Компактний вигляд (для зворотного боку картки) */
  compact?: boolean;
}

function Row({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <div className="border-t border-white/[0.08] py-2.5 first:border-t-0 first:pt-0">
      <p className="label">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-200">{text}</p>
    </div>
  );
}

/** Повний опис препарату — дослівно з PDF (пункти 1–6 алгоритму опису). */
export default function PrepDetails({ prep, compact = false }: Props) {
  return (
    <div className={compact ? 'text-[13px]' : ''}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="chip border-violet-400/30 bg-violet-500/10 text-violet-200">
          {categoryLabel(prep.category)}
        </span>
        <span className="chip">Стор. PDF: {prep.pdfPage}</span>
        {prep.images.length > 1 && <span className="chip">{prep.images.length} знімки</span>}
      </div>

      <Row title="1 · Орган / тканина" text={prep.description.organ} />
      <Row title="2 · Локалізація процесу" text={prep.description.localization} />
      <Row title="3 · Форма осередку" text={prep.description.shape} />
      <Row title="4 · Розміри осередку" text={prep.description.size} />
      <Row title="5 · Внутрішня структура (за чим упізнати)" text={prep.description.structure} />

      <div className="mt-4 rounded-xl border border-mint-400/25 bg-mint-500/[0.08] p-3.5">
        <p className="label text-mint-300">6.А · Основний патологічний процес</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-100">{prep.dx.main}</p>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
          <p className="label">6.Б · Видимі неозброєним оком</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{prep.dx.visible}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
          <p className="label">6.В · Вірогідні, але невидимі</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{prep.dx.probable}</p>
        </div>
      </div>

      {prep.needsReview && (
        <div className="mt-3 flex gap-2.5 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-xs leading-relaxed text-amber-100">
            <span className="font-semibold">Потребує ручної перевірки. </span>
            {prep.needsReview}
          </p>
        </div>
      )}
    </div>
  );
}
