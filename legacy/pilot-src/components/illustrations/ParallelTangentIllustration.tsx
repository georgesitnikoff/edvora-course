type ParallelTangentVariant = 'multiple' | 'summary'

function cubic(x: number) {
  return x ** 3 - 3 * x + 4
}

function toSvgX(x: number) {
  return 20 + ((x + 2) / 5) * 260
}

function toSvgY(y: number) {
  return 150 - ((y - 0) / 12) * 110
}

export function ParallelTangentIllustration({ variant = 'multiple' }: { variant?: ParallelTangentVariant }) {
  const curvePath = Array.from({ length: 80 }, (_, i) => {
    const x = -2.5 + (i / 79) * 5
    const y = cubic(x)
    return `${i === 0 ? 'M' : 'L'} ${toSvgX(x).toFixed(2)} ${toSvgY(y).toFixed(2)}`
  }).join(' ')

  const points = variant === 'summary'
    ? [{ x: -1.3, y: cubic(-1.3) }, { x: 0.7, y: cubic(0.7) }, { x: 1.8, y: cubic(1.8) }]
    : [{ x: -1.8, y: cubic(-1.8) }, { x: 0.3, y: cubic(0.3) }, { x: 1.5, y: cubic(1.5) }]

  return (
    <svg viewBox="0 0 320 180" className="h-[180px] w-full rounded-2xl bg-slate-50">
      {Array.from({ length: 7 }).map((_, index) => (
        <line key={`v-${index}`} x1={(index / 6) * 320} x2={(index / 6) * 320} y1={0} y2={180} stroke="#e2e8f0" strokeWidth="0.8" />
      ))}
      {Array.from({ length: 5 }).map((_, index) => (
        <line key={`h-${index}`} x1={0} x2={320} y1={(index / 4) * 180} y2={(index / 4) * 180} stroke="#e2e8f0" strokeWidth="0.8" />
      ))}

      <path d={curvePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" x2="300" y1="114" y2="114" stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="7 6" />
      <line x1="20" x2="300" y1="150" y2="150" stroke="#cbd5e1" strokeWidth="1.2" />

      <g>
        {points.map((point, index) => {
          const cx = toSvgX(point.x)
          const cy = toSvgY(point.y)
          return (
            <g key={`parallel-${index}`}>
              <circle cx={cx} cy={cy} r="6" fill="#f59e0b" />
              <line x1={cx} x2={cx} y1={cy} y2={150} stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" />
            </g>
          )
        })}
      </g>

      <text x="22" y="23" fill="#475569" fontSize="12" fontWeight="600">y = 6</text>
      <text x="210" y="25" fill="#475569" fontSize="12" fontWeight="600">k = 0</text>
    </svg>
  )
}
