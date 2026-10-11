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
  {title:'Приращение и наклон секущей',lesson:2,text:'Приращение аргумента: $\\Delta x=x_2-x_1$. Приращение функции: $\\Delta y=f(x_2)-f(x_1)$. Наклон секущей равен $\\Delta y/\\Delta x$, если $\\Delta x\\ne0$. В обеих разностях вычитай координаты первой точки из координат второй.'},
  {title:'Производная в точке',lesson:7,text:'$f\\prime(a)=\\lim_{h\\to0}(f(a+h)-f(a))/h$. Производная существует, если этот предел конечен и одинаков при приближении к нулю слева и справа. Она показывает скорость изменения функции в точке $a$. Не путай производную $f\\prime(a)$ со значением функции $f(a)$.'},
  {title:'Наклон касательной по клеткам',lesson:8,text:'Наклон касательной равен производной: $k=f\\prime(a)$. Выбери на прямой две точки с известными координатами и вычисли $k=(y_2-y_1)/(x_2-x_1)$. Если считаешь по клеткам, умножь число клеток по горизонтали на цену деления оси $x$, а по вертикали — на цену деления оси $y$. Учитывай знак каждого приращения.'},
  {title:'Знак производной по графику',lesson:11,text:'Сначала проверь, какой график дан. На графике $f$ знак производной определяют по наклону касательной. На графике $f\\prime$ смотрят, где он расположен относительно оси $x$: выше оси — знак плюс, ниже — минус, на оси — ноль. Если $F\\prime=f$, график $f$ показывает производную функции $F$.'},
  {title:'Возрастание и убывание',lesson:12,text:'Если $f\\prime>0$ на интервале, функция $f$ возрастает. Если $f\\prime<0$, она убывает. Производная может равняться нулю в отдельной точке, а функция при этом продолжать возрастать, если по обе стороны производная положительна. Точки, где $f\\prime=0$, не входят в решение неравенств $f\\prime>0$ и $f\\prime<0$.'},
  {title:'Локальные экстремумы',lesson:14,text:'Если производная меняет знак с плюса на минус, это точка максимума. Если с минуса на плюс — точка минимума. Одного равенства $f\\prime(a)=0$ недостаточно: нужно проверить знак по обе стороны от точки. Экстремум возможен и в точке, где производной нет, например в вершине графика $|x|$.'},
  {title:'Наибольшее и наименьшее значения',lesson:16,text:'Для непрерывной функции на отрезке вычисли значения на обоих концах, а также во внутренних точках, где производная равна нулю или не существует. Сравни результаты. Проверь, что нужно записать в ответ: значение функции или аргумент, при котором оно достигается.'},
  {title:'Уравнение касательной и параллельность',lesson:17,text:'Касательная в точке $a$ имеет уравнение $y=f(a)+f\\prime(a)(x-a)$. Её свободный член равен $f(a)-a f\\prime(a)$. Чтобы касательная была параллельна прямой $y=kx+b$, её наклон должен равняться $k$. Поэтому решаем уравнение $f\\prime(a)=k$.'},
  {title:'Основные правила дифференцирования',lesson:19,text:'Производная постоянной: $(C)\\prime=0$. Производная степени: $(x^n)\\prime=nx^{n-1}$. Для суммы: $(u+v)\\prime=u\\prime+v\\prime$. Постоянный множитель можно вынести: $(Cu)\\prime=Cu\\prime$. Для сложной функции: $(g(u))\\prime=g\\prime(u)u\\prime$ — производную внешней функции умножаем на производную внутренней.'},
  {title:'Произведение и частное',lesson:20,text:'$(uv)\\prime=u\\prime v+uv\\prime$. $(u/v)\\prime=(u\\prime v-uv\\prime)/v^2$ при $v\\ne0$. Производная произведения не равна произведению производных.'},
  {title:'Движение вдоль оси',lesson:21,text:'Проекция скорости равна производной координаты: $v(t)=x\\prime(t)$. Она может быть отрицательной: тогда тело движется против направления оси. Модуль скорости равен $|v(t)|$. В момент остановки $v=0$, но координата $x$ может быть любой. Ускорение — производная скорости: $a=v\\prime=x\\prime\\prime$.'},
  {title:'Первообразная и накопление',lesson:22,text:'Функция $F$ — первообразная для $f$, если $F\\prime=f$. Все первообразные на одном интервале отличаются на постоянную: $F+C$. Изменение $F$ от $a$ до $b$ равно $F(b)-F(a)=\\int_a^b f(x)\\,dx$. При $a<b$ площадь под графиком выше оси $x$ учитывают со знаком плюс, а ниже — со знаком минус. Чтобы найти $F(b)$, прибавь это изменение к начальному значению $F(a)$.'},
]

