import katex from 'katex'
import { useMemo } from 'react'

export function MathText({text,className=''}:{text:string;className?:string}){
  const parts=useMemo(()=>text.split(/(\$[^$]+\$)/g),[text])
  return <span className={'math-text '+className}>{parts.map((part,i)=>part.startsWith('$')&&part.endsWith('$')
    ?<span key={i} className="formula" dangerouslySetInnerHTML={{__html:katex.renderToString(part.slice(1,-1),{throwOnError:false,strict:'ignore',output:'htmlAndMathml'})}}/>
    :<span key={i}>{part}</span>)}</span>
}
