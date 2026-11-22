import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'mint' | 'violet' | 'slate' | 'rose';
  delay?: number;
}

const ACCENTS: Record<NonNullable<Props['accent']>, string> = {
  mint: 'from-mint-400/20 to-mint-400/0 text-mint-300',
  violet: 'from-violet-400/20 to-violet-400/0 text-violet-300',
  slate: 'from-slate-400/[0.15] to-slate-400/0 text-slate-300',
  rose: 'from-rose-400/20 to-rose-400/0 text-rose-300',
};

export default function StatCard({ icon: Icon, label, value, hint, accent = 'mint', delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="card card-hover relative overflow-hidden p-5"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${ACCENTS[accent]} opacity-60`} aria-hidden />
      <div className="relative">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${ACCENTS[accent].split(' ').pop()}`} />
          <span className="label">{label}</span>
        </div>
        <p className="mt-3 text-3xl font-extrabold tracking-tight text-white">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </div>
    </motion.div>
  );
}
