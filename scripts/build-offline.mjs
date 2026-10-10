import fs from 'node:fs/promises'
import path from 'node:path'
import {createHash} from 'node:crypto'

async function walk(dir){
  const result=[]
  for(const f of await fs.readdir(dir,{withFileTypes:true})){
    const p=path.join(dir,f.name)
    if(f.isDirectory())result.push(...await walk(p));else result.push(p)
  }
  return result
}
const files=(await walk('dist')).filter(f=>!f.endsWith('/sw.js')&&!f.endsWith('/offline-manifest.json')).sort()
const hash=createHash('sha256')
for(const f of files){hash.update(f);hash.update(await fs.readFile(f))}
const version=hash.digest('hex').slice(0,16),precache=files.map(f=>'./'+path.relative('dist',f).replaceAll('\\','/'))
const manifest={version,files:precache,bytes:(await Promise.all(files.map(f=>fs.stat(f)))).reduce((n,s)=>n+s.size,0)}
await fs.writeFile('dist/offline-manifest.json',JSON.stringify(manifest,null,2))
precache.push('./offline-manifest.json')
const worker=[
  'const VERSION='+JSON.stringify(version)+';',
  'const FILES='+JSON.stringify(precache)+';',
  'const BASE=self.registration.scope;',
  'const SCOPE=btoa(new URL(BASE).pathname).replaceAll("/","_").replaceAll("=","");',
  'const PREFIX="edvora-v2-"+SCOPE+"-";',
  'const CACHE=PREFIX+VERSION;',
  'const absolute=path=>new URL(path,BASE).href;',
  'self.addEventListener("install",event=>event.waitUntil((async()=>{',
  '  const cache=await caches.open(CACHE);',
  '  try{await cache.addAll(FILES.map(absolute));await self.skipWaiting()}catch(error){await caches.delete(CACHE);throw error}',
  '})()));',
  'self.addEventListener("activate",event=>event.waitUntil((async()=>{',
  '  for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);',
  '  await self.clients.claim();',
  '})()));',
  'self.addEventListener("fetch",event=>{',
  '  const request=event.request,url=new URL(request.url);',
  '  if(request.method!=="GET"||url.origin!==new URL(BASE).origin||!url.href.startsWith(BASE))return;',
  '  event.respondWith((async()=>{',
  '    const cache=await caches.open(CACHE);',
  '    if(request.mode==="navigate"){const shell=await cache.match(absolute("./index.html"));if(shell)return shell;}',
  '    const saved=await cache.match(request,{ignoreSearch:false});if(saved)return saved;',
  '    const response=await fetch(request);',
  '    if(response.ok&&url.pathname.includes("/assets/"))await cache.put(request,response.clone());',
  '    return response;',
  '  })());',
  '});',
  'self.addEventListener("message",event=>{',
  '  if(event.data?.type!=="EDVORA_CACHE_STATUS")return;',
  '  event.waitUntil((async()=>{const cache=await caches.open(CACHE);const found=await Promise.all(FILES.map(f=>cache.match(absolute(f))));',
  '    event.ports[0]?.postMessage({ready:found.every(Boolean),version:VERSION,files:FILES.length});',
  '  })());',
  '});'
].join('\n')
await fs.writeFile('dist/sw.js',worker)
console.log('Офлайн-пакет: '+precache.length+' файлов, '+Math.round(manifest.bytes/1024)+' КБ, '+version)
