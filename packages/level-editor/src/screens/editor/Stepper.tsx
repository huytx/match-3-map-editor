export function Stepper({
  value,
  onChange,
  color,
  max = 999,
}: {
  value: number;
  onChange: (v: number) => void;
  color?: string;
  max?: number;
}) {
  const step = value < 20 ? 1 : value < 100 ? 5 : 10;
  return (
    <div className="flex items-center rounded-lg overflow-hidden border border-white/15 h-7 shrink-0">
      <button
        onClick={() => onChange(Math.max(0, value - step))}
        className="w-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10
                   cursor-pointer transition-colors text-base h-full font-bold leading-none"
      >
        −
      </button>
      <span
        className="flex-1 text-center tabular-nums text-xs font-bold px-1 min-w-10"
        style={{ color: value > 0 ? (color ?? '#fff') : 'rgba(255,255,255,0.25)' }}
      >
        {value > 0 ? value : '—'}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10
                   cursor-pointer transition-colors text-base h-full font-bold leading-none"
      >
        +
      </button>
    </div>
  );
}
