type Props={id:string;value:string;onChange:(change:(value:string)=>string)=>void;invalid?:boolean}
export function NumberEntry({id,value,onChange,invalid=false}:Props){
  return <div className="number-form">
    <label htmlFor={id}>Твой ответ</label>
    <input id={id} autoComplete="off" inputMode="decimal" maxLength={64} placeholder="Введи число" value={value} onChange={e=>{const next=e.target.value;onChange(()=>next)}} aria-invalid={invalid} className={invalid?'invalid':''}/>
    <div className="number-tools" aria-label="Экранная клавиатура">{['7','8','9','⌫','4','5','6','−','1','2','3','/','C','0',','].map(s=><button key={s} type="button" aria-label={s==='C'?'Очистить ответ':s==='⌫'?'Стереть последний символ':'Вставить '+s} onClick={()=>onChange(current=>s==='C'?'':s==='⌫'?current.slice(0,-1):(current+s).slice(0,64))}>{s}</button>)}</div>
    <p className="input-note">Можно вводить десятичные числа с запятой и дроби: 1/2.</p>
  </div>
}
