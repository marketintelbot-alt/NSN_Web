type FaqListProps = {
  items: Array<{ question: string; answer: string }>
}

export function FaqList({ items }: FaqListProps) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <details
          key={item.question}
          className="group soft-panel px-6 py-5 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="cursor-pointer list-none text-lg font-semibold text-ink outline-none transition duration-300 group-open:text-navy focus-visible:ring-2 focus-visible:ring-lake focus-visible:ring-offset-2">
            {item.question}
          </summary>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate md:text-base">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  )
}
