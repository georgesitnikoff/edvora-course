import { useRef,useState } from 'react'
import { X } from 'lucide-react'
export function DiagnosticFigure({image,alt}:{image:string;alt?:string}){
  const dialog=useRef<HTMLDialogElement>(null),[size,setSize]=useState<number|'fit'>(800)
  const src=import.meta.env.BASE_URL+image
  return <><figure className="diagnostic-figure-wrap"><button type="button" className="diagnostic-figure-button" aria-label="Увеличить рисунок" onClick={()=>{setSize(800);dialog.current?.showModal()}}><img className="diagnostic-figure" src={src} alt={alt}/></button><figcaption>Нажми на рисунок, чтобы увеличить.</figcaption></figure>
    <dialog ref={dialog} className="diagnostic-image-dialog"><div className="diagnostic-image-heading"><strong>Рисунок к заданию</strong><button className="icon-button" aria-label="Закрыть увеличенный рисунок" onClick={()=>dialog.current?.close()}><X size={20}/></button></div><p>На телефоне увеличенный рисунок можно прокручивать пальцем.</p>
      <div className="diagnostic-image-controls"><button type="button" onClick={()=>setSize('fit')}>По ширине</button><button type="button" onClick={()=>setSize(s=>s==='fit'?800:Math.min(s+200,1800))}>Увеличить</button><button type="button" onClick={()=>setSize(s=>s==='fit'?'fit':Math.max(s-200,400))}>Уменьшить</button></div>
      <div className="diagnostic-image-scroll" tabIndex={0} aria-label="Прокрутка увеличенного рисунка"><img src={src} alt={alt} style={{width:size==='fit'?'100%':size+'px'}}/></div>
    </dialog></>
}
