declare module 'react-katex' {
  import type { ReactNode } from 'react'

  export interface InlineMathProps {
    math: string
    errorColor?: string
    className?: string
  }

  export interface BlockMathProps {
    math: string
    errorColor?: string
    className?: string
  }

  export function InlineMath(props: InlineMathProps): ReactNode
  export function BlockMath(props: BlockMathProps): ReactNode
}
