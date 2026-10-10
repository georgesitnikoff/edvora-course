import type { Step } from '../curriculum/schema'
import { MathText } from './MathText'
import type { StepPatch } from './progress'

export function FormulaAnswer({step,sequence,onChange}:{step:Step;sequence:string[];onChange:(p:StepPatch)=>void}){
  const spec=step.formula!
  const token=(label:string)=><MathText text={'$'+label.replaceAll('−','-')+'$'}/>
  const slot=(i:number)=><button type="button" className={'formula-slot '+(sequence[i]===undefined?'empty':'')} aria-label={'Изменить '+spec.slotLabels[i]+': '+(sequence[i]??'пусто')} onClick={()=>onChange(current=>({sequence:current.sequence.slice(0,i)}))}>{sequence[i]===undefined?'?':token(sequence[i])}</button>
  return <div className="formula-answer">
    <div className="formula-equation" aria-label="Собираемая формула"><MathText text={spec.prefix}/>
      {spec.layout==='linear'?<div className="formula-linear">{slot(0)}<MathText text={'$'+(spec.variable??'t')+'$'}/><span>+</span>{slot(1)}</div>:<div className="formula-fraction"><div>{slot(0)}<span>−</span>{slot(1)}</div><div>{slot(2)}<span>−</span>{slot(3)}</div></div>}
    </div>
    <p className="formula-next" role="status">{sequence.length<spec.slotLabels.length?'Следующее место: '+spec.slotLabels[sequence.length]:'Все места заполнены. Проверь формулу.'}</p>
    <div className="formula-pool">{step.labels?.map(label=><button type="button" key={label} aria-label={'Вставить '+label} onClick={()=>onChange(current=>({sequence:current.sequence.length<spec.slotLabels.length?[...current.sequence,label]:[...current.sequence.slice(0,-1),label]}))}>{token(label)}</button>)}</div>
    <p className="input-note">Нажимай на карточки по порядку. Нажми на заполненное место, чтобы изменить его. Одну карточку можно использовать несколько раз.</p>
    <button type="button" className="text-button" onClick={()=>onChange({sequence:[]})}>Собрать заново</button>
  </div>
}
