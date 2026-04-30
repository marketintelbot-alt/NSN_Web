type LogoMarkProps = {
  inverse?: boolean
  size?: 'header' | 'footer' | 'compact'
}

export function LogoMark({ inverse = false, size = 'header' }: LogoMarkProps) {
  const sizeClasses =
    size === 'footer'
      ? 'h-20 w-20 md:h-24 md:w-24'
      : size === 'compact'
        ? 'h-11 w-11 md:h-12 md:w-12'
        : 'h-14 w-14 md:h-16 md:w-16'

  return (
    <span
      aria-label="North Shore Nautical"
      className={`${sizeClasses} inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/45 bg-[#f8fbf7] text-ink shadow-soft ring-1 ring-white/70`}
      role="img"
    >
      <img
        alt=""
        aria-hidden="true"
        className="h-[92%] w-[92%] object-contain"
        draggable={false}
        src="/images/north-shore-compass-mark.png"
      />
      {inverse ? <span className="sr-only">North Shore Nautical</span> : null}
    </span>
  )
}
