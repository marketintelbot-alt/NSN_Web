type LogoMarkProps = {
  inverse?: boolean
  size?: 'header' | 'footer' | 'compact'
}

export function LogoMark({ inverse = false, size = 'header' }: LogoMarkProps) {
  const sizeClasses =
    size === 'footer'
      ? 'h-16 w-auto md:h-20'
      : size === 'compact'
        ? 'h-9 w-auto md:h-10'
        : 'h-11 w-auto md:h-12'

  return (
    <span className="inline-flex items-center">
      <img
        alt="North Shore Nautical"
        className={`${sizeClasses} shrink-0 object-contain`}
        src="/images/final-logo.png"
      />
      {inverse ? <span className="sr-only">North Shore Nautical</span> : null}
    </span>
  )
}
