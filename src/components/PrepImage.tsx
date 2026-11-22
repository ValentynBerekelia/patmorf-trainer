import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { Preparation } from '../types';
import { imageUrl } from '../data/preparations';

/** Максимальне збільшення зображення відносно його реального розміру в PDF. */
const MAX_UPSCALE = 2.4;

interface Props {
  prep: Preparation;
  /** Який із кількох знімків препарату показати */
  imageIndex?: number;
  className?: string;
  /** Висота контейнера (tailwind-класи) */
  heightClass?: string;
  rounded?: string;
}

/**
 * Зображення препарату: завжди object-contain на темному тлі,
 * тому кадр ніколи не обрізається і не спотворюється.
 */
export default function PrepImage({
  prep,
  imageIndex = 0,
  className = '',
  heightClass = 'h-72 sm:h-96',
  rounded = 'rounded-2xl',
}: Props) {
  const [failed, setFailed] = useState(false);
  const image = prep.images[imageIndex] ?? prep.images[0];

  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden border border-white/10 bg-ink-950/80 ${rounded} ${heightClass} ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 40%, rgba(124,92,255,0.10), transparent 70%)',
        }}
      />
      {image && !failed ? (
        <img
          src={imageUrl(image.src)}
          alt={`Макропрепарат: ${prep.organ}`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="relative z-10 h-full w-full object-contain p-2"
          style={{
            // object-contain ніколи не обрізає кадр; збільшення обмежене 2.4×,
            // щоб дрібні знімки з PDF заповнювали блок, але не «милилися».
            maxWidth: `${Math.round(image.width * MAX_UPSCALE)}px`,
            maxHeight: `${Math.round(image.height * MAX_UPSCALE)}px`,
          }}
        />
      ) : (
        <div className="relative z-10 flex flex-col items-center gap-2 text-slate-500">
          <ImageOff className="h-8 w-8" />
          <span className="text-xs">Зображення недоступне</span>
        </div>
      )}
    </div>
  );
}
