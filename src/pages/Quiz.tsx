import { useCallback, useState } from 'react';
import QuizRunner from '../components/QuizRunner';
import { preparations } from '../data/preparations';
import { weightedSample } from '../lib/random';
import { weightFor } from '../lib/srs';
import { useProgress } from '../context/ProgressContext';

const SESSION_SIZE = 12;

/** Режим 1 — «Вгадай препарат»: зображення + 4 варіанти, миттєвий розбір. */
export default function Quiz() {
  const { statsFor } = useProgress();

  const build = useCallback(
    () => weightedSample(preparations, SESSION_SIZE, (p) => weightFor(statsFor(p.id))),
    [statsFor],
  );

  // черга будується один раз на сесію -> жодного повтору препарату всередині сесії
  const [queue, setQueue] = useState(build);

  return (
    <QuizRunner
      queue={queue}
      pool={preparations}
      mode="quiz"
      title="Вгадай препарат"
      subtitle={`${queue.length} препаратів за сесію · без повторів · відповідь одразу`}
      onRestart={() => setQueue(build())}
    />
  );
}
