import { BookOpen,Check,ClipboardCheck,Download,FileUp,HardDrive,Play,RotateCcw,X } from 'lucide-react'
import { useEffect,useRef,useState } from 'react'
import { lessons,totalSteps,totalInteractives,UNITS } from '../curriculum'
import type { Lesson } from '../curriculum/schema'
import { MODELS } from '../math/models'
import { GraphLab } from './GraphLab'
import { completedCount,dueSteps,exportProgress } from './progress'
import type { Progress } from './progress'
import { MathText } from './MathText'
import { useOffline } from './useOffline'
import { diagnosticReport } from './diagnosticLogic'

export type View='course'|'review'|'reference'|'diagnostic'
type Props={progress:Progress;storageError:string|null;view:View;onView:(view:View)=>void;onLesson:(id:string,index?:number,review?:boolean)=>void;onImport:(raw:unknown)=>void}
const refs=[
  {title:'Приращение и средний наклон',lesson:2,text:'$\\Delta x=x_2-x_1$, $\\Delta y=f(x_2)-f(x_1)$. Средний наклон: $\\Delta y/\\Delta x$, если $\\Delta x\\ne0$. Порядок вычитания в обеих разностях должен совпадать.'},
  {title:'Производная в точке',lesson:7,text:'$f\\prime(a)=\\lim_{h\\to0}(f(a+h)-f(a))/h$, если существует конечный общий предел с двух сторон. Это локальная скорость изменения, а не высота функции.'},
  {title:'Касательная и клетки',lesson:8,text:'У касательной $k=f\\prime(a)$. Выбери две точные точки прямой и вычисли $k=(y_2-y_1)/(x_2-x_1)$. Каждое количество клеток умножается на цену деления своей оси.'},
  {title:'Знак: сначала подпись графика',lesson:11,text:'Если нарисована $f$, знак $f\\prime$ читают по локальному направлению. Если нарисована $f\\prime$, знак читают по её высоте. При $F\\prime=f$ график $f$ играет роль производной для $F$.'},
  {title:'Возрастание и убывание',lesson:12,text:'Если $f\\prime>0$ на интервале, $f$ возрастает; если $f\\prime<0$, убывает. Изолированный ноль производной не мешает возрастанию, если знак вокруг сохраняется. Строгие знаки не включают нулевые значения.'},
  {title:'Локальные экстремумы',lesson:14,text:'Переход знака производной $+\\to-$ даёт максимум, $-\\to+$ — минимум. Равенство $f\\prime(a)=0$ само по себе не доказывает экстремум. В точке угла экстремум возможен без производной.'},
  {title:'Наибольшее и наименьшее',lesson:16,text:'На закрытом отрезке у непрерывной функции проверь концы, внутренние стационарные точки и точки без производной. Сравни значения $f$. Уточни, спрашивают значение или аргумент, где оно достигается.'},
  {title:'Параллельность и уравнение прямой',lesson:17,text:'Для параллельности $y=kx+b$ решаем $f\\prime(a)=k$. Уравнение касательной: $y=f(a)+f\\prime(a)(x-a)$. Свободный член равен $f(a)-a f\\prime(a)$.'},
  {title:'Базовые правила',lesson:19,text:'$(C)\\prime=0$, $(x^n)\\prime=nx^{n-1}$, $(u+v)\\prime=u\\prime+v\\prime$, $(Cu)\\prime=Cu\\prime$. Для цепочки $(g(u))\\prime=g\\prime(u)u\\prime$.'},
  {title:'Произведение и частное',lesson:20,text:'$(uv)\\prime=u\\prime v+uv\\prime$. $(u/v)\\prime=(u\\prime v-uv\\prime)/v^2$ при $v\\ne0$. Производная произведения не равна произведению производных.'},
  {title:'Движение на оси',lesson:21,text:'Проекция скорости $v(t)=x\\prime(t)$ может быть отрицательной. Модуль скорости равен $|v(t)|$. Остановка означает $v=0$, но не обязательно $x=0$. Ускорение $a=v\\prime=x\\prime\\prime$.'},
  {title:'Первообразная и накопление',lesson:22,text:'$F\\prime=f$. Первообразные отличаются постоянной: $F+C$. $F(b)-F(a)=\\int_a^b f(x)\\,dx$. Площадь ниже оси входит в интеграл со знаком минус; к приращению добавляют начальное значение.'},
]

