export function LogoMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full border ${
          inverse ? 'border-white/20 bg-white/10' : 'border-ink/10 bg-white'
        }`}
      >
        <span
          className={`font-display text-2xl font-semibold tracking-[-0.08em] ${
            inverse ? 'text-white' : 'text-ink'
          }`}
        >
          NS
        </span>
      </span>
      <span className="flex flex-col">
        <span
          className={`text-[0.7rem] font-semibold uppercase tracking-[0.28em] ${
            inverse ? 'text-white/60' : 'text-slate'
          }`}
        >
          Chicago&apos;s North Shore
        </span>
        <span
          className={`font-display text-2xl font-semibold tracking-[-0.04em] ${
            inverse ? 'text-white' : 'text-ink'
          }`}
        >
          North Shore Nautical
        </span>
      </span>
    </span>
  )
}
