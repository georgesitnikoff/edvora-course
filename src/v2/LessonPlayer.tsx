import { useEffect,useState } from 'react'
import { BookOpen,Check,ChevronDown,Lightbulb,List,RotateCcw,X } from 'lucide-react'
import type { Lesson,Step } from '../curriculum/schema'
import { parseAnswer } from '../math/exact'
import { value } from '../math/models'
import { extrema } from '../math/analysis'
import { GraphLab } from './GraphLab'
import { goalMet,initialLab } from './labEngine'
import { MathText } from './MathText'
import { checkpointScore,completedCount,emptyStep,reviewed } from './progress'
import type { Progress,StepPatch } from './progress'
import { FormulaAnswer } from './FormulaAnswer'
import { formulaMatches } from './formulaLogic'

function numericFeedback(step:Step,raw:string){
  const input=parseAnswer(raw),p=step.proof
  if(input===null)return 'Введи одно число: например −2, 0,5 или 1/2. Запятые и дроби поддерживаются.'
  if(p&&['derivative','slope'].includes(p.kind)&&p.x!==undefined&&Math.abs(input-value(p.model,p.x))<1e-7)return 'Ты нашёл высоту функции. Здесь нужен наклон: читай касательную или график производной.'
  if(p?.kind==='value')return input===p.x?'Ты ввёл аргумент x. Найди его на горизонтальной оси и прочитай высоту соответствующей точки графика.':'Нужна высота графика при заданном x. Проведи от x до кривой, затем прочитай y по вертикальной оси и проверь цену делений.'
  if(typeof step.answer==='number'&&step.answer!==0&&Math.abs(input+step.answer)<1e-7)return 'Модуль получился верным. Проверь знак: направление изменения, порядок разностей или положение графика относительно оси.'
  if(p?.kind==='extremaCount'&&p.extremum&&input===extrema(p.model,p.a??-3,p.b??3,p.extremum==='max'?'min':'max').length)return 'Похоже, ты посчитал другой тип экстремума. Максимум: плюс → минус. Минимум: минус → плюс.'
  if(p?.kind==='integral')return 'Проверь площади по частям: ниже оси они отрицательны. Затем прибавь начальное значение, если оно дано.'
  if(p?.kind==='globalPoint'||p?.kind==='globalValue')return 'Вычисли значения функции на обоих концах отрезка и во внутренних критических точках. Сравни их. Если спрашивают значение, запиши f(x); если точку, запиши её аргумент x.'
  if(p?.kind==='parallel'||p?.kind==='parallelPoint')return 'При параллельности совпадают наклоны. Реши f′(x)=k; свободный член исходной прямой не нужен. Затем проверь границы.'
  if(p?.kind==='signCount'||p?.kind==='integerCount')return 'Проверь каждую нужную точку отдельно. Ноль не входит в строгие знаки «больше нуля» и «меньше нуля».'
  return step.error??'Ответ пока неверный. Проверь, какую величину нужно найти, затем выбранную формулу, подстановку и знак. Ниже можно разобрать решение по шагам.'
}
function shuffled(labels:string[],id:string){
  const seed=[...id].reduce((sum,c)=>sum+c.charCodeAt(0),0)
  const shift=seed%labels.length
  const result=[...labels.slice(shift),...labels.slice(0,shift)].reverse()
  return result.join('|')===labels.join('|')?[...result.slice(1),result[0]]:result
}
type Props={lesson:Lesson;index:number;progress:Progress;review?:boolean;storageError:string|null;
  onHome:()=>void;onStep:(index:number)=>void;onNextLesson:()=>void;onReviewDone:()=>void;onReviewStep:(index:number)=>void;lastLesson:boolean;updateStep:(id:string,p:StepPatch)=>void}

