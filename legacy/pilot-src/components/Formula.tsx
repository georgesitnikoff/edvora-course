import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'

export function M({ tex, block }: { tex: string; block?: boolean }) {
  return block ? <BlockMath math={tex} /> : <InlineMath math={tex} />
}