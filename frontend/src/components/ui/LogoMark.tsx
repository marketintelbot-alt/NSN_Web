export function LogoMark({ inverse = false }: { inverse?: boolean }) {
  const ringColor = inverse ? '#c9a465' : '#b49055'
  const warmAccent = inverse ? '#d2b06f' : '#b9975b'
  const coolAccent = inverse ? '#a9bfdc' : '#89a8cf'
  const mutedAccent = inverse ? '#7088a8' : '#5d7799'

  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full border ${
          inverse ? 'border-white/20 bg-white/10' : 'border-ink/10 bg-white'
        }`}
      >
        <svg
          aria-hidden="true"
          className="h-8 w-8"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="32" cy="32" r="28" fill="none" stroke={ringColor} strokeWidth="2.2" />
          <circle cx="32" cy="32" r="20.5" fill="none" stroke={ringColor} strokeOpacity="0.55" strokeWidth="1.6" />
          <circle cx="32" cy="32" r="2.2" fill="none" stroke={warmAccent} strokeWidth="2" />

          <polygon fill={warmAccent} points="32,4 36,22 32,27 28,22" />
          <polygon fill={coolAccent} points="60,32 42,36 37,32 42,28" />
          <polygon fill={coolAccent} points="32,60 36,42 32,37 28,42" />
          <polygon fill={coolAccent} points="4,32 22,36 27,32 22,28" />

          <polygon fill={warmAccent} fillOpacity="0.55" points="50,14 44,25 40,22 47,12" />
          <polygon fill={mutedAccent} fillOpacity="0.75" points="50,50 40,42 44,39 53,47" />
          <polygon fill={mutedAccent} fillOpacity="0.75" points="14,50 25,44 22,40 12,47" />
          <polygon fill={warmAccent} fillOpacity="0.55" points="14,14 24,22 21,26 12,17" />
        </svg>
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