function DataDialog({open,onClose,progress,onImport,storageError}:{open:boolean;onClose:()=>void;progress:Progress;onImport:(raw:unknown)=>void;storageError:string|null}){
  const ref=useRef<HTMLDialogElement>(null),file=useRef<HTMLInputElement>(null)
  const [message,setMessage]=useState(''),[bad,setBad]=useState(false)
  const offline=useOffline()
  useEffect(()=>{if(open&&!ref.current?.open)ref.current?.showModal();if(!open&&ref.current?.open)ref.current?.close()},[open])
  return <dialog ref={ref} className="data-dialog" onCancel={onClose} onClose={onClose}>
    <div className="dialog-heading"><span className="dialog-icon"><HardDrive/></span><button className="icon-button" aria-label="Закрыть" onClick={onClose}><X/></button></div>
    <h2>Твой прогресс — у тебя</h2><p>Ответы, результаты диагностики, пройденные шаги и положения ползунков сохраняются в этом браузере. Резервная копия переносит их на другое устройство.</p>
    <div className={'local-status '+(storageError?'problem':'')}><span/>{storageError??'Локальное сохранение доступно'}</div>
    <p className="data-footnote">{offline==='ready'?'Весь курс сохранён для работы без сети.':offline==='development'?'Офлайн-пакет подключится после публикации сайта.':offline==='checking'?'Курс загружается для работы без сети.':offline==='unavailable'?'Для офлайн-режима открой сайт по HTTPS или на localhost.':'Не удалось полностью загрузить офлайн-пакет. Открой сайт с подключением к сети ещё раз.'}</p>
    <div className="data-counts"><strong>{completedCount(progress)} выполненных шагов</strong><span>{Object.values(progress.steps).reduce((n,s)=>n+s.attempts,0)} проверок ответов</span></div>
    <button className="primary-button full-width" onClick={()=>exportProgress(progress)}><Download size={18}/>Скачать резервную копию</button>
    <button className="secondary-button full-width" onClick={()=>file.current?.click()}><FileUp size={18}/>Восстановить из файла</button>
    <input ref={file} hidden type="file" accept=".json,application/json" onChange={async e=>{
      const f=e.target.files?.[0];if(!f)return
      try{if(f.size>5*1024*1024)throw new Error('Файл слишком большой. Нужен JSON прогресса до 5 МБ.');onImport(JSON.parse(await f.text()));setBad(false);setMessage('Прогресс восстановлен. Можно продолжать урок.')}
      catch(error){setBad(true);setMessage(error instanceof Error?error.message:'Не удалось прочитать файл.')}
      e.target.value=''
    }}/>
    {message&&<p className={'import-message '+(bad?'error':'')} role="status">{message}</p>}
    {progress.legacy&&<p className="data-footnote">Сохранения прежнего пилота включены в резервную копию. Новые уроки ведут отдельный прогресс.</p>}
    <p className="data-footnote">Учебные данные не отправляются на сервер. Для другого браузера или адреса сайта используй экспорт и импорт.</p>
  </dialog>
}
export function CourseMap({progress,storageError,view,onView,onLesson,onImport}:Props){
  const [dataOpen,setDataOpen]=useState(false),[clock,setClock]=useState(()=>Date.now())
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),60000);return()=>clearInterval(timer)},[])
  const completed=completedCount(progress),percent=Math.round(completed/totalSteps*100),due=dueSteps(progress,clock)
  const doneLessons=lessons.filter(l=>completedCount(progress,l.id)===l.steps.length).length
  const last=lessons.find(l=>l.id===progress.lastLesson)
  const resume=last&&completedCount(progress,last.id)<last.steps.length?last:lessons.find(l=>completedCount(progress,l.id)<l.steps.length)??lessons[lessons.length-1]
  const hasStarted=Boolean(last)||completed>0
  const diagnosis=progress.diagnostic?.current
  const diagnosticResult=diagnosis?.completedAt?diagnosticReport(diagnosis):undefined
  const resumeIndex=progress.cursor[resume.id]??0
  const allReview=lessons.flatMap(l=>l.steps.map((step,index)=>({lesson:l,step,index,p:progress.steps[step.id]}))).filter(x=>x.p?.completed&&x.p.dueAt!==undefined)
  function renderCard(l:Lesson){
    const n=completedCount(progress,l.id),done=n===l.steps.length,started=n>0||progress.cursor[l.id]!==undefined
    return <button key={l.id} className={'lesson-card '+(done?'done ':'')+(l.id===resume.id?'recommended':'')} onClick={()=>onLesson(l.id,progress.cursor[l.id]??0)}>
      <div className="card-top"><span className={'lesson-number '+(done?'checked':'')}>{done?<Check size={17}/>:String(l.number).padStart(2,'0')}</span><span className="card-step-count">{l.steps.length} шагов</span>{l.id===resume.id&&!done&&<span className="next-badge">{started?'Продолжить':'Начни здесь'}</span>}</div>
      <h3>{l.title}</h3><p>{l.description}</p><div className="card-bottom"><span>{done?'Урок пройден':started?n+' / '+l.steps.length+' выполнено':'Начать урок'}</span>{done?<Check size={17}/>:<Play size={16}/>}</div><div className="card-progress"><span style={{width:n/l.steps.length*100+'%'}}/></div>
    </button>
  }
  return <div className="course-shell">
    <header className="site-header"><button className="brand" onClick={()=>onView('course')} aria-label="Edvora, карта курса"><span className="brand-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18L10 11L15 14L22 4M3 4V21H22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>edvora<span className="brand-dot">.</span></button>
      <nav className="main-nav" aria-label="Основные разделы">{[['course','Курс'],['review','Повторение'],['reference','Справочник']].map(([id,label])=><button key={id} className={view===id?'active':''} onClick={()=>onView(id as View)}>{label}{id==='review'&&due.length>0&&<span className="nav-count">{due.length}</span>}</button>)}</nav>
      <button className="data-button" onClick={()=>setDataOpen(true)}><HardDrive size={17}/><span>Мои данные</span></button>
    </header>
    {storageError&&<div className="storage-banner" role="alert">{storageError}<button onClick={()=>setDataOpen(true)}>Скачать копию</button></div>}
    <main className="course-main">
      {view==='course'&&<>
        <section className="course-hero"><div className="hero-copy"><p className="eyebrow">Математика · профильный ЕГЭ</p><h1>Производная<br/><span>и первообразная</span></h1><p>Научись видеть смысл графика, объяснять каждое действие и решать задачи самостоятельно.</p>
          <button className="primary-button hero-button" onClick={()=>onLesson(resume.id,resumeIndex)}><Play size={18} fill="currentColor"/>{hasStarted?'Продолжить обучение':'Начать с основ'}</button><span className="hero-resume">Урок {resume.number} · {resume.title}{hasStarted?' · шаг '+(resumeIndex+1):''}</span>
        </div><div className="hero-art"><div className="hero-art-heading"><span>Увидеть. Попробовать. Понять.</span><span className="graph-badge">f & f′</span></div><GraphLab spec={{model:MODELS.cubic,label:'f(x)=x^3-3x',rangeX:[-2.5,2.5],rangeY:[-5,5],mode:'tangent',at:0,showReadout:false}}/><div className="hero-art-caption"><span className="legend-dot lime"/>Функция<span className="legend-dot gold"/>Касательная в x = 0</div></div></section>
        <section className="course-summary" aria-label="Объём и прогресс курса"><div><strong>{lessons.length}</strong><span>коротких уроков</span></div><div><strong>{totalSteps}</strong><span>шагов с объяснениями</span></div><div><strong>{totalInteractives}</strong><span>исследований с управлением</span></div><div className="summary-progress"><div className="progress-ring" style={{background:'conic-gradient(var(--green) '+percent+'%, var(--line) 0)'}}><span>{percent}%</span></div><span><b>{doneLessons} / {lessons.length} уроков пройдено</b>{completed} / {totalSteps} шагов</span></div></section>
        <section className="diagnostic-entry"><span className="diagnostic-icon"><ClipboardCheck size={25}/></span><div><p className="eyebrow">Перед блоками курса</p><h2>{diagnosticResult?'Твой стартовый результат':'Входная диагностика'}</h2><p>{diagnosticResult?`${diagnosticResult.correct} из 20 верно. ${diagnosticResult.priority.length?'В первую очередь: '+diagnosticResult.priority.map(row=>'блок '+row.id).join(', ')+'.':'Все проверенные навыки — уверенно.'}`:'20 заданий от простых к сложным. Узнай свой уровень и получи рекомендации по блокам и конкретным урокам.'}</p></div><button className="primary-button" onClick={()=>onView('diagnostic')}>{diagnosticResult?'Посмотреть маршрут':diagnosis?'Продолжить диагностику':'Пройти диагностику'}</button></section>
        <div className="route-heading"><div><p className="eyebrow">Твой маршрут</p><h2>Одна идея за другой</h2></div><p>Иди по порядку или вернись к нужной теме. Все уроки открыты.</p></div>
        <div className="units">{UNITS.map(u=><section className="unit" key={u.id}><div className="unit-heading"><span>{String(u.id).padStart(2,'0')}</span><div><h2>{u.title}</h2><p>{u.description}</p></div></div><div className="lesson-grid">{lessons.filter(l=>l.unit===u.id).map(renderCard)}</div></section>)}</div>
      </>}
      {view==='review'&&<section className="review-page"><p className="eyebrow"><RotateCcw size={16}/>Возвращаемся к важному</p><h1>Повторение с пониманием</h1><p className="page-lead">Задачи после ошибок и подсказок возвращаются сразу. Уверенные ответы — через день; успешные повторения увеличивают интервал до 3, 7, 14 и 30 дней.</p>
        <div className="review-summary"><span className="review-count">{due.length}</span><div><strong>{due.length?'Заданий готовы к повторению':'На сейчас всё закреплено'}</strong><p>{due.length?'Попробуй решить их ещё раз без старого ответа перед глазами.':'После завершения практических шагов здесь появятся задания для закрепления.'}</p></div>{due.length>0&&<button className="primary-button" onClick={()=>onLesson(due[0].lesson.id,due[0].index,true)}>Начать повторение</button>}</div>
        {due.length>0&&<div className="review-list">{due.map(({lesson,step,index})=><button key={step.id} onClick={()=>onLesson(lesson.id,index,true)}><span className="review-dot"/><div><strong>{step.title}</strong><span>Урок {lesson.number}: {lesson.title} · шаг {index+1}</span></div></button>)}</div>}
        {allReview.filter(x=>(x.p.dueAt??0)>clock).length>0&&<div className="future-review"><h2>Вернутся позже</h2><p>{allReview.filter(x=>(x.p.dueAt??0)>clock).length} заданий запланировано. Ближайшее повторение: {new Date(Math.min(...allReview.filter(x=>(x.p.dueAt??0)>clock).map(x=>x.p.dueAt!))).toLocaleString('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}.</p></div>}
      </section>}
      {view==='reference'&&<section className="reference-page"><p className="eyebrow"><BookOpen size={16}/>Правила, к которым можно вернуться</p><h1>Справочник без путаницы</h1><p className="page-lead">Короткая опора после подробного объяснения. Нужен разбор с примерами — открой соответствующий урок.</p><div className="reference-grid">{refs.map(r=><article key={r.title}><span className="reference-number">{String(lessons.find(l=>l.topic===r.lesson)!.number).padStart(2,'0')}</span><h2>{r.title}</h2><p><MathText text={r.text}/></p><button className="text-button" onClick={()=>onLesson(lessons.find(l=>l.topic===r.lesson)!.id,0)}>Разобрать в уроке</button></article>)}</div></section>}
    </main>
    <footer className="site-footer"><span className="brand small">edvora.</span><p>Разобраться. Попробовать. Закрепить.</p><button className="text-button" onClick={()=>setDataOpen(true)}><HardDrive size={16}/>Прогресс на устройстве</button></footer>
    <DataDialog open={dataOpen} onClose={()=>setDataOpen(false)} progress={progress} onImport={onImport} storageError={storageError}/>
  </div>
}
