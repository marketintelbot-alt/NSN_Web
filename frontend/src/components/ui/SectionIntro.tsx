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
      <h2 className={inverse ? 'section-title-inverse' : 'section-title'}>{title}</h2>
      <p
        className={`mt-5 ${inverse ? 'section-copy-inverse' : 'section-copy'} ${
          inverse && align === 'center' ? 'mx-auto' : ''
        }`}
      >
        {copy}
      </p>
    </div>
  )
}
