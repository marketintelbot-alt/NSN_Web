type SectionIntroProps = {
  label: string
  title: string
  copy: string
  align?: 'left' | 'center'
  inverse?: boolean
}

export function SectionIntro({
  label,
  title,
  copy,
  align = 'left',
  inverse = false,
}: SectionIntroProps) {
  return (
    <div
      className={`${
        align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'
      }`}
    >
      <span className={inverse ? 'eyebrow' : 'section-label'}>{label}</span>
      <h2 className={inverse ? 'display-title-inverse' : 'section-title'}>{title}</h2>
      <p
        className={`mt-5 ${inverse ? 'mx-auto max-w-2xl text-base leading-8 text-white/70 md:text-lg' : 'section-copy'}`}
      >
        {copy}
      </p>
    </div>
  )
}
