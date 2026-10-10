import {useEffect,useState}from 'react'
export function useOffline(){
  const [status,setStatus]=useState<'checking'|'ready'|'unavailable'|'failed'|'development'>(()=>import.meta.env.DEV?'development':'serviceWorker'in navigator?'checking':'unavailable')
  useEffect(()=>{
    if(import.meta.env.DEV)return
    if(!('serviceWorker'in navigator))return
    let alive=true
    const query=async()=>{
      try{
        const reg=await navigator.serviceWorker.ready
        if(!alive||!reg.active)return
        const channel=new MessageChannel()
        channel.port1.onmessage=e=>{if(alive)setStatus(e.data?.ready?'ready':'failed');channel.port1.close()}
        reg.active.postMessage({type:'EDVORA_CACHE_STATUS'},[channel.port2])
      }catch{if(alive)setStatus('failed')}
    }
    const failed=()=>setStatus('failed')
    navigator.serviceWorker.addEventListener('controllerchange',query)
    window.addEventListener('edvora-offline-error',failed)
    void query()
    return()=>{alive=false;navigator.serviceWorker.removeEventListener('controllerchange',query);window.removeEventListener('edvora-offline-error',failed)}
  },[])
  return status
}
