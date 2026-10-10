import type { GraphSpec,Param } from '../curriculum/schema'
import { integral,poly,value } from '../math/models'
import type { Model } from '../math/models'
import {div,rational}from '../math/exact'

export type LabState={values:Partial<Record<Param,number>>;visited:Partial<Record<Param,number[]>>;sceneTime?:number}
export type LabChange=LabState|((current:LabState)=>LabState)
export function initialLab(g:GraphSpec):LabState{
  return {values:Object.fromEntries((g.controls??[]).map(c=>[c.param,c.initial])),visited:{}}
}
export function updateLab(g:GraphSpec,state:LabState,param:Param,n:number):LabState{
  const c=g.controls?.find(c=>c.param===param)
  if(!c||!c.values.includes(n))return state
  const visited=Array.from(new Set([...(state.visited[param]??[]),n]))
  return {values:{...state.values,[param]:n},visited:{...state.visited,[param]:visited}}
}
export function goalMet(g:GraphSpec,state:LabState):boolean{
  const d=deriveLab(g,state)
  return Boolean(g.goals?.length)&&g.goals!.every(goal=>goal.measure
    ?Boolean(state.visited[goal.param]?.length)&&Math.abs((goal.measure==='derivative'?value(d.model,d.a,1):goal.measure==='secant'?d.secantK:d.accumulated)-goal.target!)<1e-8
    :goal.visit
    ?goal.visit.every(n=>state.visited[goal.param]?.includes(n))
    :state.values[goal.param]===goal.target&&state.visited[goal.param]?.includes(goal.target!))
}
export function deriveLab(g:GraphSpec,state:LabState){
  const param=(p:Param,fallback:number)=>state.values[p]??g.controls?.find(c=>c.param===p)?.initial??fallback
  const a=param('x',g.at??0),h=param('h',g.secondAt===undefined?1:g.secondAt-a)
  // All authored inputs have at most seven decimal places. Restore that exact
  // decimal after binary addition (e.g. 0.57 + 1 must be 1.57).
  const moved=Number((a+h).toFixed(7)),b=g.controls?.some(c=>c.param==='h')?moved:g.secondAt??moved
  const shift=param('c',0),from=g.from??0,to=param('upper',g.to??g.rangeX[1])
  const slopeMode=g.mode==='slope'&&g.controls?.some(c=>c.param==='rise'||c.param==='run')
  let model:Model=slopeMode?poly(0,div(rational(param('rise',2)),rational(param('run',1)))):g.model
  if(g.mode==='parameter'&&g.model.kind==='poly'){
    const c=[...g.model.c];c[g.parameterPower??2]=rational(param('coefficient',0));model={kind:'poly',c}
  }
  const order=g.order??0, fn=(x:number)=>value(model,x,order)+(order===0?shift:0)
  const correctK=value(model,a,order+1),correct={k:correctK,b:fn(a)-correctK*a}
  const lineK=param('k',correct.k),lineB=param('b',correct.b)
  const secantK=a===b?NaN:(fn(b)-fn(a))/(b-a),secantB=fn(a)-secantK*a
  let rangeX:[number,number]=[g.rangeX[0]*param('scaleX',1),g.rangeX[1]*param('scaleX',1)]
  let rangeY:[number,number]=[g.rangeY[0]*param('scaleY',1),g.rangeY[1]*param('scaleY',1)]
  if(g.mode==='zoom'){
    const zoom=param('zoom',1),halfX=(g.rangeX[1]-g.rangeX[0])/2/zoom,halfY=(g.rangeY[1]-g.rangeY[0])/2/zoom
    rangeX=[a-halfX,a+halfX];rangeY=[fn(a)-halfY,fn(a)+halfY]
  }
  const secondary=g.mode==='linked'||g.mode==='family'||g.mode==='motion'||(g.mode==='area'&&!!g.secondaryLabel)
  const secondaryFn=(x:number)=>g.mode==='area'?(g.constant??0)+integral(model,from,x,order):value(model,x,order+1)
  return {a,b,h,shift,from,to,model,order,fn,secondary,secondaryFn,rangeX,rangeY,lineK,lineB,secantK,secantB,
    level:param('k',g.level??g.horizontal??0),run:param('run',1),rise:param('rise',value(model,1)-value(model,0)),
    accumulated:(g.constant??0)+integral(model,from,to,order),
    gridX:g.controls?.some(c=>c.param==='scaleX')?param('scaleX',1):g.gridX,
    gridY:g.controls?.some(c=>c.param==='scaleY')?param('scaleY',1):g.gridY}
}
export function plotAnchors(g:GraphSpec,d:ReturnType<typeof deriveLab>):[number,number][]{
  if(g.mode==='secant')return [[d.a,d.fn(d.a)],[d.b,d.fn(d.b)]]
  if(g.mode==='slope'&&g.triangle)return [[0,d.fn(0)],[d.run,d.fn(d.run)]]
  if(!['tangent','parameter','zoom'].includes(g.mode??'')&&!g.showTangent)return []
  if(g.anchors)return g.anchors
  const manual=g.controls?.some(c=>c.param==='k'||c.param==='b')
  const anchors:[number,number][]=[[d.a,manual?d.lineK*d.a+d.lineB:d.fn(d.a)]]
  if(Number.isFinite(d.lineK)){
    const dx=[1,-1,2,-2,4,-4,.5,-.5,.25,-.25].find(dx=>d.a+dx>=d.rangeX[0]&&d.a+dx<=d.rangeX[1]&&d.lineK*(d.a+dx)+d.lineB>d.rangeY[0]&&d.lineK*(d.a+dx)+d.lineB<d.rangeY[1]&&Math.abs(d.lineK*dx-Math.round(d.lineK*dx))<1e-8)
    if(dx!==undefined)anchors.push([d.a+dx,d.lineK*(d.a+dx)+d.lineB])
  }
  return anchors
}
export function curvePath(fn:(x:number)=>number,rangeX:[number,number],rangeY:[number,number],width:number,height:number,model?:Model){
  const X=(x:number)=>(x-rangeX[0])/(rangeX[1]-rangeX[0])*width
  const Y=(y:number)=>height-(y-rangeY[0])/(rangeY[1]-rangeY[0])*height
  let path='',started=false,prevX=rangeX[0]
  for(let i=0;i<=500;i++){
    const x=rangeX[0]+(rangeX[1]-rangeX[0])*i/500,y=fn(x)
    const crossed=model?.kind==='reciprocal'&&prevX<model.shift&&x>model.shift
    if(model?.kind==='piecewiseLinear'&&model.knots.slice(1,-1).some(([t])=>prevX<t&&x>=t))started=false
    if(!Number.isFinite(y)||crossed||Math.abs(Y(y))>height*100){started=false;prevX=x;continue}
    path+=(started?' L':' M')+X(x).toFixed(3)+' '+Y(y).toFixed(3)
    started=true;prevX=x
  }
  return path
}
export function niceStep(span:number,target=12){
  const base=10**Math.floor(Math.log10(span/target))
  return [1,2,5,10].map(n=>n*base).find(n=>span/n<=target)??base*10
}
export function ticks(range:[number,number],step:number):number[]{
  const values:number[]=[]
  for(let n=Math.ceil(range[0]/step);n*step<=range[1]+step/1e6;n++)values.push(Number((n*step).toPrecision(10)))
  return values
}
