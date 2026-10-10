import { useId } from 'react'
import type { GraphSpec } from '../curriculum/schema'
import { displayQ,formatNumber,add,rational,sub } from '../math/exact'
import { derivativeModel,exactValue,integral,primitiveModel,value } from '../math/models'
import type { deriveLab } from './labEngine'

type Derived=ReturnType<typeof deriveLab>
const fmt=(n:number)=>formatNumber(n,3)
export function Vehicle({x,y,color,angle=0}:{x:number;y:number;color:string;angle?:number}){
  return <g transform={`translate(${x},${y}) rotate(${angle})`}>
    <rect x="-19" y="-13" width="38" height="26" rx="8" fill={color}/>
    <rect x="-8" y="-9" width="17" height="18" rx="3" fill="#13202e"/>
    <path d="M12-8V8M-12-8V8" stroke="#ffffff80" strokeWidth="2"/>
    <rect x="-12" y="-16" width="9" height="4" rx="2" fill="#0b1017"/><rect x="-12" y="12" width="9" height="4" rx="2" fill="#0b1017"/>
    <rect x="8" y="-16" width="9" height="4" rx="2" fill="#0b1017"/><rect x="8" y="12" width="9" height="4" rx="2" fill="#0b1017"/>
    <circle cx="16" cy="-7" r="2" fill="#fff6bc"/><circle cx="16" cy="7" r="2" fill="#fff6bc"/>
  </g>
}
export function Bicycle({x,y,angle=0}:{x:number;y:number;angle?:number}){
  return <g transform={`translate(${x},${y}) rotate(${angle})`}><circle cx="-9" cy="-7" r="7" className="bicycle-wheel"/><circle cx="10" cy="-7" r="7" className="bicycle-wheel"/><path d="M-9-7L-3-20L10-7H-9L2-12M-3-20H4M9-24L10-7" stroke="#ffd694" strokeWidth="2" fill="none"/><circle cx="-1" cy="-34" r="4" fill="#f3d7b7"/><path d="M-1-29L2-19L8-24M2-19L-4-9" fill="none" stroke="#85a5ff" strokeWidth="4" strokeLinecap="round"/></g>
}
export function ContextScene({spec,d,time}:{spec:GraphSpec;d:Derived;time:number}){
  const id=useId().replace(/:/g,'')
  const c=spec.context!
  const position=value(d.model,time)+d.shift
  const quantity=spec.mode==='area'?(spec.constant??0)+integral(d.model,d.from,time,d.order):position
  const rate=spec.mode==='area'?value(d.model,time,d.order):value(d.model,time,1)
  const exact=exactValue(d.model,time)
  const positionLabel=exact?displayQ(add(exact,rational(d.shift))):'≈ '+fmt(position)
  const primitive=spec.mode==='area'&&d.model.kind==='poly'?primitiveModel(d.order===1?derivativeModel(d.model):d.model):undefined
  const start=primitive?exactValue(primitive,d.from):null,end=primitive?exactValue(primitive,time):null
  const quantityLabel=spec.mode==='area'?start&&end?displayQ(add(sub(end,start),rational(spec.constant??0))):'≈ '+fmt(quantity):positionLabel
  const rateExact=exactValue(d.model,time,spec.mode==='area'?d.order:1)
  const rateLabel=Number.isFinite(rate)?rateExact?displayQ(rateExact):'≈ '+fmt(rate):'не определена'
  const inputUnit=c.inputUnit??(c.kind==='terrain'?'км':'с'),outputUnit=c.outputUnit??(c.kind==='tank'?'л':'м')
  const other=c.comparison?value(c.comparison.model,time):undefined
  const otherExact=c.comparison?exactValue(c.comparison.model,time):null
  const otherLabel=otherExact?displayQ(otherExact):other!==undefined?'≈ '+fmt(other):''
  const lo=c.domain[0],hi=c.domain[1]
  const sceneLabel=c.kind==='tank'?`В резервуаре ${quantityLabel} ${outputUnit}`:c.kind==='race'?`${c.primary}: ${positionLabel} ${outputUnit}${other!==undefined?`; ${c.comparison!.label}: ${otherLabel} ${outputUnit}`:''}`:`Высота дороги ${positionLabel} ${outputUnit}`
  const maxPosition=Math.max(1,...Array.from({length:101},(_,i)=>Math.max(value(d.model,lo+(hi-lo)*i/100),c.comparison?value(c.comparison.model,lo+(hi-lo)*i/100):0)).filter(Number.isFinite))
  const minPosition=Math.min(...(c.kind==='terrain'?[]:[0]),...Array.from({length:101},(_,i)=>value(d.model,lo+(hi-lo)*i/100)).filter(Number.isFinite))
  const roadX=(n:number)=>75+(n-minPosition)/(maxPosition-minPosition)*405
  const X=(t:number)=>42+(t-lo)/(hi-lo)*476
  const Y=(n:number)=>136-(n-minPosition)/Math.max(1e-8,maxPosition-minPosition)*95
  const terrainPath=Array.from({length:201},(_,i)=>{const t=lo+(hi-lo)*i/200;return `${i?'L':'M'}${X(t)} ${Y(value(d.model,t)+d.shift)}`}).join(' ')
  const angle=Math.atan2(-rate*95/Math.max(1e-8,maxPosition-minPosition),476/(hi-lo))*180/Math.PI
  return <div className={'context-scene context-'+c.kind}>
    <div className="scene-caption"><span>{c.title}</span><b>{c.variable??(c.kind==='terrain'?'x':'t')} = {fmt(time)} {inputUnit}</b></div>
    <svg viewBox={c.kind==='tank'?'0 0 560 194':'0 0 560 185'} role="img" aria-label={sceneLabel}>
      <defs><linearGradient id={id+'water'} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#74b9ff"/><stop offset="1" stopColor="#345fbe"/></linearGradient></defs>
      {c.kind==='race'&&<>
        {[55,...(c.comparison?[125]:[])].map((y,i)=><g key={y}>
          <rect x="55" y={y-27} width="447" height="54" rx="12" className="scene-road"/>
          <path d={`M65 ${y}H490`} className="road-mark"/>
          <path d={`M75 ${y-27}V${y+27}M480 ${y-27}V${y+27}`} className="finish-line"/>
          <Vehicle x={roadX(i?other!:position)} y={y} color={i?'#ffb56b':'#85a5ff'} angle={i?0:rate<0?180:0}/>
          <text x="17" y={y+5} className={i?'scene-orange':'scene-blue'} fontSize="16" fontWeight="700">{i?'B':'A'}</text>
        </g>)}
        <text x="75" y="178" textAnchor="middle" className="scene-small">{fmt(minPosition)} {outputUnit}</text><text x="480" y="178" textAnchor="middle" className="scene-small">{fmt(maxPosition)} {outputUnit}</text>
        {other!==undefined&&<path d={`M${roadX(position)} 91H${roadX(other)}`} className="gap-measure"/>}
      </>}
      {c.kind==='tank'&&<>
        <rect x="55" y="25" width="150" height="142" rx="15" className="tank-body"/>
        <clipPath id={id+'tank'}><rect x="60" y="30" width="140" height="132" rx="10"/></clipPath>
        <g clipPath={`url(#${id}tank)`}><rect x="60" y={162-Math.max(0,Math.min(1,quantity/(c.capacity??100)))*132} width="140" height="132" fill={`url(#${id}water)`}/>
          <path d={`M60 ${162-Math.max(0,Math.min(1,quantity/(c.capacity??100)))*132}H200`} stroke="#d2eeff" strokeWidth="2"/>
        </g>
        <path d="M125 5V30M205 150H230V169" className="tank-pipe"/>
        {[0,.25,.5,.75,1].map(f=><g key={f}><line x1="187" x2="201" y1={162-f*132} y2={162-f*132} className="tank-tick"/><text x="220" y={166-f*132} className="scene-small">{fmt(f*(c.capacity??100))}</text></g>)}
        <text x="315" y="63" className="scene-small">ОБЪЁМ ВОДЫ</text><text x="313" y="103" className="scene-value">{quantityLabel}<tspan className="scene-small"> {outputUnit}</tspan></text>
        {c.showRate&&<><text x="315" y="132" className="scene-small">{rate>0?'Наполнение':rate<0?'Слив':'Уровень не меняется'}</text><text x="315" y="157" className="scene-blue">{rateLabel} {outputUnit}/{inputUnit}</text></>}
        {rate>0&&<path d="M125 5V32" className="water-flow" strokeDasharray="3 6" strokeDashoffset={-time*9}/>}
        {rate<0&&<path d="M205 150H230V175" className="water-flow" strokeDasharray="3 6" strokeDashoffset={-time*9}/>}
      </>}
      {c.kind==='terrain'&&<>
        <path d={terrainPath+' L518 160L42 160Z'} className="terrain-fill"/>
        <path d={terrainPath} className="terrain-road"/>
        <Bicycle x={X(time)} y={Y(position)} angle={Number.isFinite(angle)?angle:0}/>
        <text x="42" y="179" className="scene-small">{fmt(lo)} {inputUnit}</text><text x="518" y="179" textAnchor="end" className="scene-small">{fmt(hi)} {inputUnit}</text>
      </>}
    </svg>
    {c.kind!=='tank'&&<div className="scene-values"><span><i className="legend-dot blue"/>{c.primary}<b>{positionLabel} {outputUnit}</b></span>{other!==undefined&&<span><i className="legend-dot orange"/>{c.comparison!.label}<b>{otherLabel} {outputUnit}</b></span>}{c.showRate&&<span>{c.kind==='terrain'?'Наклон':'Проекция скорости'}<b>{rateLabel} {outputUnit}/{inputUnit}</b></span>}</div>}
  </div>
}
