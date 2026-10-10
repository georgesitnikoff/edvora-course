import { M } from '../Formula'
import type { TextSegment } from '../../types/lesson'

interface RichTextProps {
  segments?: TextSegment[]
  className?: string
}

export function RichText({ segments, className }: RichTextProps) {
  if (!segments || segments.length === 0) {
    return null
  }

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.kind === 'math' ? (
          <M key={`${segment.value}-${index}`} tex={segment.value} />
        ) : (
          <span key={`${segment.value}-${index}`}>{segment.value}</span>
        ),
      )}
    </span>
  )
}