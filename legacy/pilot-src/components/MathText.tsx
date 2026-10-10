import { BlockMath, InlineMath } from 'react-katex'

interface MathTextProps {
  text: string
  block?: boolean
  className?: string
}

export function MathText({ text, block = false, className }: MathTextProps) {
  const sanitized = text.trim()

  if (!sanitized) {
    return null
  }

  if (block) {
    return <BlockMath math={sanitized} className={className} />
  }

  return <InlineMath math={sanitized} className={className} />
}