export function LessonPlayer(props:Props){
  const {lesson,index,progress,review=false,storageError,onHome,onStep,updateStep}=props
  const step=lesson.steps[index]??lesson.steps[0]
  const stored=progress.steps[step.id]??emptyStep(step)
  const saved=review&&!stored.reviewActive&&!stored.reviewFinished?{...stored,input:'',selected:[],sequence:[],hintsShown:0,solutionShown:false}:stored
  const [feedback,setFeedback]=useState<{ok:boolean;text:string}|null>(()=>review&&saved.reviewFinished?{ok:true,text:step.solution}:null)
  const [outline,setOutline]=useState(false)
  const [finished,setFinished]=useState(false)
  const [whyOpen,setWhyOpen]=useState(false)
  const [choiceIndex,setChoiceIndex]=useState<number|null>(()=>saved.input!==''&&step.kind==='choice'?Number(saved.input):null)
  useEffect(()=>{
    window.scrollTo({top:0,behavior:'instant'})
  },[])
  const patch=(p:StepPatch)=>updateStep(step.id,current=>{
    const change=typeof p==='function'?p(current):p
    return {...change,reviewActive:change.reviewActive??review}
  })
  const count=completedCount(progress,lesson.id)
  const score=checkpointScore(lesson.steps,progress)
  const canCheck=step.kind==='explore'?Boolean(step.graph&&saved.lab&&goalMet(step.graph,saved.lab))
    :step.kind==='choice'?choiceIndex!==null:step.kind==='number'?saved.input.trim()!==''
    :step.kind==='select'?saved.selected.length>0:step.kind==='interval'?saved.sequence.length===2:step.kind==='formula'?saved.sequence.length===step.formula?.slotLabels.length:step.kind==='order'?saved.sequence.length===step.labels?.length:true
  const alreadyDone=saved.completed&&!review
  function check(){
    let ok:boolean,text=step.solution
    if(step.kind==='choice'){
      ok=choiceIndex===step.answer;text=step.choices?.[choiceIndex??-1]?.feedback??'Выбери вариант.'
    }else if(step.kind==='number'){
      const n=parseAnswer(saved.input),answer=Number(step.answer)
      ok=n!==null&&(answer===0?n===0:Math.abs(n-answer)<=Number.EPSILON*8*Math.max(1,Math.abs(answer)))
      if(!ok)text=numericFeedback(step,saved.input)
    }else if(step.kind==='select'){
      const answer=step.answer as string[];ok=saved.selected.length===answer.length&&saved.selected.every(n=>answer.includes(n))
      if(!ok)text=step.error??'Проверь каждый выбранный и пропущенный вариант. Здесь может быть несколько ответов; одного совпадения недостаточно.'
    }else if(step.kind==='interval'){
      ok=saved.sequence.length===2&&saved.sequence.every((n,i)=>n===(step.answer as string[])[i])
      if(!ok)text=step.error??'Проверь отдельно начало и конец. Между выбранными границами условие должно выполняться на всём интервале.'
    }else if(step.kind==='formula'){
      ok=formulaMatches(step,saved.sequence)
      if(!ok)text=step.error??'Проверь каждое место формулы.'
    }else if(step.kind==='order'){
      ok=saved.sequence.every((n,i)=>n===(step.answer as string[])[i])
      if(!ok)text='В порядке есть ошибка. Сначала читают условие и выбирают правило, затем выполняют вычисления, а проверку оставляют напоследок. Можно убрать действия и собрать цепочку снова.'
    }else if(step.kind==='explore')ok=Boolean(step.graph&&saved.lab&&goalMet(step.graph,saved.lab))
    else ok=true
    if(step.kind==='number'&&parseAnswer(saved.input)===null){setFeedback({ok:false,text});return}
    const next={...saved,attempts:saved.attempts+1,wrongAttempts:saved.wrongAttempts+(ok?0:1),reviewWrongAttempts:saved.reviewWrongAttempts+(review&&!ok?1:0)}
    patch(ok?reviewed(next,step,review):{...next,reviewActive:review,dueAt:review?Date.now():saved.dueAt})
    setFeedback({ok,text})
  }
  function next(){
    if(review){props.onReviewDone();return}
    if(step.kind==='read'&&!saved.completed)patch(reviewed(saved,step))
    if(index<lesson.steps.length-1)onStep(index+1)
    else {
      const pending=lesson.steps.findIndex(s=>s.id!==step.id&&!progress.steps[s.id]?.completed)
      if(pending>=0)onStep(pending)
      else setFinished(true)
    }
  }
  const canContinue=step.kind==='read'||Boolean(feedback?.ok)||alreadyDone
  if(finished)return <div className="completion-page">
    <button className="text-button" onClick={onHome}>К карте курса</button>
    <div className="completion-symbol"><Check size={52}/></div><p className="eyebrow">Урок {lesson.number} · завершён</p>
    <h1>{lesson.title}</h1><p>Ты прошёл {count} из {lesson.steps.length} шагов. Решения и наблюдения сохранены на этом устройстве.</p>
    <div className="checkpoint-result"><span>Итоговая проверка</span><strong>{score.independent} <small>из {score.total}</small></strong><p>Решено самостоятельно с первой попытки</p><div className="checkpoint-dots">{lesson.steps.filter(s=>s.checkpoint).map((s,i)=><span key={s.id} className={score.mistakes.includes(s)?'assisted':'independent'} aria-label={'Задание '+(i+1)+': '+(score.mistakes.includes(s)?'с помощью или исправлением':'самостоятельно')}>{score.mistakes.includes(s)?'↻':'✓'}</span>)}</div>{score.mistakes.length>0&&<button className="secondary-button" onClick={()=>props.onReviewStep(lesson.steps.indexOf(score.mistakes[0]))}>Разобрать ошибки</button>}</div>
    <div className="completion-skills"><BookOpen/><span>{lesson.description}</span></div>
    <p>Задания, в которых понадобились подсказки или исправления, доступны в повторении. Остальные вернутся через день.</p>
    <div className="button-row"><button className="primary-button" onClick={props.onNextLesson}>{props.lastLesson?'К карте курса':'Следующий урок'}</button><button className="secondary-button" onClick={()=>{setFinished(false);onStep(0)}}>Посмотреть ещё раз</button></div>
  </div>
  return <div className="lesson-shell">
    <header className="lesson-topbar"><button className="icon-button" aria-label="Вернуться к карте курса" onClick={onHome}><X size={21}/></button>
      <div className="lesson-identity"><strong>{review?'Повторение · ':''}{String(lesson.number).padStart(2,'0')} / {lesson.title}</strong><span>Шаг {index+1} из {lesson.steps.length}</span></div>
      <button className="outline-toggle" onClick={()=>setOutline(!outline)} aria-expanded={outline}><List size={18}/><span>Шаги урока</span><ChevronDown size={15}/></button>
    </header>
    <div className="lesson-progress" aria-label={count+' шагов выполнено'}>{lesson.steps.map((s,i)=><button key={s.id} className={(progress.steps[s.id]?.completed?'complete ':'')+(i===index?'current':'')} aria-label={'Шаг '+(i+1)+': '+s.title} title={s.title} onClick={()=>onStep(i)}/>)}</div>
    {storageError&&<div className="storage-banner" role="alert">{storageError}</div>}
    {outline&&<nav className="step-outline" aria-label="Шаги урока"><div className="outline-head"><strong>{lesson.steps.length} подробных шагов</strong><button className="text-button" onClick={()=>setOutline(false)}>Закрыть</button></div>{lesson.steps.map((s,i)=><button key={s.id} className={i===index?'active':''} onClick={()=>{onStep(i);setOutline(false)}}><span>{progress.steps[s.id]?.completed?<Check size={16}/>:i+1}</span><div>{s.title}<small>{s.stage}</small></div></button>)}</nav>}
    <main className="lesson-main">
      <div className="step-intro"><p className="eyebrow"><span className="step-kind">{step.stage}</span>{step.checkpoint&&<span>Задание {index-lesson.steps.length+4} из 3</span>}{step.exam&&<span>Самостоятельно</span>}</p><h1>{step.title}</h1><p className="step-body"><MathText text={step.body}/></p>{step.question&&<h2><MathText text={step.question}/></h2>}</div>
      <div className={'workbench '+(!step.graph?'no-graph':'')}>
        {step.graph&&<aside className="graph-column"><GraphLab spec={step.graph} state={saved.lab} selected={saved.selected} outcome={feedback?(feedback.ok?'correct':'retry'):undefined} span={step.kind==='interval'&&saved.sequence.length===2?[Number(saved.sequence[0]),Number(saved.sequence[1])]:undefined} onSelect={step.kind==='select'?label=>{patch(current=>({selected:current.selected.includes(label)?current.selected.filter(n=>n!==label):[...current.selected,label]}));setFeedback(null)}:undefined} onChange={change=>{patch(current=>({lab:typeof change==='function'?change(current.lab??initialLab(step.graph!)):change}));if(!feedback?.ok)setFeedback(null)}}/></aside>}
        <section className="answer-card" aria-label={step.kind==='read'?'Теория':'Задание'}>
          {step.kind==='read'&&<div className="reading-note"><BookOpen size={19}/><span>{step.graph?'Сравни объяснение с рисунком. Когда связь понятна, переходи к следующему шагу.':'Разбери объяснение и пример. На следующих шагах применим этот способ самостоятельно.'}</span></div>}
          {step.kind==='choice'&&<div className="choices">{step.choices?.map((c,i)=><button key={c.text} className={'choice '+(choiceIndex===i?'selected ':'')+(feedback&&choiceIndex===i?(feedback.ok?'correct':'incorrect'):'')} aria-pressed={choiceIndex===i} onClick={()=>{setChoiceIndex(i);patch({input:String(i)});setFeedback(null)}}><span className="choice-letter">{String.fromCharCode(65+i)}</span><MathText text={c.text}/></button>)}</div>}
          {step.kind==='number'&&<form className="number-form" onSubmit={e=>{e.preventDefault();if(canCheck)check()}}>
            <label htmlFor="numeric-answer">Твой ответ</label><input id="numeric-answer" autoComplete="off" inputMode="decimal" maxLength={64} placeholder="Введи число" value={saved.input} onChange={e=>{patch({input:e.target.value});setFeedback(null)}} className={feedback?(feedback.ok?'valid':'invalid'):''}/>
            <div className="number-tools" aria-label="Экранная клавиатура">{['7','8','9','⌫','4','5','6','−','1','2','3','/','C','0',','].map(s=><button key={s} type="button" aria-label={s==='C'?'Очистить ответ':s==='⌫'?'Стереть последний символ':'Вставить '+s} onClick={()=>{patch(current=>({input:s==='C'?'':s==='⌫'?current.input.slice(0,-1):(current.input+s).slice(0,64)}));setFeedback(null)}}>{s}</button>)}</div>
            <p className="input-note">Можно вводить десятичные числа с запятой и дроби: 1/2.</p>
          </form>}
          {step.kind==='select'&&<div className="choices multiple">{step.labels?.map(label=><button key={label} className={'choice '+(saved.selected.includes(label)?'selected':'')} aria-pressed={saved.selected.includes(label)} onClick={()=>{patch(current=>({selected:current.selected.includes(label)?current.selected.filter(n=>n!==label):[...current.selected,label]}));setFeedback(null)}}><span className="checkbox">{saved.selected.includes(label)&&<Check size={16}/>}</span><MathText text={label}/></button>)}<p className="input-note">Выбери все подходящие варианты.</p></div>}
          {step.kind==='interval'&&<div className="interval-answer"><div className="interval-slots"><button aria-label="Левая граница; нажми, чтобы изменить" onClick={()=>{patch({sequence:[]});setFeedback(null)}}>{saved.sequence[0]??'?'}</button><span>&lt; {step.intervalVariable??'x'} &lt;</span><button aria-label="Правая граница; нажми, чтобы изменить" onClick={()=>{patch(current=>({sequence:current.sequence.slice(0,1)}));setFeedback(null)}}>{saved.sequence[1]??'?'}</button></div><div className="interval-pool">{step.labels?.map(label=><button key={label} aria-pressed={saved.sequence.includes(label)} onClick={()=>{patch(current=>({sequence:current.sequence.length<2?[...current.sequence,label]:[current.sequence[0],label]}));setFeedback(null)}}>{label}</button>)}</div><p className="input-note">Выбери сначала левую, затем правую границу. Нажми на границу, чтобы заменить её.</p></div>}
          {step.kind==='formula'&&<FormulaAnswer step={step} sequence={saved.sequence} onChange={change=>{patch(change);setFeedback(null)}}/>}
          {step.kind==='order'&&<div className="ordering">
            <div className="sequence" aria-label="Выбранный порядок">{saved.sequence.length?saved.sequence.map((label,i)=><button key={label} onClick={()=>{patch(current=>({sequence:current.sequence.filter(n=>n!==label)}));setFeedback(null)}}><b>{i+1}</b><MathText text={label}/><span aria-label="Убрать">×</span></button>):<p>Нажимай на действия в нужном порядке.</p>}</div>
            <div className="order-pool">{shuffled(step.labels??[],step.id).filter(label=>!saved.sequence.includes(label)).map(label=><button key={label} onClick={()=>{patch(current=>({sequence:current.sequence.includes(label)?current.sequence:[...current.sequence,label]}));setFeedback(null)}}><MathText text={label}/><span>+</span></button>)}</div>
            <button className="text-button" onClick={()=>{patch({sequence:[]});setFeedback(null)}}><RotateCcw size={15}/>Собрать заново</button>
          </div>}
          {feedback&&<div className={'feedback '+(feedback.ok?'success':'retry')} role="status"><strong>{feedback.ok?'Да, верно':'Разберём ошибку'}</strong>{!feedback.ok&&<><p><MathText text={feedback.text}/></p>{step.hints[0]&&step.hints[0]!==feedback.text&&<p><MathText text={step.hints[0]}/></p>}<button className="text-button why-button" aria-expanded={saved.solutionShown} onClick={()=>patch(current=>({solutionShown:!current.solutionShown,hintsShown:Math.max(1,current.hintsShown)}))}>{saved.solutionShown?'Скрыть решение':'Разобрать решение по шагам'}</button></>}{feedback.ok&&<><button className="text-button why-button" aria-expanded={whyOpen} onClick={()=>setWhyOpen(!whyOpen)}>{whyOpen?'Скрыть объяснение':'Почему?'}</button>{whyOpen&&<p><MathText text={step.solution}/></p>}</>}</div>}
          {saved.solutionShown&&!feedback?.ok&&<div className="solution-box"><strong>Разбор</strong><p><MathText text={step.solution}/></p><small>Используй разбор, чтобы самостоятельно исправить ответ.</small></div>}
          {saved.hintsShown>0&&<div className="hint-stack">{step.hints.slice(0,saved.hintsShown).map((hint,i)=><p key={i}><Lightbulb size={17}/><MathText text={hint}/></p>)}</div>}
          {step.kind!=='read'&&!feedback?.ok&&<div className="help-actions"><button className="text-button" disabled={saved.hintsShown>=step.hints.length} onClick={()=>patch(current=>({hintsShown:Math.min(current.hintsShown+1,step.hints.length)}))}><Lightbulb size={17}/>{saved.hintsShown?'Ещё подсказка':'Нужна подсказка'}</button>{saved.hintsShown>0&&<button className="text-button" onClick={()=>patch(current=>({solutionShown:!current.solutionShown}))}>{saved.solutionShown?'Скрыть разбор':'Показать разбор'}</button>}</div>}
        </section>
      </div>
      <footer className="step-footer"><button className="secondary-button" disabled={index===0||review} onClick={()=>onStep(index-1)}>Назад</button><span className="save-status">{storageError?'Сохранение недоступно':'Сохраняется на этом устройстве'}</span>
        {canContinue?<button className="primary-button" onClick={next}>{review?'К повторению':index===lesson.steps.length-1?'Завершить урок':'Продолжить'}</button>:<button className="primary-button" disabled={!canCheck} onClick={check}>{step.kind==='explore'?'Проверить наблюдение':'Проверить ответ'}<Check size={18}/></button>}</footer>
    </main>
  </div>
}
