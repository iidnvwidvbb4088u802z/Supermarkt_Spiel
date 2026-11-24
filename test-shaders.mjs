// Check the actual generated GLSL interfaces, including implicit precision defaults.
// This does not replace shader compilation in a real WebGL browser.
import assert from 'node:assert/strict';
import {Renderer} from './src/engine.js';

function declarations(source,stage){
  const defaults={float:stage==='vertex'?'highp':null,int:'mediump'};
  for(const m of source.matchAll(/precision\s+(lowp|mediump|highp)\s+(float|int)\s*;/g))defaults[m[2]]=m[1];
  const result=new Map();
  for(const m of source.matchAll(/\b(uniform|varying)\s+(?:(lowp|mediump|highp)\s+)?(\w+)\s+(\w+)\s*;/g)){
    result.set(m[4],{storage:m[1],type:m[3],precision:m[2]||defaults[/^(?:int|ivec|bool|bvec)/.test(m[3])?'int':'float']});
  }
  return result;
}
function checkInterfaces(vertex,fragment){
  const v=declarations(vertex,'vertex'),f=declarations(fragment,'fragment');
  for(const [name,decl]of f){
    if(decl.storage==='varying')assert(v.has(name),'Fragment varying missing from vertex shader: '+name);
    if(v.has(name))assert.deepEqual(v.get(name),decl,'Shader interface mismatch: '+name);
  }
}
const sources=[];
const gl=new Proxy({
  VERTEX_SHADER:35633,FRAGMENT_SHADER:35632,
  createShader(type){return{type}},shaderSource(shader,source){shader.source=source;sources.push(shader)},
  getShaderParameter(){return true},getProgramParameter(){return true},getAttribLocation(){return 0},getUniformLocation(){return null}
},{get:(target,key)=>key in target?target[key]:typeof key==='string'&&key.toUpperCase()===key?0:()=>({})});
globalThis.window={devicePixelRatio:1,addEventListener(){}};globalThis.innerWidth=1440;globalThis.innerHeight=900;
new Renderer({getContext:()=>gl});
const vertex=sources.find(s=>s.type===35633).source,fragment=sources.find(s=>s.type===35632).source;
checkInterfaces(vertex,fragment);
assert.throws(()=>checkInterfaces('uniform float uWave;','precision mediump float;uniform float uWave;'),/uWave/,'Detect the reported implicit precision mismatch');
assert.throws(()=>checkInterfaces(vertex.replace('uniform mediump vec3 uEye;','uniform highp vec3 uEye;'),fragment),/uEye/,'Detect mismatched camera uniform precision');
assert.throws(()=>checkInterfaces(vertex.replace('varying mediump vec3 vPosition;','varying highp vec3 vPosition;'),fragment),/vPosition/,'Detect mismatched varying precision');
console.log('PASS shared shader uniforms and varyings have identical types and precision');
console.log('PASS regression checks detect the reported uWave error and camera/varying precision errors');
