interface ProgressBarProps {
  total: number
  currentIndex: number
}

export function ProgressBar({ total, currentIndex }: ProgressBarProps) {
  return (
    <div className="flex w-full gap-1.5">
      {Array.from({ length: total }).map((_, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <div
            key={`${index}-progress`}
            className={[
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              isDone ? 'bg-emerald-500' : isCurrent ? 'bg-sky-500' : 'bg-slate-200',
            ].join(' ')}
          />
        )
      })}
    </div>
  )
}
