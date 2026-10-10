import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'
import { lessons } from '../src/curriculum'
import { CourseMap } from '../src/v2/CourseMap'
import { LessonPlayer } from '../src/v2/LessonPlayer'
import { emptyProgress,emptyStep } from '../src/v2/progress'
import { DiagnosticPlayer } from '../src/v2/DiagnosticPlayer'
import { diagnosticTasks } from '../src/curriculum/diagnostic'
import { newDiagnostic } from '../src/v2/diagnosticLogic'
import { formatNumber } from '../src/math/exact'
import '../src/index.css'
import '../src/v2/diagnostic.css'
import 'katex/dist/katex.min.css'
const progress=emptyProgress(),noop=()=>{},batch=Number(new URLSearchParams(location.search).get('batch')??0)
export function OpenExplanations(){useEffect(()=>{document.querySelectorAll('details').forEach(el=>el.open=true)},[]);return null}
const entries=lessons.flatMap(lesson=>lesson.steps.map((step,index)=>({lesson,step,index}))).slice(batch*120,(batch+1)*120)
for(const lesson of lessons)for(const step of lesson.steps){
  progress.steps[step.id]={...emptyStep(step),hintsShown:step.hints.length,solutionShown:step.kind!=='read',input:typeof step.answer==='number'?formatNumber(step.answer,8):'',selected:step.kind==='select'?step.labels??[]:[],sequence:['formula','order','interval'].includes(step.kind)?step.answer as string[]:[]}
}
createRoot(document.getElementById('root')!).render(<div data-batch={batch}>
  <OpenExplanations/>
  {(['course','reference','review'] as const).map(view=><section data-screen={'map-'+view} key={view}><CourseMap progress={progress} storageError={null} view={view} onView={noop} onLesson={noop} onImport={noop}/></section>)}
  {entries.map(({lesson,step,index})=><section data-screen={step.id} key={step.id}><LessonPlayer lesson={lesson} index={index} progress={progress} storageError={null} onHome={noop} onStep={noop} onNextLesson={noop} onReviewDone={noop} onReviewStep={noop} lastLesson={lesson.number===lessons.length} updateStep={noop}/></section>)}
  {batch===0&&<><section data-screen="diagnostic-intro"><DiagnosticPlayer storageError={null} onChange={noop} onHome={noop} onLesson={noop}/></section>
    {diagnosticTasks.map((task,cursor)=><section data-screen={task.id} key={task.id}><DiagnosticPlayer data={{current:{...newDiagnostic(),cursor},history:[]}} storageError={null} onChange={noop} onHome={noop} onLesson={noop}/></section>)}
    {['correct','wrong','skipped','uncertain','mixed'].map(scenario=>{
      const round=newDiagnostic();round.answers=Object.fromEntries(diagnosticTasks.map(task=>[task.id,{input:scenario==='wrong'||scenario==='mixed'&&task.unit>=4?'999':String(task.answer),confidence:scenario==='uncertain'?'unsure' as const:'confident' as const,skipped:scenario==='skipped',submittedAt:Date.now()}]));round.completedAt=Date.now()
      return <section data-screen={'diagnostic-results-'+scenario} key={scenario}><DiagnosticPlayer data={{current:round,history:[]}} storageError={null} onChange={noop} onHome={noop} onLesson={noop}/></section>
    })}
  </>}
</div>)
