import { useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

type GraphPoint = { x: number; y: number; label: string; color?: string; dashed?: boolean }
type GraphLine = { p1: [number, number]; p2: [number, number]; color?: string; style?: 'solid' | 'dashed' }

type ShadedArea = {
  fromX: number
  toX: number
  fn: (x: number) => number
  color?: string
  /** Make the second integration bound follow the draggable point. */
  dynamicToX?: boolean
}

export interface SmartMathGraphProps {
  fn?: (x: number) => number
  derivativeFn?: (x: number) => number
  rangeX: [number, number]
  rangeY: [number, number]
  gridStep?: number
  tangentAtX?: number
  interactivePoint?: boolean
  onPointChange?: (x: number) => void
  markedPoints?: GraphPoint[]
  markedLines?: GraphLine[]
  shadedArea?: ShadedArea
  showSlopeTriangle?: boolean
  height?: number
}

const WIDTH = 360
const EPSILON = 1e-9

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function round(value: number, precision = 2) {
  return Number(value.toFixed(precision))
}

function safeValue(fn: ((x: number) => number) | undefined, x: number) {
  if (!fn || !Number.isFinite(x)) return null

  try {
    const value = fn(x)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

function toScreen(
  x: number,
  y: number,
  rangeX: [number, number],
  rangeY: [number, number],
  height: number,
) {
  const spanX = rangeX[1] - rangeX[0]
  const spanY = rangeY[1] - rangeY[0]
  if (!Number.isFinite(x) || !Number.isFinite(y) || spanX <= 0 || spanY <= 0) return null

  const px = ((x - rangeX[0]) / spanX) * WIDTH
  const py = height - ((y - rangeY[0]) / spanY) * height
  return Number.isFinite(px) && Number.isFinite(py) ? { px, py } : null
}

function niceStep(span: number, targetTicks: number, requestedStep: number) {
  const rawStep = span / Math.max(1, targetTicks)
  const power = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / power
  const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  const adaptiveStep = multiplier * power
  return Math.max(adaptiveStep, Number.isFinite(requestedStep) && requestedStep > 0 ? requestedStep : 0)
}

function makeTicks(min: number, max: number, step: number) {
  if (!Number.isFinite(step) || step <= 0) return []

  const ticks: number[] = []
  const first = Math.ceil((min - EPSILON) / step) * step
  for (let index = 0; index < 100; index += 1) {
    const tick = first + index * step
    if (tick > max + EPSILON) break
    ticks.push(round(tick, 8))
  }
  return ticks
}

function formatTick(value: number, step: number) {
  const precision = step >= 1 ? 0 : Math.min(4, Math.max(1, Math.ceil(-Math.log10(step))))
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: precision }).format(
    Math.abs(value) < EPSILON ? 0 : value,
  )
}

export function SmartMathGraph({
  fn,
  derivativeFn,
  rangeX,
  rangeY,
  gridStep = 1,
  tangentAtX,
  interactivePoint = false,
  onPointChange,
  markedPoints = [],
  markedLines = [],
  shadedArea,
  showSlopeTriangle = false,
  height = 240,
}: SmartMathGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const activePointerRef = useRef<number | null>(null)
  const reactId = useId().replace(/:/g, '')
  const arrowId = `axis-arrow-${reactId}`
  const gradientId = `graph-stroke-${reactId}`
  const clipId = `plot-clip-${reactId}`
  const minX = rangeX[0]
  const maxX = rangeX[1]
  const spanX = maxX - minX
  const minY = rangeY[0]
  const maxY = rangeY[1]
  const spanY = maxY - minY
  const validRange = spanX > 0 && spanY > 0
  const initialX = clamp(tangentAtX ?? (minX + maxX) / 2, minX, maxX)
  const dragSourceKey = `${tangentAtX ?? 'mid'}:${minX}:${maxX}`
  const [dragState, setDragState] = useState({ sourceKey: dragSourceKey, value: initialX })
  const dragX = dragState.sourceKey === dragSourceKey ? dragState.value : initialX

  const activeX = interactivePoint ? clamp(dragX, minX, maxX) : tangentAtX
  const activeY = typeof activeX === 'number' ? safeValue(fn, activeX) : null
  const activePoint =
    typeof activeX === 'number' && activeY !== null
      ? toScreen(activeX, activeY, rangeX, rangeY, height)
      : null
  const activeSlope = typeof activeX === 'number' ? safeValue(derivativeFn, activeX) : null

  const xStep = niceStep(spanX, Math.max(4, Math.floor(WIDTH / 54)), gridStep)
  const yStep = niceStep(spanY, Math.max(3, Math.floor(height / 46)), gridStep)
  const xTicks = validRange ? makeTicks(minX, maxX, xStep) : []
  const yTicks = validRange ? makeTicks(minY, maxY, yStep) : []
  const hasXAxis = minY <= 0 && maxY >= 0
  const hasYAxis = minX <= 0 && maxX >= 0
  const xAxisY = hasXAxis ? toScreen(minX, 0, rangeX, rangeY, height)?.py ?? null : null
  const yAxisX = hasYAxis ? toScreen(0, minY, rangeX, rangeY, height)?.px ?? null : null

  const path = useMemo(() => {
    if (!fn || !validRange) return ''

    const segments: string[] = []
    const sampleCount = Math.max(240, Math.round(WIDTH * 1.5))
    let drawing = false

    for (let index = 0; index <= sampleCount; index += 1) {
      const x = minX + (index / sampleCount) * spanX
      const y = safeValue(fn, x)
      const point = y === null ? null : toScreen(x, y, rangeX, rangeY, height)

      if (!point) {
        drawing = false
        continue
      }

      segments.push(`${drawing ? 'L' : 'M'} ${round(point.px)} ${round(point.py)}`)
      drawing = true
    }

    return segments.join(' ')
  }, [fn, height, minX, rangeX, rangeY, spanX, validRange])

  const tangentLine = useMemo(() => {
    if (!fn || !derivativeFn || typeof activeX !== 'number' || !validRange) return null

    const y0 = safeValue(fn, activeX)
    const slope = safeValue(derivativeFn, activeX)
    if (y0 === null || slope === null) return null

    const yAtMin = y0 + slope * (minX - activeX)
    const yAtMax = y0 + slope * (maxX - activeX)
    const p1 = toScreen(minX, yAtMin, rangeX, rangeY, height)
    const p2 = toScreen(maxX, yAtMax, rangeX, rangeY, height)
    return p1 && p2 ? { p1, p2, x0: activeX, y0, slope } : null
  }, [activeX, derivativeFn, fn, height, maxX, minX, rangeX, rangeY, validRange])

  const slopeTriangle = (() => {
    if (!showSlopeTriangle || !validRange) return null

    if (tangentLine) {
      const desiredRun = Math.min(Math.max(xStep, spanX / 6), spanX / 3)
      const run = tangentLine.x0 + desiredRun <= maxX ? desiredRun : -desiredRun
      const endX = clamp(tangentLine.x0 + run, minX, maxX)
      const endY = tangentLine.y0 + tangentLine.slope * (endX - tangentLine.x0)
      const a = toScreen(tangentLine.x0, tangentLine.y0, rangeX, rangeY, height)
      const b = toScreen(endX, tangentLine.y0, rangeX, rangeY, height)
      const c = toScreen(endX, endY, rangeX, rangeY, height)
      return a && b && c ? { a, b, c, run: endX - tangentLine.x0, rise: endY - tangentLine.y0 } : null
    }

    const line = markedLines[0]
    if (!line || Math.abs(line.p2[0] - line.p1[0]) < EPSILON) return null
    const a = toScreen(line.p1[0], line.p1[1], rangeX, rangeY, height)
    const b = toScreen(line.p2[0], line.p1[1], rangeX, rangeY, height)
    const c = toScreen(line.p2[0], line.p2[1], rangeX, rangeY, height)
    return a && b && c
      ? { a, b, c, run: line.p2[0] - line.p1[0], rise: line.p2[1] - line.p1[1] }
      : null
  })()

  const shadePath = useMemo(() => {
    if (!shadedArea || !validRange) return ''

    const dynamicBoundary = shadedArea.dynamicToX ?? interactivePoint
    const requestedToX = dynamicBoundary && typeof activeX === 'number' ? activeX : shadedArea.toX
    const fromX = clamp(shadedArea.fromX, minX, maxX)
    const toX = clamp(requestedToX, minX, maxX)
    const lower = Math.min(fromX, toX)
    const upper = Math.max(fromX, toX)
    const baseline = toScreen(lower, 0, rangeX, rangeY, height)
    const endBaseline = toScreen(upper, 0, rangeX, rangeY, height)
    if (!baseline || !endBaseline) return ''

    const segments = [`M ${round(baseline.px)} ${round(baseline.py)}`]
    const sampleCount = Math.max(2, Math.ceil(((upper - lower) / spanX) * 180))
    let hasPoint = false

    for (let index = 0; index <= sampleCount; index += 1) {
      const x = lower + (index / sampleCount) * (upper - lower)
      const y = safeValue(shadedArea.fn, x)
      const point = y === null ? null : toScreen(x, y, rangeX, rangeY, height)
      if (!point) return ''
      segments.push(`L ${round(point.px)} ${round(point.py)}`)
      hasPoint = true
    }

    return hasPoint
      ? `${segments.join(' ')} L ${round(endBaseline.px)} ${round(endBaseline.py)} Z`
      : ''
  }, [activeX, height, interactivePoint, maxX, minX, rangeX, rangeY, shadedArea, spanX, validRange])

  const updateActiveX = (nextX: number) => {
    if (!interactivePoint || !validRange || !Number.isFinite(nextX)) return
    const clampedX = clamp(nextX, minX, maxX)
    setDragState({ sourceKey: dragSourceKey, value: clampedX })
    onPointChange?.(round(clampedX))
  }

  const updateFromClientX = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0) return
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
    updateActiveX(minX + ratio * spanX)
  }

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!interactivePoint) return
    activePointerRef.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromClientX(event.clientX)
  }

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!interactivePoint || activePointerRef.current !== event.pointerId) return
    updateFromClientX(event.clientX)
  }

  const finishPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (activePointerRef.current !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    activePointerRef.current = null
  }

  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (!interactivePoint) return
    const keyboardStep = Math.max(spanX / 50, Number.EPSILON)
    let nextX: number | null = null

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') nextX = dragX - keyboardStep
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') nextX = dragX + keyboardStep
    if (event.key === 'Home') nextX = minX
    if (event.key === 'End') nextX = maxX
    if (nextX === null) return

    event.preventDefault()
    updateActiveX(nextX)
  }

  const badgeWidth = derivativeFn ? 104 : 70
  const badgeX = activePoint ? clamp(activePoint.px + 12, 4, WIDTH - badgeWidth - 4) : 0
  const badgeY = activePoint ? clamp(activePoint.py - 34, 4, height - 28) : 0
  const xLabelY = xAxisY === null ? height - 6 : clamp(xAxisY + 15, 12, height - 5)
  const yLabelX = yAxisX === null ? 5 : clamp(yAxisX + 5, 5, WIDTH - 30)

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 shadow-sm">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="block w-full select-none"
        style={{ aspectRatio: `${WIDTH} / ${height}`, touchAction: interactivePoint ? 'pan-y' : 'auto' }}
        role={interactivePoint ? 'slider' : 'img'}
        aria-label={interactivePoint ? 'Интерактивная точка на графике' : 'График функции'}
        aria-valuemin={interactivePoint ? minX : undefined}
        aria-valuemax={interactivePoint ? maxX : undefined}
        aria-valuenow={interactivePoint ? round(dragX) : undefined}
        aria-valuetext={interactivePoint ? `x = ${round(dragX)}` : undefined}
        tabIndex={interactivePoint ? 0 : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onLostPointerCapture={() => {
          activePointerRef.current = null
        }}
        onKeyDown={handleKeyDown}
      >
        <defs>
          <marker id={arrowId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#64748b" />
          </marker>
          <linearGradient id={gradientId} x1="0%" x2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={WIDTH} height={height} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          {xTicks.map((tick) => {
            const point = toScreen(tick, minY, rangeX, rangeY, height)
            return point ? <line key={`vx-${tick}`} x1={point.px} x2={point.px} y1={0} y2={height} stroke="#dbeafe" strokeWidth="0.9" /> : null
          })}

          {yTicks.map((tick) => {
            const point = toScreen(minX, tick, rangeX, rangeY, height)
            return point ? <line key={`hy-${tick}`} x1={0} x2={WIDTH} y1={point.py} y2={point.py} stroke="#dbeafe" strokeWidth="0.9" /> : null
          })}

          {xAxisY !== null && (
            <line x1={0} y1={xAxisY} x2={WIDTH} y2={xAxisY} stroke="#64748b" strokeWidth="1.5" markerEnd={`url(#${arrowId})`} />
          )}
          {yAxisX !== null && (
            <line x1={yAxisX} y1={height} x2={yAxisX} y2={0} stroke="#64748b" strokeWidth="1.5" markerEnd={`url(#${arrowId})`} />
          )}

          {shadedArea && shadePath && <path d={shadePath} fill={shadedArea.color ?? 'rgba(14,165,233,0.14)'} stroke="none" />}

          {fn && path && <path d={path} fill="none" stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

          {tangentLine && (
            <line
              x1={tangentLine.p1.px}
              y1={tangentLine.p1.py}
              x2={tangentLine.p2.px}
              y2={tangentLine.p2.py}
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="8 6"
            />
          )}

          {markedLines.map((line, index) => {
            const p1 = toScreen(line.p1[0], line.p1[1], rangeX, rangeY, height)
            const p2 = toScreen(line.p2[0], line.p2[1], rangeX, rangeY, height)
            if (!p1 || !p2) return null
            return (
              <line
                key={`line-${index}`}
                x1={p1.px}
                y1={p1.py}
                x2={p2.px}
                y2={p2.py}
                stroke={line.color ?? '#7c3aed'}
                strokeWidth="2.6"
                strokeDasharray={line.style === 'dashed' ? '8 6' : undefined}
              />
            )
          })}

          {slopeTriangle && (
            <g aria-label={`Треугольник наклона: Δx ${round(slopeTriangle.run)}, Δy ${round(slopeTriangle.rise)}`}>
              <polygon
                points={`${slopeTriangle.a.px},${slopeTriangle.a.py} ${slopeTriangle.b.px},${slopeTriangle.b.py} ${slopeTriangle.c.px},${slopeTriangle.c.py}`}
                fill="rgba(124, 58, 237, 0.12)"
                stroke="rgba(124, 58, 237, 0.65)"
                strokeWidth="1.5"
              />
              <text x={(slopeTriangle.a.px + slopeTriangle.b.px) / 2} y={slopeTriangle.b.py - 5} textAnchor="middle" fontSize="10" fill="#6d28d9">
                Δx={round(slopeTriangle.run)}
              </text>
              <text x={slopeTriangle.c.px - 5} y={(slopeTriangle.b.py + slopeTriangle.c.py) / 2} textAnchor="end" fontSize="10" fill="#6d28d9">
                Δy={round(slopeTriangle.rise)}
              </text>
            </g>
          )}

          {markedPoints.map((point, index) => {
            const screen = toScreen(point.x, point.y, rangeX, rangeY, height)
            if (!screen) return null
            return (
              <g key={`point-${index}`}>
                <circle cx={screen.px} cy={screen.py} r={8} fill={point.color ?? '#10b981'} stroke="#fff" strokeWidth="3" opacity={point.dashed ? 0.75 : 1} />
                <text x={screen.px + 10} y={screen.py - 10} fontSize="11" fill={point.color ?? '#0f172a'}>
                  {point.label}
                </text>
              </g>
            )
          })}

          {activePoint && interactivePoint && (
            <g>
              <circle cx={activePoint.px} cy={activePoint.py} r="20" fill="transparent" pointerEvents="all" />
              <circle cx={activePoint.px} cy={activePoint.py} r="16" fill="rgba(37,99,235,0.14)" pointerEvents="none" />
              <circle cx={activePoint.px} cy={activePoint.py} r="8" fill="#2563eb" stroke="#fff" strokeWidth="3" pointerEvents="none" />
            </g>
          )}
        </g>

        {xTicks.map((tick) => {
          const point = toScreen(tick, minY, rangeX, rangeY, height)
          if (!point) return null
          return <text key={`xt-${tick}`} x={clamp(point.px, 9, WIDTH - 9)} y={xLabelY} textAnchor="middle" fontSize="9" fill="#64748b">{formatTick(tick, xStep)}</text>
        })}

        {yTicks.map((tick) => {
          const point = toScreen(minX, tick, rangeX, rangeY, height)
          if (!point) return null
          return <text key={`yt-${tick}`} x={yLabelX} y={clamp(point.py - 3, 10, height - 3)} fontSize="9" fill="#64748b">{formatTick(tick, yStep)}</text>
        })}

        {xAxisY !== null && <text x={WIDTH - 10} y={clamp(xAxisY - 8, 11, height - 5)} textAnchor="end" fontSize="10" fill="#475569">x</text>}
        {yAxisX !== null && <text x={clamp(yAxisX + 10, 8, WIDTH - 10)} y={12} fontSize="10" fill="#475569">y</text>}

        {activePoint && interactivePoint && (
          <g pointerEvents="none">
            <rect x={badgeX} y={badgeY} width={badgeWidth} height="25" rx="8" fill="rgba(15,23,42,0.9)" />
            <text x={badgeX + 7} y={badgeY + 17} fontSize="10" fill="#fff">
              {activeSlope === null ? `x = ${round(activeX ?? dragX)}` : `x=${round(activeX ?? dragX)} · f′=${round(activeSlope)}`}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
