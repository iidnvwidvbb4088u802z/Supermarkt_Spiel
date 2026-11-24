// Simulation tests run the real game logic with a minimal DOM and WebGL interface.
// These verify gameplay, not browser rendering or WebGL shader compilation.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('index.html',import.meta.url),'utf8');
const nodes=new Map(),events=new Map(),buffers=new Map();const frameQueue=[];let clock=0,boundBuffer,currentUniforms={},draws=[];
const makeNode=(id='')=>({id,style:{},dataset:{},checked:false,textContent:'',disabled:false,classList:{values:new Set(),add(...v){v.forEach(x=>this.values.add(x))},remove(...v){v.forEach(x=>this.values.delete(x))},toggle(v,on){on??=!this.values.has(v);on?this.values.add(v):this.values.delete(v)},contains(v){return this.values.has(v)}},setAttribute(){},focus(){},querySelector(){return makeNode()},querySelectorAll(){return[]},addEventListener(){},click(){this.onclick?.()},set innerHTML(v){this._html=v;for(const match of v.matchAll(/id="([^"]+)"/g))nodes.set(match[1],makeNode(match[1]))},get innerHTML(){return this._html||''}});
const get=id=>{if(!nodes.has(id))nodes.set(id,makeNode(id));return nodes.get(id)};
for(const m of html.matchAll(/id="([^"]+)"/g))get(m[1]);
const optionGroups=[...html.matchAll(/<div class="(?:choices|swatches)" data-option="([^"]+)">([\s\S]*?)<\/div>/g)].map(m=>{const n=makeNode();n.dataset.option=m[1];n.buttons=[...m[2].matchAll(/data-value="([^"]+)"/g)].map(b=>{const x=makeNode();x.dataset.value=b[1];return x});n.querySelectorAll=()=>n.buttons;return n});
const tabs=['character','cart'].map(v=>{const n=makeNode();n.dataset.tab=v;return n});
const levelInfo=[1,2,3].map(v=>{const n=makeNode();n.dataset.info=v;return n});
const pips=[makeNode(),makeNode(),makeNode()];
const gl=new Proxy({createBuffer(){return{}},bindBuffer(t,b){boundBuffer=b},bufferData(t,b){assert(b.every(Number.isFinite),'All geometry vertices must be finite');buffers.set(boundBuffer,b)},deleteBuffer(b){buffers.delete(b)},getShaderParameter(){return true},getProgramParameter(){return true},getAttribLocation(){return 0},getUniformLocation(p,n){return n},uniformMatrix4fv(n,t,v){currentUniforms[n]=Array.from(v)},uniform3fv(n,v){currentUniforms[n]=Array.from(v)},uniform1f(n,v){currentUniforms[n]=v},drawArrays(){draws.push({buffer:boundBuffer,uniforms:{...currentUniforms}})}},{get:(o,k)=>k in o?o[k]:typeof k==='string'&&k.toUpperCase()===k?0:()=>({})});
get('world').getContext=()=>gl;
const storage=new Map();const document={body:makeNode(),hidden:false,getElementById:get,querySelectorAll(s){return s==='[data-option]'?optionGroups:s==='[data-tab]'?tabs:s==='[data-info]'?levelInfo:s==='.run-pips>span'?pips:[]},addEventListener(n,f){events.set('document:'+n,f)},createElement:()=>makeNode(),documentElement:makeNode()};
const context={console,Math,Date,Float32Array,Map,Set,JSON,Array,Number,String,Blob,URL,HTMLInputElement:class{},document,innerWidth:1440,innerHeight:900,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:f=>{frameQueue.push(f)},setTimeout:f=>{timeouts.push(f);return timeouts.length},clearTimeout(){},setInterval(){},clearInterval(){}};
const timeouts=[];context.window=context;context.addEventListener=(n,f)=>events.set(n,f);context.devicePixelRatio=1;vm.createContext(context);
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];vm.runInContext(script,context);
const state=()=>context.cartventure.getState(),read=s=>vm.runInContext(s,context),key=k=>events.get('keydown')({key:k,target:get('world'),preventDefault(){},repeat:false});
const tick=(seconds=.016)=>{for(let i=0;i<Math.ceil(seconds/.016);i++){clock+=16;draws=[];const queued=frameQueue.splice(0);queued.forEach(f=>f(clock))}};
const settle=()=>{const jobs=timeouts.splice(0);jobs.forEach(f=>f())};

