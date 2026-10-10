import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
const manifest=JSON.parse(await fs.readFile('dist/offline-manifest.json','utf8'))
const worker=await fs.readFile('dist/sw.js','utf8')
for(const file of manifest.files)assert.ok((await fs.stat('dist/'+file.slice(2))).isFile(),file)
assert.ok(manifest.files.some(f=>f.endsWith('.js'))&&manifest.files.some(f=>f.endsWith('.css')))
assert.ok(manifest.files.some(f=>f.endsWith('.woff2')),'Шрифты не включены в офлайн-пакет')
const html=await fs.readFile('dist/index.html','utf8')
assert.ok(!/https?:\/\//.test(html),'В оболочке есть внешние ресурсы')
async function simulate(scope,fail=false){
  const handlers={},stores=new Map([['other-app-cache',new Map()]])
  let claimed=false,activated=false
  const cache=(name)=>{
    if(!stores.has(name))stores.set(name,new Map())
    const map=stores.get(name)
    return {async addAll(urls){for(const url of urls){if(fail&&url.includes('/assets/'))throw new Error('network failed');map.set(url,{ok:true,body:url})}},async match(r){return map.get(typeof r==='string'?r:r.url)},async put(r,v){map.set(typeof r==='string'?r:r.url,v)}}
  }
  const self={registration:{scope},clients:{async claim(){claimed=true}},async skipWaiting(){activated=true},addEventListener:(name,f)=>{handlers[name]=f}}
  const context=vm.createContext({self,caches:{open:async name=>cache(name),keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)},URL,btoa:s=>Buffer.from(s).toString('base64'),fetch:async()=>{throw new Error('offline')}})
  vm.runInContext(worker,context)
  let pending
  handlers.install({waitUntil:p=>{pending=p}})
  if(fail){await assert.rejects(pending);assert.equal(stores.size,1);return}
  await pending;assert.ok(activated)
  handlers.activate({waitUntil:p=>{pending=p}});await pending;assert.ok(claimed);assert.ok(stores.has('other-app-cache'))
  const response=request=>{let result;handlers.fetch({request,respondWith:p=>{result=p}});return result}
  const shell=await response({method:'GET',url:new URL('./',scope).href,mode:'navigate'})
  assert.equal(shell.body,new URL('./index.html',scope).href,'Офлайн-переход не вернул оболочку')
  for(const f of manifest.files.filter(f=>f.includes('/assets/'))){
    const url=new URL(f,scope).href
    assert.equal((await response({method:'GET',url,mode:'cors'})).body,url,f)
  }
  let ready
  handlers.message({data:{type:'EDVORA_CACHE_STATUS'},ports:[{postMessage:m=>{ready=m}}],waitUntil:p=>{pending=p}})
  await pending;assert.equal(ready.ready,true)
  assert.equal(response({method:'GET',url:'https://another.example/a',mode:'cors'}),undefined)
}
await simulate('https://example.test/')
await simulate('https://example.test/edvora/')
await simulate('https://example.test/edvora/',true)
console.log('Офлайн: '+manifest.files.length+' ресурсов, корень и подпапка, ошибка установки, чужие кэши — проверено')