function DataDialog({open,onClose,progress,onImport,storageError}:{open:boolean;onClose:()=>void;progress:Progress;onImport:(raw:unknown)=>void;storageError:string|null}){
  const ref=useRef<HTMLDialogElement>(null),file=useRef<HTMLInputElement>(null)
  const [message,setMessage]=useState(''),[bad,setBad]=useState(false)
  const offline=useOffline()
  useEffect(()=>{if(open&&!ref.current?.open)ref.current?.showModal();if(!open&&ref.current?.open)ref.current?.close()},[open])
  return <dialog ref={ref} className="data-dialog" onCancel={onClose} onClose={onClose}>
    <div className="dialog-heading"><span className="dialog-icon"><HardDrive/></span><button className="icon-button" aria-label="Закрыть" onClick={onClose}><X/></button></div>
    <h2>Сохранение прогресса</h2><p>В этом браузере сохраняются ответы, результаты диагностики, пройденные шаги и настройки графиков. Чтобы перенести прогресс на другое устройство, скачай резервную копию и открой её там.</p>
    <div className={'local-status '+(storageError?'problem':'')}><span/>{storageError??'Прогресс сохраняется в этом браузере'}</div>
    <p className="data-footnote">{offline==='ready'?'Весь курс сохранён. Можно учиться без интернета.':offline==='development'?'Работа без интернета доступна в опубликованной версии курса.':offline==='checking'?'Загружаем курс, чтобы он работал без интернета.':offline==='unavailable'?'В этом браузере работа без интернета недоступна. Открывай курс с подключением к сети.':'Не удалось сохранить весь курс для работы без интернета. Открой сайт ещё раз с подключением к сети.'}</p>
    <div className="data-counts"><strong>Пройдено шагов: {completedCount(progress)}</strong><span>Проверок ответов: {Object.values(progress.steps).reduce((n,s)=>n+s.attempts,0)}</span></div>
    <button className="primary-button full-width" onClick={()=>exportProgress(progress)}><Download size={18}/>Скачать резервную копию</button>
    <button className="secondary-button full-width" onClick={()=>file.current?.click()}><FileUp size={18}/>Восстановить из файла</button>
    <input ref={file} hidden type="file" accept=".json,application/json" onChange={async e=>{
      const f=e.target.files?.[0];if(!f)return
      try{if(f.size>5*1024*1024)throw new Error('Файл слишком большой. Выбери резервную копию Edvora размером до 5 МБ.');onImport(JSON.parse(await f.text()));setBad(false);setMessage('Прогресс восстановлен. Можно продолжить обучение.')}
      catch(error){setBad(true);setMessage(error instanceof SyntaxError?'Не удалось прочитать файл. Выбери резервную копию Edvora.':error instanceof Error?error.message:'Не удалось прочитать файл. Попробуй выбрать его ещё раз.')}
      e.target.value=''
    }}/>
    {message&&<p className={'import-message '+(bad?'error':'')} role="status">{message}</p>}
    {progress.legacy&&<p className="data-footnote">Данные из прежней версии курса тоже включены в резервную копию. Прогресс в новых уроках сохраняется отдельно.</p>}
    <p className="data-footnote">Твой прогресс не отправляется на сервер. Если меняешь браузер или открываешь курс по другому адресу, перенеси его с помощью резервной копии.</p>
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
        <section className="course-hero"><div className="hero-copy"><p className="eyebrow">Математика · профильный ЕГЭ</p><h1>Производная<br/><span>и первообразная</span></h1><p>Понимай графики. Решай задачи ЕГЭ.</p>
          <button className="primary-button hero-button" onClick={()=>onLesson(resume.id,resumeIndex)}><Play size={18} fill="currentColor"/>{hasStarted?'Продолжить обучение':'Начать с основ'}</button><span className="hero-resume">Урок {resume.number} · {resume.title}{hasStarted?' · шаг '+(resumeIndex+1):''}</span>
        </div><div className="hero-art"><div className="hero-art-heading"><span>Увидеть. Попробовать. Понять.</span><span className="graph-badge">f & f′</span></div><GraphLab spec={{model:MODELS.cubic,label:'f(x)=x^3-3x',rangeX:[-2.5,2.5],rangeY:[-5,5],mode:'tangent',at:0,showReadout:false}}/><div className="hero-art-caption"><span className="legend-dot lime"/>Функция<span className="legend-dot gold"/>Касательная в x = 0</div></div></section>
        <section className="course-summary" aria-label="Объём и прогресс курса"><div><strong>{lessons.length}</strong><span>коротких уроков</span></div><div><strong>{totalSteps}</strong><span>шагов с объяснениями</span></div><div><strong>{totalInteractives}</strong><span>интерактивных примеров</span></div><div className="summary-progress"><div className="progress-ring" style={{background:'conic-gradient(var(--green) '+percent+'%, var(--line) 0)'}}><span>{percent}%</span></div><span><b>{doneLessons} / {lessons.length} уроков пройдено</b>{completed} / {totalSteps} шагов</span></div></section>
        <section className="diagnostic-entry"><span className="diagnostic-icon"><ClipboardCheck size={25}/></span><div><p className="eyebrow">Перед блоками курса</p><h2>{diagnosticResult?'Твой стартовый результат':'Входная диагностика'}</h2><p>{diagnosticResult?`${diagnosticResult.correct} из 20 верно. ${diagnosticResult.priority.length?'В первую очередь: '+diagnosticResult.priority.map(row=>'блок '+row.id).join(', ')+'.':'Все проверенные навыки — уверенно.'}`:'20 заданий от простых к сложным. Узнай свой уровень и получи рекомендации по блокам и конкретным урокам.'}</p></div><button className="primary-button" onClick={()=>onView('diagnostic')}>{diagnosticResult?'Посмотреть маршрут':diagnosis?'Продолжить диагностику':'Пройти диагностику'}</button></section>
        <div className="route-heading"><div><p className="eyebrow">Твой маршрут</p><h2>Одна идея за другой</h2></div><p>Иди по порядку или вернись к нужной теме. Все уроки открыты.</p></div>
        <div className="units">{UNITS.map(u=><section className="unit" key={u.id}><div className="unit-heading"><span>{String(u.id).padStart(2,'0')}</span><div><h2>{u.title}</h2><p>{u.description}</p></div></div><div className="lesson-grid">{lessons.filter(l=>l.unit===u.id).map(renderCard)}</div></section>)}</div>
      </>}
      {view==='review'&&<section className="review-page"><p className="eyebrow"><RotateCcw size={16}/>Закрепление знаний</p><h1>Повторение</h1><p className="page-lead">Если в задании были ошибки или понадобились подсказки, оно сразу появится здесь. Задания, решённые самостоятельно, предложим повторить через день. После успешных повторений перерыв постепенно увеличится до 3, 7, 14 и 30 дней.</p>
        <div className="review-summary"><span className="review-count">{due.length}</span><div><strong>{due.length?'Задания для повторения':'Пока нечего повторять'}</strong><p>{due.length?'Реши задания ещё раз. Предыдущие ответы будут скрыты.':'Здесь появятся задания из уроков, когда придёт время их повторить.'}</p></div>{due.length>0&&<button className="primary-button" onClick={()=>onLesson(due[0].lesson.id,due[0].index,true)}>Начать повторение</button>}</div>
        {due.length>0&&<div className="review-list">{due.map(({lesson,step,index})=><button key={step.id} onClick={()=>onLesson(lesson.id,index,true)}><span className="review-dot"/><div><strong>{step.title}</strong><span>Урок {lesson.number}: {lesson.title} · шаг {index+1}</span></div></button>)}</div>}
        {allReview.filter(x=>(x.p.dueAt??0)>clock).length>0&&<div className="future-review"><h2>Следующее повторение</h2><p>Запланировано заданий: {allReview.filter(x=>(x.p.dueAt??0)>clock).length}. Они начнут появляться здесь {new Date(Math.min(...allReview.filter(x=>(x.p.dueAt??0)>clock).map(x=>x.p.dueAt!))).toLocaleString('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}.</p></div>}
      </section>}
      {view==='reference'&&<section className="reference-page"><p className="eyebrow"><BookOpen size={16}/>Формулы и правила</p><h1>Справочник</h1><p className="page-lead">Здесь собраны основные формулы и правила. Чтобы посмотреть примеры, открой урок по нужной теме.</p><div className="reference-grid">{refs.map(r=><article key={r.title}><span className="reference-number">{String(lessons.find(l=>l.topic===r.lesson)!.number).padStart(2,'0')}</span><h2>{r.title}</h2><p><MathText text={r.text}/></p><button className="text-button" onClick={()=>onLesson(lessons.find(l=>l.topic===r.lesson)!.id,0)}>Открыть урок</button></article>)}</div></section>}
    </main>
    <footer className="site-footer"><span className="brand small">edvora.</span><p>Математика для профильного ЕГЭ</p><button className="text-button" onClick={()=>setDataOpen(true)}><HardDrive size={16}/>Сохранение прогресса</button></footer>
    <DataDialog open={dataOpen} onClose={()=>setDataOpen(false)} progress={progress} onImport={onImport} storageError={storageError}/>
  </div>
}