const release=k=>events.get('keyup')({key:k,preventDefault(){}});
const driveTo=(kind,end=null,skipProduct=false)=>{let i=0,skipped=false;
 while(state().mode===kind&&!state().paused&&(end===null||state().playerX<end)&&i++<6000){
  key('ArrowRight');const r=read("rows.filter(r=>(r.type==='rock'||r.type==='obstacle')&&!r.cleared&&r.x>playerX-1.1).sort((a,b)=>a.x-b.x)[0]");
  if(r&&r.x-state().playerX<4&&r.x-state().playerX>0&&state().jumpY===0)key(' ');
  if(skipProduct&&!skipped&&kind==='store'&&state().playerX>9&&state().playerX<10&&state().jumpY===0){key(' ');skipped=true}
  tick();
 }release('ArrowRight');assert(i<6000,'Driving must reach the goal');
};
assert.equal(state().mode,'home');assert.equal(state().config.animal,'cow');assert(!('adult' in state().config));assert(!html.includes('adultCheck'));tick();
get('customizeBtn').click();assert.equal(state().mode,'customize');
for(const animal of ['cow','hen','goat','duck']){optionGroups.find(g=>g.dataset.option==='animal').buttons.find(b=>b.dataset.value===animal).click();assert.equal(state().config.animal,animal);assert(read('cart.count')>0)}
optionGroups.find(g=>g.dataset.option==='accessory').buttons.find(b=>b.dataset.value==='cap').click();assert.equal(state().config.accessory,'cap');
optionGroups.find(g=>g.dataset.option==='cartColor').buttons.find(b=>b.dataset.value==='#4d9bc0').click();get('backHome').click();get('playBtn').click();assert.equal(state().mode,'intro');assert.equal(state().config.animal,'duck');
assert.equal(read('renderer.orthoHeight'),null);tick(.4);const eye=read('renderer.eye'),target=read('renderer.target');assert(eye[2]<target[2],'Third-person camera starts behind the cart');assert(read('exitDoors.length')===2);tick(4.1);assert.equal(state().mode,'approach');
assert.deepEqual(Array.from(state().unlocked),[true,false,false]);assert.equal(read('goLevel(3)'),false);assert.equal(state().mode,'approach');console.log('PASS four animal models, accessories, one-click start, supermarket doors and rear-to-side introduction');
driveTo('approach');assert.equal(state().mode,'approachDoor');tick(1);assert.equal(state().mode,'river');assert(read('renderer.orthoHeight')>0);read('innerWidth=390;innerHeight=844;sideCamera(0);renderer.resize();renderer.begin(time)');const portrait=read('renderer.project([0,1,1])');assert(portrait.x>0&&portrait.x<390);read('innerWidth=1440;innerHeight=900;sideCamera(playerX);renderer.resize()');
// Hold/release pedals and stop completely.
key('ArrowRight');tick(.7);release('ArrowRight');assert(state().speed>4);key('ArrowLeft');tick(.6);release('ArrowLeft');assert.equal(state().speed,0);
get('rightBtn').onpointerdown({preventDefault(){},pointerId:1});tick(.1);get('rightBtn').onpointerup();assert.equal(state().drive.gas,false);
key('ArrowRight');get('pauseBtn').click();const pausedX=state().playerX;tick(2);assert.equal(state().playerX,pausedX);assert.equal(state().drive.gas,false);get('resumeBtn').click();release('ArrowRight');
driveTo('river',40);assert.equal(state().mode,'river');const rock=read("rows.find(r=>r.type==='rock')");assert.equal(rock.taken,false);assert.equal(rock.cleared,true);assert(rock.x<state().playerX);console.log('PASS gas, brake, pause and angular rocks remain after jumping past them');
// Nearby pickups must visibly fly into the cart before disappearing.
let sawPickup=false;for(let i=0;i<150&&state().mode==='river';i++){key('ArrowRight');tick();if(read('pickups.length')>0){sawPickup=true;break}}assert(sawPickup);release('ArrowRight');
driveTo('river');assert.equal(state().mode,'celebrate');assert.equal(state().completed[0],true);assert.equal(state().unlocked[1],true);tick(1.5);assert.equal(state().mode,'range');assert.match(get('modalCard').innerHTML,/Beste Schokolade/);console.log('PASS physical pickup animation, twenty chocolates, unlock and chocolate range announcement');
get('rangeLevels').click();get('resumeMenu').click();assert.match(get('modalCard').innerHTML,/Beste Schokolade/);get('nextLevel').click();assert.equal(state().mode,'market');assert.equal(context.cartventure.getCanTargets().length,12);
for(let i=0;i<5&&state().mode==='market'&&state().score<12;i++){
 const targets=context.cartventure.getCanTargets();const best=targets.map(c=>({c,n:targets.filter(d=>Math.hypot(d.x-c.x,(d.y-c.y)*.7)<1.35).length})).sort((a,b)=>b.n-a.n)[0].c;
 get('world').onpointerdown({clientX:best.screen.x,clientY:best.screen.y});tick(.65);
}assert.equal(state().score,12);assert.equal(state().cansCleared,true);assert.equal(state().completed[1],false);tick(1);assert.equal(state().mode,'basketball');assert.equal(state().basketRound,1);console.log('PASS twelve cans, five-ball aiming and automatic basketball checkpoint');
const shoot=(made=true)=>{get('shootBtn').onpointerdown({preventDefault(){},pointerId:2});tick(made?read('basketTarget()')*1.3:.04);get('shootBtn').onpointerup();assert(read('basketShot')!==null);tick(1.35)};
shoot();assert.equal(state().basketRound,2);for(let i=0;i<3;i++)shoot(false);assert.equal(state().paused,true);assert.equal(state().basketRound,2);assert.equal(state().unlocked[1],true);assert.equal(state().cansCleared,true);get('failureLevels').click();get('resumeMenu').click();assert.match(get('modalCard').innerHTML,/Noch ein Versuch/);get('retryBtn').click();assert.equal(state().mode,'basketball');assert.equal(state().basketRound,2);assert.equal(state().basketAttempts,3);
shoot();assert.equal(state().basketRound,3);shoot();assert.equal(state().mode,'celebrate');assert.equal(state().completed[1],true);assert.equal(state().unlocked[2],true);tick(1.5);assert.match(get('modalCard').innerHTML,/Beste Sportgetränke/);assert.doesNotMatch(get('modalCard').innerHTML,/Glühwein|Orangensaft|18 Jahre/);console.log('PASS three basketball rounds, missed-shot retry at current round and sports-drink range announcement');
get('nextLevel').click();assert.equal(state().mode,'store');assert.equal(read("rows.filter(r=>r.type==='orange').length"),20);assert(read('cart.count')>0);driveTo('store');assert.equal(state().mode,'range');assert.equal(state().completed[2],true);assert(state().oranges>10);assert.match(get('modalCard').innerHTML,/Beste Orangen/);get('nextLevel').click();assert.equal(state().mode,'checkoutApproach');tick(2.4);assert.equal(state().mode,'checkoutWaiting');get('enterDoor').click();assert.equal(state().mode,'victory');assert.match(get('modalCard').innerHTML,/KASSE/);console.log('PASS cart shopping in supermarket aisles, orange range announcement and coupon collection at checkout');
// Freely switch only unlocked levels, retaining earned progress after replay failure.
read('goLevel(1)');get('levelMenuBtn').click();get('chooseLevel3').click();assert.equal(state().mode,'store');read('goLevel(1)');key('ArrowRight');let loops=0;while(!state().paused&&loops++<2500)tick();assert(state().paused);assert.deepEqual(Array.from(state().unlocked),[true,true,true]);get('retryBtn').click();assert.equal(state().mode,'river');assert.deepEqual(Array.from(state().completed),[true,true,true]);console.log('PASS unlocked level navigation and failures preserve all completed checkpoints');
// A slower, legitimate shopping run can collect every orange and claim the maximum reward.
read('goLevel(3)');let shoppingFrames=0;while(state().mode==='store'&&!state().paused&&shoppingFrames++<5000){
 if(state().speed<4.6)key('ArrowRight');else release('ArrowRight');
 if(state().speed>5.2)key('ArrowLeft');else release('ArrowLeft');
 const r=read("rows.filter(r=>r.type==='obstacle'&&!r.cleared&&r.x>playerX-1).sort((a,b)=>a.x-b.x)[0]");
 if(r&&r.x-state().playerX<state().speed*.43&&state().jumpY===0)key(' ');tick();
}release('ArrowRight');release('ArrowLeft');assert.equal(state().mode,'range');assert.equal(state().oranges,20);get('nextLevel').click();tick(2.4);get('enterDoor').click();assert.match(get('modalCard').innerHTML,/WINTER-DEMO-20/);console.log('PASS all twenty oranges can be collected through real driving for the maximum checkout voucher');
// Missed collectibles remain in the world; no destructive reuse of the obstacle flags.
read('goLevel(1)');read('rows=[{x:1,type:"chocolate",taken:false}];playerX=3;speed=0');tick();assert.equal(read('rows[0].taken'),false);assert.equal(read('rows[0].missed'),true);
read('goLevel(3)');read('score=19;playerX=140;speed=0');tick();get('nextLevel').click();tick(2.4);get('enterDoor').click();assert.match(get('modalCard').innerHTML,/WINTER-DEMO-14/);console.log('PASS uncollected items remain visible and fewer oranges give a smaller reward');
get('victoryHome').click();assert.equal(state().mode,'home');get('playBtn').click();assert.equal(state().mode,'intro');assert.deepEqual(Array.from(state().unlocked),[true,false,false]);assert.deepEqual(Array.from(state().completed),[false,false,false]);assert.equal(state().cansCleared,false);assert.equal(state().config.animal,'duck');assert.equal(state().config.cartColor,'#4d9bc0');console.log('PASS only a new home-screen run resets progress while preserving the chosen animal and cart');
console.log('Gameplay simulation passed. Actual browser rendering, touch and audio still require browser QA.');
