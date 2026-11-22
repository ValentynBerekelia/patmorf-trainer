import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Brain,
  CheckCircle2,
  GraduationCap,
  Layers,
  Microscope,
  Percent,
  Play,
  Target,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useProgress } from '../context/ProgressContext';
import { preparations } from '../data/preparations';

const MODES = [
  {
    to: '/quiz',
    icon: Brain,
    title: 'Вгадай препарат',
    text: 'Зображення + 4 варіанти назви. Миттєвий розбір після кожної відповіді.',
    accent: 'from-mint-400/20',
  },
  {
    to: '/cards',
    icon: Layers,
    title: 'Повторення',
    text: 'Картки з 3D-перевертанням: «Знаю» / «Потрібно повторити».',
    accent: 'from-violet-400/20',
  },
  {
    to: '/exam',
    icon: GraduationCap,
    title: 'Складний іспит',
    text: '20 питань поспіль, без підказок. Результат — тільки в кінці.',
    accent: 'from-rose-400/20',
  },
  {
    to: '/weak',
    icon: Target,
    title: 'Слабкі місця',
    text: 'Тільки ті препарати, на яких ви найчастіше помиляєтесь.',
    accent: 'from-amber-400/20',
  },
];

export default function Home() {
  const { totals } = useProgress();

  return (
    <div className="space-y-10">
      <section className="card relative overflow-hidden p-7 sm:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-mint-500/15 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-2xl"
        >
          <span className="chip border-mint-400/30 bg-mint-500/10 text-mint-200">
            <Microscope className="h-3.5 w-3.5" />
            {preparations.length} препаратів з вашого PDF
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Patho
            <span className="bg-gradient-to-r from-mint-300 via-mint-400 to-violet-400 bg-clip-text text-transparent">
              Quiz
            </span>
          </h1>
          <p className="mt-4 text-lg text-slate-300 sm:text-xl">Перевір свої знання з патоморфології</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            Усі зображення, назви та описи взяті з файлу «Патоморфологія препарати.pdf». Прогрес
            зберігається у вашому браузері — нічого не загубиться після перезавантаження.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/quiz" className="btn-primary">
              <Play className="h-4 w-4" />
              Почати навчання
            </Link>
            <Link to="/catalog" className="btn-ghost">
              <BookOpen className="h-4 w-4" />
              Переглянути всі препарати
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Microscope}
          label="Доступно препаратів"
          value={totals.total}
          hint="витягнуто з PDF"
          accent="mint"
          delay={0}
        />
        <StatCard
          icon={CheckCircle2}
          label="Пройдено препаратів"
          value={`${totals.studied} / ${totals.total}`}
          hint={`${totals.total ? Math.round((totals.studied / totals.total) * 100) : 0}% бази`}
          accent="violet"
          delay={0.06}
        />
        <StatCard
          icon={Percent}
          label="Правильних відповідей"
          value={`${totals.accuracy}%`}
          hint={`${totals.correct} правильних · ${totals.wrong} помилок`}
          accent="mint"
          delay={0.12}
        />
        <StatCard
          icon={Target}
          label="Потребують повторення"
          value={totals.review}
          hint={totals.review ? 'відкрийте режим «Слабкі місця»' : 'усе чисто'}
          accent={totals.review ? 'rose' : 'slate'}
          delay={0.18}
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold tracking-tight">Режими навчання</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {MODES.map(({ to, icon: Icon, title, text, accent }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link to={to} className="card card-hover group relative block overflow-hidden p-6">
                <div
                  aria-hidden
                  className={`absolute inset-0 bg-gradient-to-br ${accent} to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />
                <div className="relative flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-mint-300 transition-colors group-hover:text-violet-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{text}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
