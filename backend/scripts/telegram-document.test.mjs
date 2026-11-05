import assert from 'node:assert/strict'
import {after,test} from 'node:test'
import express from 'express'
import helmet from 'helmet'
import {miniAppDocument} from '../dist/middleware/miniAppDocument.js'

const app=express()
app.use(helmet(),miniAppDocument)
app.get(/.*/,(_req,res)=>res.send('fixture'))
const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s))})
const base=`http://127.0.0.1:${server.address().port}`
after(()=>new Promise(resolve=>server.close(resolve)))

test('HTML routes work inside Telegram Web and allow the official SDK without allowing arbitrary frames',async()=>{
  for(const path of ['/','/dashboard?from=telegram','/login','/index.html']) {
    const res=await fetch(base+path)
    assert.equal(res.headers.get('x-frame-options'),null)
    const policy=res.headers.get('content-security-policy')
    assert.match(policy,/script-src 'self' https:\/\/telegram\.org;/)
    assert.match(policy,/frame-ancestors 'self' https:\/\/web\.telegram\.org;/)
    assert.doesNotMatch(policy,/frame-ancestors[^;]*\*/)
  }
})
test('API and asset responses retain the existing frame protection',async()=>{
  for(const path of ['/api/v1/health','/assets/index.js','/manifest.webmanifest']) {
    const res=await fetch(base+path)
    assert.equal(res.headers.get('x-frame-options'),'SAMEORIGIN')
    assert.match(res.headers.get('content-security-policy'),/frame-ancestors 'self';/)
  }
})
