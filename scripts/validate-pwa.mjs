import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = resolve(projectRoot, 'public')
const manifest = JSON.parse(await readFile(resolve(publicDir, 'manifest.webmanifest'), 'utf8'))

assert.equal(manifest.start_url, './', 'PWA должна запускаться относительно места публикации')
assert.equal(manifest.scope, './', 'PWA scope должен работать и в подпапке GitHub Pages')
assert.equal(manifest.display, 'standalone', 'PWA должна открываться в standalone-режиме')

const pngDimensions = async (path) => {
  const bytes = await readFile(path)
  const signature = bytes.subarray(0, 8).toString('hex')
  assert.equal(signature, '89504e470d0a1a0a', `${path}: неверная PNG-сигнатура`)
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)]
}

for (const size of [192, 512]) {
  const icon = manifest.icons.find((candidate) => candidate.type === 'image/png' && candidate.sizes === `${size}x${size}`)
  assert.ok(icon, `В manifest нет PNG-иконки ${size}x${size}`)
  const iconPath = resolve(publicDir, icon.src.replace(/^\//, ''))
  await access(iconPath)
  assert.deepEqual(await pngDimensions(iconPath), [size, size], `${icon.src}: фактический размер не совпадает с manifest`)
}

for (const requiredFile of ['sw.js', 'offline.html', 'edvora-icon.svg']) {
  await access(resolve(publicDir, requiredFile))
}

const index = await readFile(resolve(projectRoot, 'index.html'), 'utf8')
assert.match(index, /rel="manifest" href="\.\/manifest\.webmanifest"/, 'index.html не подключает manifest')
assert.match(index, /viewport-fit=cover/, 'viewport не учитывает safe area')

const serviceWorker = await readFile(resolve(publicDir, 'sw.js'), 'utf8')
assert.match(serviceWorker, /self\.registration\.scope/, 'service worker не учитывает подпапку публикации')

console.log('PWA validation passed: manifest, 192/512 icons, service worker and offline fallback OK.')
