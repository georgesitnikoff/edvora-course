import assert from 'node:assert/strict'
import {loadCourse}from './load-course.mjs'
const {course,models}=await loadCourse()
const lab=await import('../.validation-runtime/v2/labEngine.mjs')
const progress=await import('../.validation-runtime/v2/progress.mjs')
const exact=await import('../.validation-runtime/math/exact.mjs')
assert.equal(exact.parseAnswer(' −1,5 '),-1.5)
assert.equal(exact.parseAnswer('1/2'),.5)
for(const raw of['','1/0','NaN','2+2','<script>','Infinity','1/2/3'])assert.equal(exact.parseAnswer(raw),null)
assert.equal(exact.displayQ(exact.q(1,3)),'1/3')
assert.equal(exact.displayQ(exact.q(81,64)),'1,265625')
assert.equal(exact.numberOf(exact.rational(1e-7)),1e-7)
assert.throws(()=>exact.rational(1e-8))
assert.deepEqual(exact.add(exact.q(123456789,100000000),exact.q(100000001,100000000)),exact.q(22345679,10000000),'Сложение не раздувает одинаковые знаменатели')
assert.deepEqual(exact.mul(exact.q(100000001,100000000),exact.q(100000000,100000001)),exact.q(1),'Перед умножением сокращаются перекрёстные множители')
const piecewise={kind:'piecewiseLinear',knots:[[0,0],[2,24],[4,24],[6,30],[8,48]]}
assert.equal(models.value(piecewise,3),24)
assert.equal(models.value(piecewise,3,1),0)
assert.ok(Number.isNaN(models.value(piecewise,2,1)),'Скорость не назначается в угле')
assert.equal(models.exactValue(piecewise,2,1),null)
assert.equal(models.integral(piecewise,0,2),24)
assert.ok(Number.isNaN(models.value(piecewise,-1)))
assert.equal(models.value(models.MODELS.sine,0,1),2)
assert.equal(models.exactValue(models.MODELS.sine,0,1).n,2)
assert.ok(Number.isNaN(models.value(models.MODELS.corner,0,1)))
assert.ok(Number.isNaN(models.value(models.MODELS.hyperbola,0)))
const reciprocalPath=lab.curvePath(x=>models.value(models.MODELS.hyperbola,x),[-3.97,4.02],[-5,5],500,300,models.MODELS.hyperbola)
assert.ok((reciprocalPath.match(/ M/g)??[]).length>=2,'Ветви гиперболы соединены')
let variants=0,goals=0
for(const l of course.lessons)for(const s of l.steps){
  if(!s.graph)continue
  const g=s.graph,initial=lab.initialLab(g)
  assert.equal(lab.goalMet(g,initial),false,s.id+': действие выполнено без участия')
  let state=initial
  for(const goal of g.goals??[]){
    const control=g.controls.find(c=>c.param===goal.param)
    if(goal.measure){
      const n=control.values.find(n=>lab.goalMet({...g,goals:[goal]},lab.updateLab(g,state,goal.param,n)))
      assert.notEqual(n,undefined,s.id);state=lab.updateLab(g,state,goal.param,n)
    }else for(const n of goal.visit??[goal.target])state=lab.updateLab(g,state,goal.param,n)
    goals++
  }
  if(g.goals?.length)assert.equal(lab.goalMet(g,state),true,s.id)
  const combinations=[initial]
  for(const control of g.controls??[])for(const n of control.values)combinations.push(lab.updateLab(g,initial,control.param,n))
  for(const state of combinations){
    const d=lab.deriveLab(g,state)
    assert.ok(d.rangeX[0]<d.rangeX[1]&&d.rangeY[0]<d.rangeY[1],s.id)
    const path=lab.curvePath(d.fn,d.rangeX,d.rangeY,500,300,d.model)
    assert.ok(path&&!/NaN|Infinity/.test(path),s.id+': график повреждён')
    if(g.mode==='tangent'||g.mode==='parameter'){
      assert.ok(Math.abs(d.lineK*d.a+d.lineB-d.fn(d.a))<1e-8||g.controls?.some(c=>c.param==='k'||c.param==='b'),s.id+': касательная мимо точки')
    }
    if(g.mode==='area')assert.ok(Number.isFinite(d.accumulated),s.id)
    if(g.mode==='linked'||g.mode==='family')assert.equal(d.secondaryFn(d.a),models.value(d.model,d.a,(g.order??0)+1),s.id)
    const anchors=lab.plotAnchors(g,d)
    if(g.mode==='secant'){
      assert.equal(anchors[1][0],d.b,s.id+': B потеряла абсциссу второй точки')
      for(const[x,y]of anchors)assert.ok(Math.abs(y-d.fn(x))<1e-10,s.id+': точка секущей не на кривой')
    }else if(['tangent','parameter','zoom'].includes(g.mode??'')&&Number.isFinite(d.lineK)){
      for(const[x,y]of anchors)assert.ok(Math.abs(y-d.lineK*x-d.lineB)<1e-10,s.id+': узел не на показанной прямой')
    }
    variants++
  }
}
const first=course.lessons[0].steps.find(s=>s.kind==='choice'),read=course.lessons[0].steps.find(s=>s.kind==='read')
const p=progress.emptyProgress()
p.steps[first.id]=progress.reviewed({...progress.emptyStep(first),attempts:2,wrongAttempts:1},first)
p.steps[read.id]=progress.reviewed(progress.emptyStep(read),read)
assert.equal(progress.dueSteps(p).length,1,'Ошибки должны вернуться сразу; теория не повторяется как задача')
assert.equal(progress.completedCount(p),2)
const reviewed=progress.reviewed({...p.steps[first.id],reviewActive:true},first,true)
assert.equal(reviewed.reviewFinished,true)
assert.equal(reviewed.reviewSuccess,1)
assert.ok(reviewed.dueAt>Date.now())
const assisted=progress.reviewed({...reviewed,reviewWrongAttempts:1},first,true)
assert.equal(assisted.reviewSuccess,0,'Повторение с ошибкой не увеличивает интервал')
assert.ok(assisted.dueAt<=Date.now())
assert.equal(progress.reviewed({...reviewed,hintsShown:1},first,true).reviewSuccess,0,'Подсказка не считается самостоятельным повторением')
const partial=progress.validateProgress({...p,cursor:{'L01-a':3}})
assert.deepEqual(partial.cursor,{'L01-a':3},'Импорт не начинает все остальные уроки')
const legacyCursor=course.resolveLessonCursor('L01',37)
assert.equal(legacyCursor.lesson.steps[legacyCursor.index].id,course.topics[0].steps[37].id,'Старая ссылка ведёт к тому же заданию')
const legacyProgress=progress.validateProgress({...p,cursor:{L01:37},lastLesson:'L01'})
assert.deepEqual(legacyProgress.cursor,{[legacyCursor.lesson.id]:legacyCursor.index})
assert.equal(legacyProgress.lastLesson,legacyCursor.lesson.id)
const {formulaMatches}=await import('../.validation-runtime/v2/formulaLogic.mjs')
for(const step of course.lessons.flatMap(l=>l.steps).filter(s=>s.kind==='formula')){
  assert.ok(formulaMatches(step,step.answer),step.id)
  for(const alternative of step.formula.alternatives??[])assert.ok(formulaMatches(step,alternative),step.id+' обратный порядок')
  assert.equal(formulaMatches(step,step.answer.slice(1)),false,step.id+' неполный ответ')
  if(step.formula.layout==='ratio')assert.equal(formulaMatches(step,[step.answer[1],step.answer[0],...step.answer.slice(2)]),false,step.id+' поменяли только числитель')
  const record=progress.emptyStep(step);record.sequence=step.answer
  assert.deepEqual(progress.validateProgress({...progress.emptyProgress(),steps:{[step.id]:record}}).steps[step.id].sequence,step.answer,'Повторяющиеся числа в формуле сохраняются')
}
const checks=course.lessons[0].steps.filter(s=>s.checkpoint),scoreProgress=progress.emptyProgress()
checks.forEach(s=>scoreProgress.steps[s.id]=progress.reviewed(progress.emptyStep(s),s))
scoreProgress.steps[checks[1].id].wrongAttempts=1
assert.equal(progress.checkpointScore(checks,scoreProgress).independent,2,'Самостоятельный результат учитывает первую попытку')
p.steps[first.id]=reviewed
assert.equal(progress.dueSteps(p).length,0)
assert.deepEqual(JSON.parse(JSON.stringify(progress.validateProgress(JSON.parse(JSON.stringify(p))).steps)),JSON.parse(JSON.stringify(p.steps)))
assert.throws(()=>progress.validateProgress({format:'wrong',steps:{}}))
assert.throws(()=>progress.validateProgress({...p,steps:{...p.steps,unknown:{}}}))
const experiment=course.lessons.flatMap(l=>l.steps).find(s=>s.graph?.controls?.some(c=>c.param==='x'))
const record=progress.emptyStep(experiment)
record.lab.values.x=999;record.lab.visited.x=[999,1]
p.steps[experiment.id]=record
const checked=progress.validateProgress(p)
assert.notEqual(checked.steps[experiment.id].lab.values.x,999)
assert.ok(!checked.steps[experiment.id].lab.visited.x.includes(999))
const map=new Map([['edvora-course-progress-v3','{"legacy":true}']])
globalThis.localStorage={get length(){return map.size},key:i=>[...map.keys()][i],getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}
assert.ok(progress.loadProgress().progress.legacy['edvora-course-progress-v3'])
map.set(progress.PROGRESS_KEY,'{broken')
assert.ok(progress.loadProgress().error)
assert.ok([...map.keys()].some(k=>k.includes('unreadable')))
console.log('Движок: '+variants+' состояний графиков; '+goals+' целей; ввод, повторение, импорт и прежние сохранения проверены')
