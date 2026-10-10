import { useEffect,useState } from 'react'
import { ArrowLeft,Check,ChevronRight,ClipboardCheck,RotateCcw } from 'lucide-react'
import { diagnosticTasks,sourceLabel } from '../curriculum/diagnostic'
import { formatNumber,parseAnswer } from '../math/exact'
import { correctDiagnostic,diagnosticComplete,diagnosticReport,emptyDiagnosticAnswer,restartDiagnostic } from './diagnosticLogic'
import type { DiagnosticAnswer,DiagnosticArchive,DiagnosticChange,DiagnosticRound } from './diagnosticLogic'
import { MathText } from './MathText'
import { NumberEntry } from './NumberEntry'
import { GraphLab } from './GraphLab'
import { DiagnosticFigure } from './DiagnosticFigure'

type Props={data?:DiagnosticArchive;storageError:string|null;onChange:(change:DiagnosticChange)=>void;onHome:()=>void;onLesson:(id:string)=>void}
const statusLabel:Record<string,string>={recommended:'Рекомендуем пройти',unmeasured:'Пока недостаточно данных',practice:'Стоит закрепить',strong:'Уверенно в проверенных задачах'}
const levels=['Базовые задания','Графики и формулы','Исследование функций','Задания в несколько действий']
export function DiagnosticPlayer({data,storageError,onChange,onHome,onLesson}:Props){
  const [message,setMessage]=useState('')
  const round=data?.current
  const task=diagnosticTasks[round?.cursor??0]
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'})},[task.id,round?.completedAt])
  const back=<button className="text-button" onClick={onHome}><ArrowLeft size={17}/>К карте курса</button>
  const error=storageError&&<div className="storage-banner" role="alert">{storageError}</div>
  const start=()=>{setMessage('');onChange(restartDiagnostic)}
  if(!round)return <div className="diagnostic-shell">
    <header className="diagnostic-topbar">{back}<span>Входная диагностика</span></header>{error}
    <main className="diagnostic-intro"><span className="diagnostic-icon"><ClipboardCheck size={28}/></span><p className="eyebrow">Перед началом курса</p><h1>С чего начать именно тебе</h1>
      <p className="page-lead">Проверь, как ты читаешь графики, находишь производные и работаешь с первообразными. По результатам предложим блоки и конкретные уроки, которые стоит пройти в первую очередь.</p>
      <div className="diagnostic-facts"><span><strong>20</strong> заданий</span><span><strong>5</strong> блоков курса</span><span><strong>35–45</strong> минут примерно</span></div>
      <div className="diagnostic-instructions"><h2>Как пройти диагностику</h2><p>Задания идут от простых к более сложным. Решай самостоятельно, без подсказок. Если не знаешь способ решения, нажми «Не знаю»: это поможет точнее выбрать темы для обучения.</p><p>Перед отправкой ответа отметь, уверен ли ты в решении. Проверка и подробные разборы появятся после последнего задания. До завершения можно вернуться к любому ответу и изменить его.</p><p>Ответы сохраняются после каждого действия. Можно сделать перерыв и продолжить с того же места.</p></div>
      <p className="diagnostic-provenance">16 заданий взяты из официальных демоверсий ФИПИ 2023, 2025 и 2026 годов и открытого варианта 2026 года. Ещё 4 задания на первообразную составлены для Edvora и отдельно подписаны как авторские.</p>
      <button className="primary-button" onClick={start}>Начать диагностику<ChevronRight size={18}/></button><button className="text-button diagnostic-later" onClick={onHome}>Перейти к урокам</button>
    </main>
  </div>
  if(round.completedAt){
    const report=diagnosticReport(round)
    return <div className="diagnostic-shell"><header className="diagnostic-topbar">{back}<span>Результат диагностики</span></header>{error}
      <main className="diagnostic-results"><p className="eyebrow">Стартовый уровень · {new Date(round.completedAt).toLocaleDateString('ru-RU')}</p><h1>Твой маршрут обучения</h1>
        <div className="diagnostic-score"><strong>{report.correct}<small> / {report.total}</small></strong><div><b>верных ответов</b><p>{report.skipped?`Пропущено: ${report.skipped}. По этим темам пока недостаточно данных.`:'Все задания выполнены.'}</p></div></div>
        <p className="page-lead">{report.priority.length?'Начни с рекомендованных блоков в указанном порядке. Сначала восстанови основу, затем переходи к более сложным заданиям.':'В этой подборке ты уверенно справился со всеми заданиями. Можно выбрать интересующие темы или начать с итоговой практики.'}</p>
        <div className="diagnostic-unit-results">{report.rows.map(row=><section key={row.id} className={'diagnostic-unit '+row.status}><div className="diagnostic-unit-title"><span>{String(row.id).padStart(2,'0')}</span><div><h2>{row.title}</h2><p>{statusLabel[row.status]}</p></div><strong>{row.correct} / {row.total}</strong></div>
          <p>{row.wrong>0&&`Ошибок: ${row.wrong}. `}{row.skipped>0&&`Пропущено: ${row.skipped}. `}{row.unsure>0&&`Верных, но неуверенных ответов: ${row.unsure}. `}{row.status==='strong'&&'Результат относится к навыкам, проверенным этими заданиями.'}</p>
          {row.skills.length>0&&<p className="diagnostic-skills">Повторить: {row.skills.join('; ').toLocaleLowerCase('ru-RU')}.</p>}
          {row.lessons.length>0&&<div className="diagnostic-lesson-links">{row.lessons.map(l=><button key={l.id} onClick={()=>onLesson(l.id)}><span>Урок {l.number}</span>{l.title}<ChevronRight size={16}/></button>)}</div>}
        </section>)}</div>
        {report.priority.length>0&&<div className="diagnostic-priority"><h2>Приоритетный порядок</h2><p>{report.priority.map(row=>'Блок '+row.id).join(' → ')}</p><button className="primary-button" onClick={()=>onLesson(report.priority[0].lessons[0].id)}>Начать с первого рекомендованного урока<ChevronRight size={18}/></button></div>}
        <p className="diagnostic-scope">Диагностика проверяет отдельные навыки и помогает выбрать маршрут. Она не отмечает уроки пройденными. Все блоки остаются доступны.</p>
        <h2 className="diagnostic-review-heading">Ответы и разборы</h2><div className="diagnostic-solutions">{diagnosticTasks.map((item,i)=>{
          const a=round.answers[item.id],ok=correctDiagnostic(item.id,a)
          return <details key={item.id} className={ok?'correct':a.skipped?'skipped':'incorrect'}><summary><span>{i+1}</span><div><b>{item.title}</b><small>{a.skipped?'Пропущено':ok?'Верно':'Ошибка'}{!a.skipped&&a.confidence==='unsure'?' · ответ был неуверенным':''}</small></div>{ok?<Check size={19}/>:<ChevronRight size={19}/>}</summary>
            <div className="diagnostic-solution"><p><MathText text={item.question}/></p>{item.image&&<DiagnosticFigure image={item.image} alt={item.alt}/>}{item.graph&&<GraphLab spec={item.graph}/>}
              <p>Твой ответ: <b>{a.skipped?'Не знаю':a.input}</b>. Правильный ответ: <b>{formatNumber(item.answer,8)}</b>.</p><p><MathText text={item.solution}/></p><p className="diagnostic-source">{item.source.url?<a href={item.source.url} target="_blank" rel="noopener noreferrer">{sourceLabel(item.source)} · стр. {item.source.page}</a>:sourceLabel(item.source)}</p>
            </div></details>
        })}</div>
        <div className="button-row"><button className="secondary-button" onClick={start}><RotateCcw size={17}/>Пройти ещё раз</button><button className="primary-button" onClick={onHome}>К карте курса</button></div>
        {data.history.length>0&&<p className="diagnostic-history">Сохранено предыдущих измерений: {data.history.length}. Первый результат: {diagnosticReport(data.history[0]).correct} из 20. История входит в резервную копию прогресса.</p>}
      </main></div>
  }
  const saved=round.answers[task.id]??emptyDiagnosticAnswer()
  const submitted=diagnosticTasks.filter(t=>round.answers[t.id]?.submittedAt).length
  function changeRound(change:(r:DiagnosticRound)=>DiagnosticRound){onChange(d=>d&&!d.current.completedAt?{...d,current:change(d.current)}:d??restartDiagnostic())}
  function patch(change:(a:DiagnosticAnswer)=>DiagnosticAnswer){setMessage('');changeRound(r=>({...r,answers:{...r.answers,[task.id]:{...change(r.answers[task.id]??emptyDiagnosticAnswer()),submittedAt:undefined}}}))}
  function go(index:number){setMessage('');changeRound(r=>({...r,cursor:index}))}
  function submit(skipped=false){
    if(!skipped&&parseAnswer(saved.input)===null){setMessage('Введи одно число. Поддерживаются запятая и дроби: например −2, 0,5 или 1/2.');return}
    if(!skipped&&!saved.confidence){setMessage('Отметь, уверен ли ты в своём решении.');return}
    setMessage('')
    changeRound(r=>{
      const next={...r,answers:{...r.answers,[task.id]:{...(r.answers[task.id]??emptyDiagnosticAnswer()),skipped,submittedAt:Date.now()}}}
      if(diagnosticComplete(next))return {...next,completedAt:Date.now()}
      if(r.cursor<diagnosticTasks.length-1)return {...next,cursor:r.cursor+1}
      return {...next,cursor:diagnosticTasks.findIndex(t=>!next.answers[t.id]?.submittedAt)}
    })
  }
  return <div className="diagnostic-shell"><header className="diagnostic-topbar">{back}<span>Диагностика · {round.cursor+1} / 20</span></header>{error}
    <div className="diagnostic-progress" aria-label={`${submitted} из 20 ответов сохранено`}><span style={{width:submitted/diagnosticTasks.length*100+'%'}}/></div>
    <main className="diagnostic-question"><p className="eyebrow">{levels[task.level-1]} · уровень {task.level} / 4</p><h1>{task.title}</h1><p className="diagnostic-source">{sourceLabel(task.source)}</p><h2><MathText text={task.question}/></h2>
      <div className={'workbench '+(!task.image&&!task.graph?'no-graph':'')}>{(task.image||task.graph)&&<aside className="graph-column">{task.image&&<DiagnosticFigure image={task.image} alt={task.alt}/>}{task.graph&&<GraphLab spec={task.graph}/>}</aside>}
        <form className="answer-card" onSubmit={e=>{e.preventDefault();submit()}}><NumberEntry id="diagnostic-answer" value={saved.input} onChange={change=>patch(a=>({...a,input:change(a.input),skipped:false}))} invalid={Boolean(message)}/>
          <fieldset className="diagnostic-confidence"><legend>Насколько ты уверен в решении?</legend>{[['confident','Уверен в решении'],['unsure','Сомневаюсь']].map(([value,label])=><button key={value} type="button" aria-pressed={saved.confidence===value} className={saved.confidence===value?'selected':''} onClick={()=>patch(a=>({...a,confidence:value as DiagnosticAnswer['confidence']}))}>{label}</button>)}</fieldset>
          {message&&<p className="diagnostic-input-error" role="alert">{message}</p>}<button type="submit" className="primary-button full-width">{submitted===19&&!saved.submittedAt?'Завершить и увидеть результат':'Сохранить ответ и продолжить'}<ChevronRight size={18}/></button>
          <button type="button" className="text-button diagnostic-skip" onClick={()=>submit(true)}>Не знаю</button><p className="input-note">Проверка ответов и разборы появятся после завершения.</p>
        </form></div>
      <nav className="diagnostic-task-nav" aria-label="Задания диагностики">{diagnosticTasks.map((item,i)=><button key={item.id} className={(round.answers[item.id]?.submittedAt?'answered ':'')+(i===round.cursor?'current':'')} aria-label={'Задание '+(i+1)+(round.answers[item.id]?.submittedAt?' · ответ сохранён':'')} aria-current={i===round.cursor?'step':undefined} onClick={()=>go(i)}>{i+1}</button>)}</nav>
      <div className="diagnostic-question-footer">{round.cursor>0?<button className="text-button" onClick={()=>go(round.cursor-1)}><ArrowLeft size={16}/>Предыдущее задание</button>:<span/>}<span>{submitted} / 20 ответов сохранено</span></div>
    </main></div>
}
