/*
 * Восковая печать — центральный акцент титульной карточки и разделов.
 * SVG, чтобы масштабировалось и красилось через currentColor.
 */
type Props = {
  size?: number;
  monogram?: string;
  className?: string;
};

export function WaxSeal({ size = 88, monogram = 'U', className }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`Wax seal ${monogram}`}
      className={className}
    >
      <defs>
        <radialGradient id="wax-body" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="var(--color-ember-400)" />
          <stop offset="55%" stopColor="var(--color-ember-600)" />
          <stop offset="100%" stopColor="var(--color-blood-600)" />
        </radialGradient>
        <radialGradient id="wax-highlight" cx="40%" cy="35%" r="30%">
          <stop offset="0%" stopColor="rgba(255,220,180,0.55)" />
          <stop offset="100%" stopColor="rgba(255,220,180,0)" />
        </radialGradient>
        <filter id="wax-noise" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 0 0.05  0 0 0 0.35 0"
          />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* Тень под воском */}
      <ellipse cx="50" cy="93" rx="30" ry="3" fill="rgba(0,0,0,0.55)" />

      {/* Основа печати — «капля» */}
      <path
        d="M50 6
           C 74 6, 92 22, 92 46
           C 92 68, 78 82, 68 86
           C 60 89, 58 92, 56 96
           C 54 92, 46 92, 44 96
           C 42 92, 40 89, 32 86
           C 22 82, 8 68, 8 46
           C 8 22, 26 6, 50 6 Z"
        fill="url(#wax-body)"
      />

      {/* Стрёкоза-мазок сверху — блик от свечи */}
      <path
        d="M50 6
           C 74 6, 92 22, 92 46
           C 92 68, 78 82, 68 86
           C 60 89, 58 92, 56 96
           C 54 92, 46 92, 44 96
           C 42 92, 40 89, 32 86
           C 22 82, 8 68, 8 46
           C 8 22, 26 6, 50 6 Z"
        fill="url(#wax-highlight)"
      />

      {/* Шум — зерно воска */}
      <path
        d="M50 6
           C 74 6, 92 22, 92 46
           C 92 68, 78 82, 68 86
           C 60 89, 58 92, 56 96
           C 54 92, 46 92, 44 96
           C 42 92, 40 89, 32 86
           C 22 82, 8 68, 8 46
           C 8 22, 26 6, 50 6 Z"
        filter="url(#wax-noise)"
      />

      {/* Тиснёная монограмма */}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontFamily="Cinzel, serif"
        fontSize="42"
        fontWeight="600"
        fill="var(--color-night-950)"
        style={{ letterSpacing: '0.02em' }}
      >
        {monogram}
      </text>

      {/* Внутренняя тень тиснения — приподнимает букву */}
      <text
        x="50"
        y="57.4"
        textAnchor="middle"
        fontFamily="Cinzel, serif"
        fontSize="42"
        fontWeight="600"
        fill="rgba(255,210,160,0.15)"
        style={{ letterSpacing: '0.02em' }}
      >
        {monogram}
      </text>
    </svg>
  );
}
