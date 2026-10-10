import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import katex from 'katex'
import { loadCourse } from './load-course.mjs'

const {course,models}=await loadCourse()
const {initialLab,updateLab,goalMet}=await import('../.validation-runtime/v2/labEngine.mjs')
assert.equal(course.lessons.length,49)
assert.equal(new Set(course.lessons.map(l=>l.id)).size,49)
let checks=0,mathBlocks=0,proofs=0,interactives=0
const stepIds=new Set()
for(const l of course.lessons){
  assert.ok(l.steps.length>=20&&l.steps.length<=30,l.id+': нужно 20–30 этапов')
  assert.equal(l.steps.filter(s=>s.checkpoint).length,3,l.id+': нужны три итоговых задания')
  assert.ok(l.steps.slice(-3).every(s=>s.checkpoint&&s.exam&&s.stage==='Проверка'),l.id+': проверка должна завершать урок')
  for(const s of l.steps){
    const tag=s.id+' '+s.title
    assert.ok(!stepIds.has(s.id),tag+': повтор id');stepIds.add(s.id)
    assert.ok(s.body&&s.solution&&s.title,tag+': пустой текст')
    if(s.kind!=='read')assert.ok(s.hints.length>=2,tag+': нужны две подсказки')
    if(s.kind==='number')assert.ok(Number.isFinite(s.answer),tag+': ответ не конечный')
    if(s.kind==='choice'){
      assert.ok(s.choices.length>=3,tag)
      assert.ok(s.choices[s.answer],tag+': нет верного ответа')
      assert.equal(new Set(s.choices.map(c=>c.text)).size,s.choices.length,tag+': повтор варианта')
      s.choices.forEach(c=>assert.ok(c.feedback,tag+': нет объяснения ошибки'))
    }
    if(s.kind==='order'||s.kind==='select'||s.kind==='interval'||s.kind==='formula'){
      assert.ok(s.labels.length>1&&Array.isArray(s.answer),tag)
      s.answer.forEach(a=>assert.ok(s.labels.includes(a),tag+': ответ отсутствует в вариантах'))
      assert.equal(new Set(s.labels).size,s.labels.length,tag+': повтор подписи')
      if(s.kind==='interval')assert.ok(s.answer.length===2&&Number(s.answer[0])<Number(s.answer[1]),tag+': неверные границы')
      if(s.kind==='formula'){
        assert.equal(s.answer.length,s.formula.slotLabels.length,tag+': число мест')
        for(const alternative of s.formula.alternatives??[]){assert.equal(alternative.length,s.answer.length,tag);alternative.forEach(a=>assert.ok(s.labels.includes(a),tag))}
      }
    }
    const texts=[s.title,s.body,s.question,s.solution,...s.hints,...s.choices?.flatMap(c=>[c.text,c.feedback])??[],...s.labels??[],s.formula?.prefix,s.graph?.label,s.graph?.secondaryLabel].filter(Boolean)
    for(const text of texts){
      assert.equal((text.match(/\$/g)??[]).length%2,0,tag+': непарный $')
      assert.ok(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text),tag+': испорчено экранирование')
      for(const [,math]of text.matchAll(/\$([^$]+)\$/g)){
        try{katex.renderToString(math,{throwOnError:true,strict:'ignore'})}catch(e){throw new Error(tag+': '+math+': '+e.message)}
        mathBlocks++
      }
    }
    if(s.graph){
      const g=s.graph
      for(const range of[g.rangeX,g.rangeY])assert.ok(range.every(Number.isFinite)&&range[0]<range[1],tag+': неверный диапазон')
      for(const c of g.controls??[]){
        assert.ok(c.values.length>1&&c.values.includes(c.initial),tag+': неверный control '+c.param)
        assert.equal(new Set(c.values).size,c.values.length,tag)
      }
      for(const goal of g.goals??[]){
        const c=g.controls.find(c=>c.param===goal.param)
        assert.ok(c,tag+': цель без control')
        if(goal.measure)assert.ok(c.values.some(v=>goalMet({...g,goals:[goal]},updateLab(g,initialLab(g),c.param,v))),tag+': недостижимая математическая цель')
        else for(const v of goal.visit??[goal.target])assert.ok(c.values.includes(v),tag+': недостижимая цель '+v)
      }
      if(s.kind==='explore'){
        assert.ok(g.controls?.length&&g.goals?.length,tag+': интерактив без действия')
        interactives++
      }
      if(g.mode==='tangent'&&g.anchors){
        const {k,b}=models.tangent(g.model,g.at??0)
        for(const [x,y]of g.anchors)assert.ok(Math.abs(y-k*x-b)<1e-8,tag+': узел не на касательной')
      }
      if(g.context){
        const c=g.context
        assert.ok(c.domain[0]<c.domain[1],tag+': неверный промежуток сцены')
        for(let i=0;i<=100;i++){
          const x=c.domain[0]+(c.domain[1]-c.domain[0])*i/100
          const y=g.mode==='area'?(g.constant??0)+models.integral(g.model,g.from??0,x,g.order??0):models.value(g.model,x)
          assert.ok(Number.isFinite(y),tag+': в сцене не определено положение')
          if(c.kind==='tank')assert.ok(y>=-1e-8&&y<=(c.capacity??100)+1e-8,tag+': вода вне ёмкости: '+y)
          if(c.comparison)assert.ok(Number.isFinite(models.value(c.comparison.model,x)),tag+': второе движение не определено')
        }
      }
      for(const r of g.regions??[])assert.ok(r.from<r.to&&s.labels?.includes(r.id),tag+': недоступный интервал')
      for(const p of g.pickPoints??[])assert.ok(s.labels?.includes(p.id)&&Number.isFinite(models.value(g.model,p.x,g.order??0)),tag+': недоступная точка')
    }
    if(s.proof){assert.equal(s.proof.expected,s.answer,tag+': proof не соответствует ответу');proofs++}
    checks++
  }
}
for(const topic of course.topics)for(const step of topic.steps)assert.ok(stepIds.has(step.id),'Исходное задание потеряно: '+step.id)
assert.ok(course.UNITS.every(unit=>course.lessons.filter(l=>l.unit===unit.id).every(l=>unit.lessons.includes(l.number))),'Разделы не соответствуют нумерации')
await fs.mkdir('.validation-runtime',{recursive:true})
await fs.writeFile('.validation-runtime/course.json',JSON.stringify(course.lessons))
const report={lessons:course.lessons.length,steps:checks,minSteps:Math.min(...course.lessons.map(l=>l.steps.length)),maxSteps:Math.max(...course.lessons.map(l=>l.steps.length)),checkpoints:course.lessons.length*3,formulaAssemblies:course.lessons.flatMap(l=>l.steps).filter(s=>s.kind==='formula').length,mathBlocks,proofs,interactives}
await fs.writeFile('.validation-runtime/structural-report.json',JSON.stringify(report,null,2))
console.log('Контент и формулы:',report)
