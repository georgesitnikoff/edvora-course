type FourPointsVariant = 'rise-fall' | 'negative-points'

const DOMAIN = {
  minX: 0,
  maxX: 5,
  minY: 0,
  maxY: 6,
}

const pointConfigs: Record<FourPointsVariant, number[]> = {
  'rise-fall': [0.8, 2.2, 3.2, 4.6],
  'negative-points': [0.7, 1.9, 3.1, 4.5],
}

function graphY(x: number, variant: FourPointsVariant) {
  if (variant === 'negative-points') {
    return -0.9 * (x - 2.6) ** 2 + 5.2
  }

  return -0.85 * (x - 2.5) ** 2 + 5.2
}

function toSvgX(x: number) {
  const width = 320 - 40
  return 20 + ((x - DOMAIN.minX) / (DOMAIN.maxX - DOMAIN.minX)) * width
}

function toSvgY(y: number) {
  const height = 180 - 30
  return 150 - ((y - DOMAIN.minY) / (DOMAIN.maxY - DOMAIN.minY)) * height
}

export function FourPointsIllustration({ variant = 'rise-fall' }: { variant?: FourPointsVariant }) {
  const xs = pointConfigs[variant]
  const points = xs.map((x) => ({ x, y: graphY(x, variant) }))

  const curvePath = Array.from({ length: 80 }, (_, i) => {
    const x = DOMAIN.minX + (i / 79) * (DOMAIN.maxX - DOMAIN.minX)
    const y = graphY(x, variant)
    return `${i === 0 ? 'M' : 'L'} ${toSvgX(x).toFixed(2)} ${toSvgY(y).toFixed(2)}`
  }).join(' ')

  return (
    <svg viewBox="0 0 320 180" className="h-[180px] w-full rounded-2xl bg-slate-50">
      <defs>
        <linearGradient id="fourCurve" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>

      {Array.from({ length: 7 }).map((_, index) => (
        <line key={`v-${index}`} x1={(index / 6) * 320} x2={(index / 6) * 320} y1={0} y2={180} stroke="#e2e8f0" strokeWidth="0.8" />
      ))}
      {Array.from({ length: 5 }).map((_, index) => (
        <line key={`h-${index}`} x1={0} x2={320} y1={(index / 4) * 180} y2={(index / 4) * 180} stroke="#e2e8f0" strokeWidth="0.8" />
      ))}

      <path d={curvePath} fill="none" stroke="url(#fourCurve)" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" x2="300" y1="150" y2="150" stroke="#94a3b8" strokeWidth="1.2" />
      <line x1="20" x2="20" y1="20" y2="150" stroke="#94a3b8" strokeWidth="1.2" />

      <g>
        {points.map((point, index) => {
          const cx = toSvgX(point.x)
          const cy = toSvgY(point.y)
          const fill = index < 2 ? '#22c55e' : '#ef4444'
          const label = `x${index + 1}`
          return (
            <g key={`point-${index}`}>
              <circle cx={cx} cy={cy} r="6" fill={fill} />
              <line x1={cx} x2={cx} y1={cy - 7} y2={cy + 7} stroke={fill} strokeWidth="2" />
              <line x1={cx - 7} x2={cx + 7} y1={cy} y2={cy} stroke={fill} strokeWidth="2" />
              <text x={cx + 8} y={cy - 10} fill="#475569" fontSize="11" fontWeight="700">{label}</text>
            </g>
          )
        })}
      </g>

      <text x="20" y="25" fill="#475569" fontSize="12" fontWeight="600">f(x)</text>
    </svg>
  )
}
