import { useEffect,useEffectEvent,useId,useState } from 'react'
import { Pause,Play,RotateCcw } from 'lucide-react'
import type { PointerEvent } from 'react'
import type { GraphSpec,Param } from '../curriculum/schema'
import { add,displayQ,div,formatNumber,rational,sub } from '../math/exact'
import { derivativeModel,exactValue,primitiveModel,value } from '../math/models'
import { curvePath,deriveLab,goalMet,initialLab,niceStep,plotAnchors,ticks,updateLab } from './labEngine'
import type { LabChange,LabState } from './labEngine'
import { MathText } from './MathText'
import { Bicycle,ContextScene,Vehicle } from './ContextScene'

const W=560,H=310,L=90,T=18,B=35,PH=H-T-B
const fmt=(n:number)=>formatNumber(n,8)

export function GraphLab({spec,state,onChange,selected=[],onSelect,outcome,span}:{spec:GraphSpec;state?:LabState;onChange?:(s:LabChange)=>void;selected?:string[];onSelect?:(id:string)=>void;outcome?:'correct'|'retry';span?:[number,number]}){
  const lab=state??initialLab(spec)
  const [playhead,setPlayhead]=useState<number|null>(()=>state?.sceneTime??null)
  const [playback,setPlayback]=useState<{from:number;started:number}|null>(null)
  const lower=spec.context?.domain[0]??0,upper=spec.context?.domain[1]??1
  const animatedParam=spec.mode==='area'?'upper':'x'
  const displayLab=playhead===null?lab:{...lab,values:{...lab.values,[animatedParam]:playhead}}
  const d=deriveLab(spec,displayLab)
  const embeddedRace=spec.context?.kind==='race'&&d.order===0
  const embeddedRoad=spec.context?.kind==='terrain'&&d.order===0&&spec.mode!=='zoom'
  const R=embeddedRace?125:22,PW=W-L-R
  const currentTime=spec.mode==='area'?d.to:spec.mode==='secant'&&spec.context?d.b:d.a
  const publishTime=useEffectEvent((n:number)=>onChange?.(current=>({...current,sceneTime:n})))
  useEffect(()=>{
    if(!playback)return
    let frame=0
    const tick=(now:number)=>{
      const t=Math.min(upper,Number((playback.from+(now-playback.started)/1000*(upper-lower)/8).toFixed(2)))
      setPlayhead(t)
      if(t>=upper){setPlayback(null);publishTime(t)}else frame=requestAnimationFrame(tick)
    }
    frame=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(frame)
  },[playback,lower,upper])
  const id=useId().replace(/:/g,'')
  const set=(p:Param,n:number)=>{setPlayback(null);setPlayhead(null);onChange?.(current=>updateLab(spec,current,p,n))}
  const exactLabel=(x:number,order=0)=>{
    const exact=exactValue(d.model,x,order)
    const n=value(d.model,x,order)+(order===0?d.shift:0)
    return exact?displayQ(order===0?add(exact,rational(d.shift)):exact):Number.isFinite(n)?'≈ '+fmt(n):'не определено'
  }
  const fa=exactValue(d.model,d.a,d.order),fb=exactValue(d.model,d.b,d.order)
  const changeLabel=fa&&fb?displayQ(sub(fb,fa)):fmt(d.fn(d.b)-d.fn(d.a))
  const secantLabel=fa&&fb&&d.a!==d.b?displayQ(div(sub(fb,fa),sub(rational(d.b),rational(d.a)))):fmt(d.secantK)
  const primitive=d.model.kind==='poly'?primitiveModel(d.order===1?derivativeModel(d.model):d.model):undefined
  const ia=primitive?exactValue(primitive,d.from):null,ib=primitive?exactValue(primitive,d.to):null
  const areaLabel=ia&&ib?displayQ(sub(ib,ia)):fmt(d.accumulated-(spec.constant??0))
  const accumulatedLabel=ia&&ib?displayQ(add(sub(ib,ia),rational(spec.constant??0))):fmt(d.accumulated)
  const primaryParam=spec.controls?.find(c=>['x','h','upper'].includes(c.param))?.param
  function move(e:PointerEvent<SVGSVGElement>){
    if(!primaryParam||!e.currentTarget.hasPointerCapture(e.pointerId))return
    const rect=e.currentTarget.getBoundingClientRect(),px=(e.clientX-rect.left)/rect.width*W
    let x=d.rangeX[0]+(px-L)/PW*(d.rangeX[1]-d.rangeX[0])
    if(primaryParam==='h')x-=d.a
    const c=spec.controls?.find(c=>c.param===primaryParam)
    if(c)set(c.param,c.values.reduce((a,b)=>Math.abs(b-x)<Math.abs(a-x)?b:a))
  }
  function renderPlot(secondary=false){
    const rangeX=d.rangeX,rangeY=secondary?(spec.secondaryRangeY??[-5,10]):d.rangeY
    const fn=secondary?d.secondaryFn:d.fn
    const X=(x:number)=>L+(x-rangeX[0])/(rangeX[1]-rangeX[0])*PW
    const Y=(y:number)=>T+PH-(y-rangeY[0])/(rangeY[1]-rangeY[0])*PH
    const axisX=Math.max(L,Math.min(W-R,X(0))),axisY=Math.max(T,Math.min(H-B,Y(0)))
    const sx=d.gridX??niceStep(rangeX[1]-rangeX[0],8),sy=secondary?niceStep(rangeY[1]-rangeY[0]):d.gridY??niceStep(rangeY[1]-rangeY[0])
    const xs=ticks(rangeX,sx),ys=ticks(rangeY,sy)
    const clip=id+(secondary?'s':'p')
    const showCursor=spec.at!==undefined||Boolean(spec.controls?.length)||['tangent','zoom','secant','point','linked','family','motion'].includes(spec.mode??'')
    const cursor=spec.mode==='area'?d.to:d.a
    const cy=fn(cursor)
    const anchors=secondary?[]:plotAnchors(spec,d)
    const hasTangent=!secondary&&(spec.mode==='tangent'||spec.mode==='parameter'||spec.mode==='zoom'||spec.showTangent)
    const path=curvePath(fn,rangeX,rangeY,PW,PH,d.model)
    const line=(k:number,b:number)=>'M '+X(rangeX[0])+' '+Y(k*rangeX[0]+b)+' L '+X(rangeX[1])+' '+Y(k*rangeX[1]+b)
    const label=secondary?(spec.secondaryLabel??(spec.mode==='motion'?'v(t)':'f′(x)')):spec.mode==='motion'?'x(t)':spec.label
    const point=(x:number,y:number,caption?:string,interactive=false,align:'start'|'end'='start')=>Number.isFinite(x)&&Number.isFinite(y)&&x>=rangeX[0]&&x<=rangeX[1]&&y>=rangeY[0]&&y<=rangeY[1]?<g key={caption??x}>
      <circle cx={X(x)} cy={Y(y)} r={interactive?9:5} className={interactive?'drag-point':'plot-point'}/>
      {caption&&<text textAnchor={align} x={align==='end'?Math.max(L+Math.min(PW-10,caption.length*13)+5,X(x)-10):Math.min(W-R-Math.min(PW-10,caption.length*13)-5,Math.max(L+3,X(x)+10))} y={Math.max(T+15,Math.min(H-B-5,Y(y)-12))} className="point-caption">{caption}</text>}
    </g>:null
    const areaPaths: {path:string;positive:boolean}[]=[]
    if(!secondary&&spec.mode==='area'&&d.from!==d.to){
      const lo=Math.min(d.from,d.to),hi=Math.max(d.from,d.to)
      let group:[number,number][]=[],sign=0
      const flush=()=>{if(group.length>1)areaPaths.push({positive:sign>0,path:'M '+X(group[0][0])+' '+Y(0)+' '+group.map(([x,y])=>'L '+X(x)+' '+Y(y)).join(' ')+' L '+X(group[group.length-1][0])+' '+Y(0)+' Z'})}
      for(let i=0;i<=240;i++){
        const x=lo+(hi-lo)*i/240,y=fn(x),nextSign=Math.sign(y)||sign
        if(sign&&nextSign!==sign){group.push([x,0]);flush();group=[[x,0]]}
        sign=nextSign;group.push([x,y])
      }
      flush()
    }
    return <div className="plot">
      <div className="plot-label"><span className={'legend-dot '+(secondary?'gold':'lime')}/><MathText text={'$'+label+'$'}/>{!secondary&&spec.context?.comparison&&<><span className="legend-dot orange"/><MathText text="$s_B(t)$"/></>}{spec.mode==='zoom'&&!secondary&&<span className="plot-detail">×{lab.values.zoom??1}</span>}</div>
      <svg viewBox={'0 0 '+W+' '+H} role={onSelect?'group':'img'} aria-label={label+'; ось '+(spec.axisXLabel??(spec.mode==='motion'?'времени':'x'))+' от '+fmt(rangeX[0])+' до '+fmt(rangeX[1])+', ось значений от '+fmt(rangeY[0])+' до '+fmt(rangeY[1])}
        onPointerDown={e=>{if(primaryParam&&onChange){e.currentTarget.setPointerCapture(e.pointerId);move(e)}}}
        onPointerMove={move}
        className={primaryParam&&onChange?'draggable-plot':''}>
        <defs><clipPath id={clip}><rect x={L} y={T} width={PW} height={PH}/></clipPath></defs>
        {!secondary&&spec.minorGridY&&ticks(rangeY,spec.minorGridY).filter(y=>!ys.some(t=>Math.abs(t-y)<1e-8)).map(y=><line key={'minor'+y} x1={L} x2={W-R} y1={Y(y)} y2={Y(y)} className="minor-grid-line"/>)}
        {xs.map(x=><g key={'x'+x}><line x1={X(x)} x2={X(x)} y1={T} y2={H-B} className="grid-line"/>{!spec.symbolicLabels&&<text x={X(x)} y={H-12} textAnchor="middle" className="tick">{fmt(x)}</text>}</g>)}
        {ys.map(y=><g key={'y'+y}><line x1={L} x2={W-R} y1={Y(y)} y2={Y(y)} className="grid-line"/>{!spec.symbolicLabels&&<text x={L-9} y={Y(y)+4} textAnchor="end" className="tick">{fmt(y)}</text>}</g>)}
        <line x1={L} x2={W-R} y1={axisY} y2={axisY} className="axis-line"/>
        <line x1={axisX} x2={axisX} y1={T} y2={H-B} className="axis-line"/>
        <text x={W-R-5} y={axisY-10} textAnchor="end" className="axis-label">{spec.axisXLabel??(spec.mode==='motion'?'t':'x')}</text>
        <text x={axisX+8} y={T+9} className="axis-label">{spec.axisYLabel??'y'}</text>
        <g clipPath={'url(#'+clip+')'}>
          {(spec.shade??[]).map(([a,b],i)=><rect key={i} x={X(a)} y={T} width={X(b)-X(a)} height={PH} className="interval-fill"/>)}
          {!secondary&&(spec.regions??[]).filter(r=>selected.includes(r.id)).map(r=><rect key={r.id} x={X(r.from)} y={T} width={X(r.to)-X(r.from)} height={PH} className={'selected-region '+(outcome??'')}/>)}
          {!secondary&&span&&span[0]<span[1]&&<rect x={X(span[0])} y={T} width={X(span[1])-X(span[0])} height={PH} className={'selected-region '+(outcome??'')}/>}
          {areaPaths.map((a,i)=><path key={i} d={a.path} className={a.positive?'area-positive':'area-negative'} stroke="none"/>)}
          <path d={path} transform={'translate('+L+','+T+')'} className={'curve '+(secondary?'gold-curve':'')}/>
          {!secondary&&spec.context?.comparison&&<path d={curvePath(x=>value(spec.context!.comparison!.model,x),rangeX,rangeY,PW,PH,spec.context.comparison.model)} transform={'translate('+L+','+T+')'} className="comparison-curve"/>}
          {!secondary&&hasTangent&&Number.isFinite(d.lineK)&&<path d={line(d.lineK,d.lineB)} className="tangent-line"/>}
          {!secondary&&spec.mode==='secant'&&Number.isFinite(d.secantK)&&<path d={line(d.secantK,d.secantB)} className="secant-line"/>}
          {!secondary&&(spec.mode==='level'||spec.horizontal!==undefined)&&<path d={line(0,d.level)} className="tangent-line"/>}
          {showCursor&&Number.isFinite(cy)&&<><line x1={X(cursor)} x2={X(cursor)} y1={axisY} y2={Y(cy)} className="projection"/><line x1={axisX} x2={X(cursor)} y1={Y(cy)} y2={Y(cy)} className="projection"/></>}
          {!secondary&&spec.context?.comparison&&<><circle cx={X(cursor)} cy={Y(value(spec.context.comparison.model,cursor))} r="5" fill="#ffbd7e"/><line x1={axisX} x2={X(cursor)} y1={Y(value(spec.context.comparison.model,cursor))} y2={Y(value(spec.context.comparison.model,cursor))} className="comparison-projection"/></>}
          {spec.triangle&&!secondary&&anchors.length===2&&<path d={'M '+X(anchors[0][0])+' '+Y(anchors[0][1])+' L '+X(anchors[1][0])+' '+Y(anchors[0][1])+' L '+X(anchors[1][0])+' '+Y(anchors[1][1])} className="triangle-line"/>}
        </g>
        {!secondary&&(spec.marks??[]).map((x,i)=>Number.isFinite(fn(x))?<g key={'mark'+i}><line x1={X(x)} x2={X(x)} y1={axisY-5} y2={axisY+5} className="mark-tick"/>{point(x,fn(x))}<text x={X(x)} y={Math.min(H-4,axisY+21)} className="marked-x" textAnchor="middle">{fmt(x)}</text></g>:null)}
        {!secondary&&anchors.map(([x,y],i)=>{
          const align=anchors.length===2?(x<anchors[1-i][0]?'end':'start'):'start'
          return point(x,y,(i?'B':'A')+(spec.symbolicLabels?'':' ('+fmt(x)+'; '+fmt(y)+')'),Boolean(primaryParam),align)
        })}
        {spec.symbolicLabels&&[d.a,d.b].map((x,i)=>{
          const letter=i?spec.symbolicLabels!.right:spec.symbolicLabels!.left,y=fn(x)
          return <g key={letter}><line x1={X(x)} x2={X(x)} y1={axisY} y2={Y(y)} className="projection"/><line x1={axisX} x2={X(x)} y1={Y(y)} y2={Y(y)} className="projection"/><text x={X(x)} y={Math.min(H-4,axisY+22)} className="marked-x" textAnchor="middle">{letter}</text><text x={axisX+8} y={Y(y)-6} className="marked-x" textAnchor="start">{'f('+letter+')'}</text></g>
        })}
        {showCursor&&Number.isFinite(cy)&&!anchors.length&&point(cursor,cy,undefined,Boolean(primaryParam))}
        {hasTangent&&Number.isFinite(cy)&&!anchors.some(([x,y])=>Math.abs(x-cursor)<1e-8&&Math.abs(y-cy)<1e-8)&&point(cursor,cy,'P')}
        {!secondary&&spec.mode==='area'&&<line x1={X(d.to)} x2={X(d.to)} y1={T} y2={H-B} className="projection"/>}
        {showCursor&&Number.isFinite(cy)&&!ys.some(y=>Math.abs(y-cy)<1e-8)&&['point','linked','family'].includes(spec.mode??'point')&&<text x={L-7} y={Math.max(T+12,Math.min(H-B,Y(cy)+4))} textAnchor="end" className="marked-x">{fmt(cy)}</text>}
        {!secondary&&embeddedRace&&<g aria-label="Положение курьеров на маршруте">
          {[W-85,...(spec.context?.comparison?[W-33]:[])].map((lane,i)=>{
            const position=i?value(spec.context!.comparison!.model,currentTime):value(d.model,currentTime)
            return <g key={lane}><rect x={lane-19} y={T} width="38" height={PH} rx="8" className="scene-road"/><path d={`M${lane} ${T+6}V${H-B-6}`} className="road-mark"/>
              <line x1={X(currentTime)} x2={lane} y1={Y(position)} y2={Y(position)} className={i?'comparison-projection':'projection'}/>
              <Vehicle x={lane} y={Y(position)} color={i?'#ffbd7e':'#91acff'} angle={value(i?spec.context!.comparison!.model:d.model,currentTime,1)<0?90:-90}/>
              <text x={lane} y={H-12} textAnchor="middle" className="scene-small">{i?'B':'A'}</text>
            </g>
          })}
        </g>}
        {!secondary&&embeddedRoad&&cy>=rangeY[0]&&cy<=rangeY[1]&&<Bicycle x={X(cursor)} y={Y(cy)} angle={Number.isFinite(value(d.model,cursor,1))?Math.atan2(-value(d.model,cursor,1)*PH/(rangeY[1]-rangeY[0]),PW/(rangeX[1]-rangeX[0]))*180/Math.PI:0}/>}
        {!secondary&&(spec.regions??[]).map(r=><g key={r.id} role="button" tabIndex={onSelect?0:undefined} aria-label={'Выбрать интервал '+r.id} aria-pressed={selected.includes(r.id)} className="region-target" onClick={e=>{e.stopPropagation();onSelect?.(r.id)}} onPointerDown={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect?.(r.id)}}}>
          <rect x={X(r.from)+2} y={T} width={Math.max(1,X(r.to)-X(r.from)-4)} height={PH} className="region-hit"/>
          <text x={(X(r.from)+X(r.to))/2} y={T+19} textAnchor="middle" className="region-caption">{selected.includes(r.id)?'✓':'+'}</text>
        </g>)}
        {!secondary&&(spec.pickPoints??[]).map(p=><g key={p.id} role="button" tabIndex={onSelect?0:undefined} aria-label={'Выбрать точку '+p.label} aria-pressed={selected.includes(p.id)} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();onSelect?.(p.id)}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect?.(p.id)}}}>
          <circle cx={X(p.x)} cy={Y(fn(p.x))} r="19" className={'point-hit '+(selected.includes(p.id)?'selected':'')}/><text x={X(p.x)} y={Y(fn(p.x))+5} textAnchor="middle" className="pick-caption">{p.label}</text>
        </g>)}
      </svg>
    </div>
  }
  return <section className={'graph-lab '+(spec.context?'has-context context-'+spec.context.kind:'')} aria-label="Математическая лаборатория">
    {spec.context&&(embeddedRace||embeddedRoad)?<div className="scene-caption embedded-caption"><span>{spec.context.title}</span><b>{spec.context.variable??(embeddedRoad?'x':'t')} = {fmt(currentTime)} {spec.context.inputUnit??(embeddedRoad?'км':'с')}</b></div>:spec.context&&<ContextScene spec={spec} d={d} time={currentTime}/>}
    <div className="plots">{renderPlot()}{d.secondary&&renderPlot(true)}</div>
    {embeddedRace&&<div className="scene-values embedded-values"><span><i className="legend-dot blue"/>{spec.context!.primary}<b>{exactLabel(currentTime)} {spec.context!.outputUnit??'м'}</b></span>{spec.context?.comparison&&<span><i className="legend-dot orange"/>{spec.context.comparison.label}<b>{fmt(value(spec.context.comparison.model,currentTime))} {spec.context.outputUnit??'м'}</b></span>}{spec.context?.showRate&&<span>Проекция скорости<b>{exactLabel(currentTime,1)} м/с</b></span>}</div>}
    {spec.context?.animate&&<div className="scene-playback">
      <button className="scene-play-button" onClick={()=>{
        if(playback){setPlayback(null);onChange?.(current=>({...current,sceneTime:currentTime}))}
        else {const from=currentTime>=upper?lower:Math.max(lower,currentTime);setPlayhead(from);setPlayback({from,started:performance.now()})}
      }}>{playback?<Pause size={17}/>:<Play size={17} fill="currentColor"/>}{playback?'Пауза':'Запустить'}</button>
      <input type="range" aria-label="Момент на анимации" min={lower} max={upper} step="0.1" value={currentTime} onChange={e=>{const t=Number(e.target.value);setPlayback(null);setPlayhead(t);onChange?.(current=>({...current,sceneTime:t}))}}/>
      <button className="scene-reset" aria-label="В начало анимации" onClick={()=>{setPlayback(null);setPlayhead(lower);onChange?.(current=>({...current,sceneTime:lower}))}}><RotateCcw size={17}/></button>
    </div>}
    {spec.mode==='secant'&&spec.showReadout&&<div className="coordinate-strip"><span>A=({fmt(d.a)}; {exactLabel(d.a,d.order)})</span><span>B=({fmt(d.b)}; {exactLabel(d.b,d.order)})</span></div>}
    {spec.mode==='motion'&&spec.showReadout&&!spec.context&&<div className="motion-strip">
      <p>Тело на координатной оси · {value(d.model,d.a,1)<0?'движется влево':value(d.model,d.a,1)>0?'движется вправо':'проекция скорости равна нулю'}</p>
      <svg viewBox="0 0 560 82" role="img" aria-label={'Координата тела '+exactLabel(d.a)+'. Стрелка показывает направление движения.'}>
        <line x1="35" y1="32" x2="525" y2="32" stroke="#719467" strokeWidth="2"/>
        <path d="M515 26L525 32L515 38" fill="none" stroke="#719467" strokeWidth="2"/>
        {ticks([Math.min(0,d.rangeY[0]),Math.max(1,d.rangeY[1])],niceStep(d.rangeY[1]-Math.min(0,d.rangeY[0]),6)).map(n=>{
          const x=35+(n-Math.min(0,d.rangeY[0]))/(Math.max(1,d.rangeY[1])-Math.min(0,d.rangeY[0]))*490
          return <g key={n}><line x1={x} x2={x} y1="27" y2="37" stroke="#719467"/><text x={x} y="61" textAnchor="middle" fill="#b7cba6" fontSize="19">{fmt(n)}</text></g>
        })}
        <g transform={'translate('+(35+(d.fn(d.a)-Math.min(0,d.rangeY[0]))/(Math.max(1,d.rangeY[1])-Math.min(0,d.rangeY[0]))*490)+',32)'}>
          <circle r="10" fill="#c7f184" stroke="#e3fac4" strokeWidth="2"/>
          {value(d.model,d.a,1)!==0&&<g transform={'scale('+Math.sign(value(d.model,d.a,1))+',1)'}><path d="M15 -13H55M47 -20L55 -13L47 -6" fill="none" stroke="#f3cc78" strokeWidth="3"/></g>}
        </g>
      </svg><small>Стрелка показывает направление, а не путь за секунду.</small>
    </div>}
    {spec.showReadout&&spec.controls?.some(c=>c.param==='k'||c.param==='b')&&spec.mode==='tangent'&&<p className="candidate-status">Настраиваемая прямая: k={fmt(d.lineK)}, b={fmt(d.lineB)}. {Math.abs(d.lineK*d.a+d.lineB-d.fn(d.a))<1e-8?'Проходит через P.':'Пока не проходит через P.'}</p>}
    {spec.showReadout&&!(embeddedRace&&spec.mode==='point')&&<div className="lab-readout" aria-live="polite">
      {spec.mode==='secant'?<><span>Δx <b>{fmt(d.b-d.a)}</b></span><span>Δy <b>{changeLabel}</b></span><span>Наклон <b>{secantLabel}</b></span>{spec.showTangent&&<span>Касательная <b>{exactLabel(d.a,1)}</b></span>}</>
      :spec.mode==='area'?<><span>Приращение <b>{areaLabel}</b></span><span>{spec.context?.kind==='tank'?'V':'F'}({fmt(d.to)}) <b>{accumulatedLabel}</b></span></>
      :spec.mode==='level'?<span>Уровень k <b>{fmt(d.level)}</b></span>
      :spec.mode==='slope'?<><span>Δx <b>{fmt(d.run)}</b></span><span>Δy <b>{fmt(d.fn(d.run)-d.fn(0))}</b></span><span>Наклон <b>{exactLabel(0,1)}</b></span></>
      :<><span>{spec.context?.variable??(spec.mode==='motion'||spec.context&&spec.context.kind!=='terrain'?'t':'x')} <b>{fmt(d.a)}</b></span><span>{spec.mode==='motion'?'Координата':spec.context?.kind==='tank'?'Объём':spec.context?.kind==='terrain'?'Высота':'Значение'} <b>{exactLabel(d.a,d.order)}</b></span>{['tangent','parameter','zoom','linked','family','motion'].includes(spec.mode??'')&&<span>{spec.mode==='motion'?'Проекция скорости':'Производная'} <b>{exactLabel(d.a,1)}</b></span>}</>}
    </div>}
    {spec.controls?.length?<div className="lab-controls">
      {spec.controls.map(c=>{
        const current=lab.values[c.param]??c.initial,index=c.values.indexOf(current)
        return <div className="lab-control" key={c.param}>
          <label htmlFor={id+c.param}>{c.label}<strong>{fmt(current)}{c.unit?' '+c.unit:''}</strong></label>
          <div className="slider-row"><button aria-label={'Уменьшить: '+c.label} disabled={index<=0} onClick={()=>set(c.param,c.values[index-1])}>−</button>
            <input id={id+c.param} type="range" aria-label={c.label} aria-valuetext={fmt(current)} min={0} max={c.values.length-1} step={1} value={index} onChange={e=>set(c.param,c.values[Number(e.target.value)])}/>
            <button aria-label={'Увеличить: '+c.label} disabled={index>=c.values.length-1} onClick={()=>set(c.param,c.values[index+1])}>+</button></div>
          <div className="value-buttons">{c.values.map(n=><button key={n} className={n===current?'active':''} aria-pressed={n===current} onClick={()=>set(c.param,n)}>{fmt(n)}</button>)}</div>
        </div>
      })}
      {primaryParam&&<p className="drag-note">Точку также можно передвигать по графику. Значения фиксируются на заданных отметках.</p>}
      <button className="reset-lab" onClick={()=>onChange?.(initialLab(spec))}>Вернуть исходные параметры</button>
      {spec.goals?.length&&<div className={'lab-goals '+(goalMet(spec,lab)?'done':'')} aria-live="polite">
        {spec.goals.map(goal=><span key={goal.param}>{goal.measure?'Цель · '+(goal.measure==='derivative'?'Производная':goal.measure==='secant'?'Наклон секущей':'Накопление')+' = '+fmt(goal.target!):goal.visit?'Посети '+goal.visit.map(fmt).join('; '):'Цель · '+spec.controls?.find(c=>c.param===goal.param)?.label+': '+fmt(goal.target!)}
          <b>{goal.measure?(goalMet({...spec,goals:[goal]},lab)?'✓':'○'):goal.visit?(lab.visited[goal.param]??[]).filter(x=>goal.visit!.includes(x)).length+'/'+goal.visit.length:(lab.values[goal.param]===goal.target&&lab.visited[goal.param]?.includes(goal.target!)?'✓':'○')}</b></span>)}
      </div>}
    </div>:null}
  </section>
}
