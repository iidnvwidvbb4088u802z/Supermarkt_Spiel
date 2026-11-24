import {Builder,Renderer,M} from './engine.js';
import {addAnimal} from './animals.js';
const $=id=>document.getElementById(id),$$=s=>[...document.querySelectorAll(s)];
let renderer;
try{renderer=new Renderer($('world'))}catch(e){$('loading').innerHTML='<span style="font-size:40px">✳</span><strong>Die 3D-Welt konnte nicht starten.</strong><p style="max-width:400px;text-align:center;padding:20px">'+e.message+'</p>';throw e}
const config={animal:'cow',accessory:'scarf',outfit:'#2b8070',cartColor:'#f06a31',wheels:'classic',float:'rings'};
try{const saved=JSON.parse(localStorage.getItem('cartventure-style')||'{}');for(const key of Object.keys(config))if(key in saved)config[key]=saved[key]}catch{}
if(!['cow','hen','goat','duck'].includes(config.animal))config.animal='cow';
let mode='home',level=0,time=0,paused=false,last=0,sceneMeshes=[],dynamic=[],effects=[],cart,avatar,water,gate,cartRotation=Math.PI+.38,rotationOffset=0;
let playerX=0,jumpY=0,jumpV=0,score=0,travel=0,rows=[],cans=[],throws=0,balls=[],canAnimations=[],completed=[false,false,false],oranges=0,runTime=0,introStart=0,finishLocked=false;
let speed=0,portalTarget=1,doorHinge=[0,0,0];
const drive={gas:false,brake:false},heldKeys=new Set();
let unlocked=[true,false,false],cansCleared=false,basketRound=1,basketAttempts=3,basketShot=null,charging=false,chargeStart=0,power=0,canClearAt=0,pendingWinAt=0,lastFailure="",pickups=[],exitDoors=[],checkoutStart=0;
const LEVELS=[{name:'Schokoschlucht',tag:'REIN INS SCHOKO-ABENTEUER',icon:'▦'},{name:'Sport-Arcade',tag:'12 DOSEN. 3 BASKETBALL-RUNDEN.',icon:'◉'},{name:'Orangen-Rallye',tag:'DURCH DIE GÄNGE BIS ZUR KASSE',icon:'🍊'}];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
function rnd(seed){let t=Math.sin(seed*127.1+311.7)*43758.5453;return t-Math.floor(t)}
function mesh(b){const m=renderer.mesh(b);sceneMeshes.push(m);return m}
function clearScene(){const seen=new Set();for(const m of [...sceneMeshes,...dynamic])if(m?.buffer&&!seen.has(m.buffer)){renderer.dispose(m);seen.add(m.buffer)}sceneMeshes=[];dynamic=[];effects=[];pickups=[];exitDoors=[];basketShot=null;rows=[];cans=[];balls=[];canAnimations=[];cart=null;avatar=null;water=null;gate=null}
function tree(b,x,z,s=1,snow=false){b.cylinder(x,1.2*s,z,.38*s,2.4*s,.38*s,'#88623d');for(let i=0;i<3;i++){let y=(2+i*.8)*s,w=(3-i*.6)*s;b.cone(x,y,z,w,2.8*s,w,i%2?'#55785a':'#476b4d');if(snow)b.cone(x,y+.45*s,z,w*.76,2.1*s,w*.76,'#fff6df')}}
function roundTree(b,x,z,s=1){b.cylinder(x,1.3*s,z,.45*s,2.8*s,.45*s,'#99754e');b.sphere(x,3*s,z,3.6*s,3.9*s,3.6*s,'#a9b271');b.sphere(x-.8*s,2.65*s,z+.2*s,2.8*s,2.7*s,2.6*s,'#8f9e61')}
function chocolate(b,x,y,z,s=1,c='#583420',ry=0){b.box(x,y,z,1.05*s,.17*s,1.6*s,c,ry);for(let a=0;a<2;a++)for(let d=0;d<3;d++){const px=(a-.5)*.47*s,pz=(d-1)*.48*s,xx=px*Math.cos(ry)+pz*Math.sin(ry),zz=-px*Math.sin(ry)+pz*Math.cos(ry);b.box(x+xx,y+.14*s,z+zz,.43*s,.15*s,.43*s,c==='#6a3924'?'#8b5739':'#98653f',ry)}b.box(x,y+.035*s,z+.45*s,.98*s,.21*s,.52*s,'#f2e6c4',ry);b.box(x,y+.15*s,z+.46*s,.4*s,.015*s,.2*s,'#e67947',ry)}
function candyCane(b,x,z,s=1){b.cylinder(x,1.3*s,z,.18*s,2.6*s,.18*s,'#fff7de');for(let i=0;i<5;i++)b.cylinder(x,(.2+i*.5)*s,z,.185*s,.15*s,.185*s,'#d3674c');b.torus(x+.27*s,2.5*s,z,.7*s,.7*s,.2*s,'#fff7de',Math.PI/2)}
function shadow(b,x,z,s=1){b.cylinder(x,.022,z,2.3*s,.025,2.9*s,'#84784e')}
function makeAvatar(b,standing=false){addAnimal(b,config,standing)}
function makeCart(withPerson=true,floating=false){const b=new Builder(),c=config.cartColor,metal='#a9b5b1',dark='#464c47';shadow(b,0,0,1.3);b.box(0,.55,0,1.7,.13,1.9,metal);for(let x of[-.77,.77])for(let z of[-.67,.67]){const size=config.wheels==='offroad'?.55:config.wheels==='sport'?.43:.37;b.box(x,.38,z,.1,.4,.12,metal);b.cylinder(x,.26,z,size,.22,size,'#354644',0,Math.PI/2);b.cylinder(x+(x>0?.12:-.12),.26,z,size*.48,.025,size*.48,config.wheels==='sport'?c:metal,0,Math.PI/2)}
 for(let y of[.97,1.55,2.05]){const w=y===.97?1.35:1.75,l=y===.97?1.45:1.92;for(let x of[-w/2,w/2])b.box(x,y,0,.07,.07,l,metal);for(let z of[-l/2,l/2])b.box(0,y,z,w,.07,.07,y===2.05?c:metal)}
 for(let x of[-.85,.85])for(let z=-.9;z<=.91;z+=.23)b.box(x,1.52,z,.042,1.05,.045,metal,0,0,x>0?-.13:.13);
 for(let z of[-.94,.94])for(let x=-.75;x<=.76;x+=.23)b.box(x,1.52,z,.04,1.05,.045,metal,0,z>0?.13:-.13);
 for(let x=-.65;x<=.66;x+=.2)b.box(x,.96,0,.04,.04,1.5,metal);for(let x of[-.88,.88])b.box(x,2.08,.99,.08,.48,.08,metal,0,.35);b.cylinder(0,2.3,1.07,.16,1.94,.16,c,0,Math.PI/2);b.box(0,1.58,-.987,.53,.33,.045,c);b.box(0,1.58,-1.018,.21,.07,.015,'#ffe9bf');
 if(floating){for(let x of[-1.08,1.08]){if(config.float==='wings'){b.sphere(x,1.02,0,.7,.8,1.75,'#f8b250');b.box(x,1.39,0,.4,.04,1,'#f8d377')}else{b.torus(x,1.04,.05,.95,1.8,1.8,'#f6b442',0,Math.PI/2);b.torus(x,1.04,.05,.98,.3,1.82,'#fff0ba',0,Math.PI/2)}}}
 if(withPerson)makeAvatar(b);return renderer.mesh(b)}
// Side-scrolling landscapes and the connected level-door platforms.
function groundHeight(x,kind=level===1?'river':'parkour'){
  return kind==='river'?.35+Math.sin(x*.105)*.62+Math.sin(x*.27)*.2:.15;
}
function sideMatrix(x,y,slope=0,scale=.88,z=1){return M.multiply(M.transform(x,y,z,0,0,slope,scale),M.transform(0,0,0,-Math.PI/2))}
function sideCamera(x=playerX){
  renderer.orthoHeight=Math.max(14,18/(innerWidth/innerHeight));
  renderer.eye=[x+5,5.5,27];renderer.target=[x+5,2.2,0];
}
function blockText(b,text,x,y,z,size=.11){
  const letters={L:['100','100','100','100','111'],V:['101','101','101','101','010'],'1':['010','110','010','010','111'],'2':['111','001','111','100','111'],'3':['111','001','111','001','111'],'0':['111','101','101','101','111'],'%':['101','001','010','100','101'],' ':['000','000','000','000','000'],A:['010','101','111','101','101'],E:['111','100','110','100','111'],G:['111','100','101','101','111'],K:['101','101','110','101','101'],M:['101','111','111','101','101'],N:['101','111','111','111','101'],R:['110','101','110','101','101'],S:['111','100','111','001','111'],T:['111','010','010','010','010']};
  const width=text.length*4*size;
  for(let k=0;k<text.length;k++)for(let row=0;row<5;row++)for(let col=0;col<3;col++)if(letters[text[k]]?.[row][col]==='1')b.box(x-width/2+(k*4+col+.5)*size,y+(2-row)*size,z,size*.87,size*.87,.045,'#ffe4a3');
}
function makeDoor(n,x=5,z=-.5,finale=false){
  const b=new Builder(),accent=n===1?'#81512f':n===2?'#3e7557':'#ac6943';
  b.box(x,.08,z,5,.16,2.8,'#ddcfa9');
  for(let side of[-1,1]){b.box(x+side*1.95,2.4,z,.45,4.8,.75,'#f2dfb6');b.box(x+side*1.95,2.4,z+.4,.18,4.8,.08,accent);for(let i=0;i<5;i++)b.box(x+side*1.95,.5+i*.9,z+.43,.43,.13,.08,'#dc8655')}
  b.box(x,4.9,z,4.65,.5,.85,'#f2dfb6');b.box(x,5.56,z,4.2,.8,.5,accent);blockText(b,finale?'20%':'LVL '+n,x,5.56,z+.28,.14);
  for(let i=0;i<7;i++)b.sphere(x-1.5+i*.5,4.85,z+.48,.12,.12,.12,i%2?'#f4bb5e':'#fff0bf');
  mesh(b);if(finale){gate=null;return}
  const leaf=new Builder();leaf.box(1.65,2.3,0,3.3,4.5,.24,accent);
  for(let i=0;i<6;i++)leaf.box(.18+i*.58,2.3,.135,.045,4.35,.025,'#6a543c');
  leaf.box(1.65,3.5,.15,2.7,.09,.05,'#d5ad73');leaf.box(1.65,1.1,.15,2.7,.09,.05,'#d5ad73');
  leaf.sphere(2.9,2.2,.25,.18,.18,.18,'#f4cd7b');
  gate=mesh(leaf);doorHinge=[x-1.65,.12,z];gate.matrix=M.transform(...doorHinge);
}
function makeStandingAvatar(){const b=new Builder();makeAvatar(b,true);avatar=renderer.mesh(b);dynamic.push(avatar);return avatar}
function buildDoorHub(n){
  clearScene();renderer.fog=n===1?'#cbe2df':'#d7e5e2';renderer.orthoHeight=Math.max(13.5,18/(innerWidth/innerHeight));renderer.eye=[1.5,5.4,27];renderer.target=[1.5,2,0];
  const b=new Builder();b.box(0,-.5,-3,70,1,25,'#d6c69e');b.box(0,-.12,0,35,.24,9,'#eadcb9');b.box(0,-1,3.7,36,1.7,1.1,'#b99666');
  for(let i=0;i<13;i++){const x=-24+i*4;if(i%2)tree(b,x,-8,.85+i%3*.2,n>1);else roundTree(b,x,-11,1.1);b.sphere(x,1,-19,12,7,8,'#b3c6a7')}
  for(let x of[-8,10]){candyCane(b,x,-2,1.1);b.box(x,3.8,-2,.06,.06,4,'#9b875d')}
  mesh(b);makeDoor(Math.min(3,n),5,-.5,n===4);cart=makeCart(false,false);cart.matrix=sideMatrix(-3,.08,0,.88,1);dynamic.push(cart);makeStandingAvatar();avatar.matrix=sideMatrix(n===1?-5.2:.8,.08,0,.9,1);
}
function buildSideWorld(kind){
  clearScene();renderer.fog=kind==='river'?'#c1e4e4':'#d6e8e5';const b=new Builder(),surface=new Builder(),end=kind==='river'?232:165;
  for(let x=-35;x<end+45;x+=1){const y=groundHeight(x,kind),yn=groundHeight(x+1,kind),top=kind==='river'?'#86502c':'#e1b97d',front=kind==='river'?'#613b26':'#a47a4b';
    surface.quad([x,y,3.1],[x+1,yn,3.1],[x+1,yn,-2.9],[x,y,-2.9],top);
    b.quad([x,-5,3.1],[x+1,-5,3.1],[x+1,yn,3.1],[x,y,3.1],front);
    b.quad([x,y,-2.9],[x+1,yn,-2.9],[x+1,yn+.2,-3.3],[x,y+.2,-3.3],kind==='river'?'#e0c49a':'#f8ecd0');
    if(Math.floor(x)%4===0)b.box(x,y-.6,3.13,.6,.15,.03,kind==='river'?'#79482b':'#bf945e',0,0,.2);
  }
  for(let i=0;i<60;i++){const x=-30+i*5.1,s=.65+rnd(i+3)*.55;if(i%3)tree(b,x,-7-rnd(i)*4,s,kind!=='river');else roundTree(b,x,-9,s);if(i%3===0)b.sphere(x,1,-18,14,7+rnd(i)*4,9,'#adbea0');if(i%5===0)candyCane(b,x,-4.8,.8);if(kind==='river'&&i%2===0)chocolate(b,x,groundHeight(x,kind)+.4,-3.6,1.6,'#71432c',rnd(i));}
  mesh(b);water=mesh(surface);water.wave=kind==='river'?1:0;sideCamera(0);
}
function clearDrive(){drive.gas=false;drive.brake=false;heldKeys.clear();$('leftBtn').classList.remove('pressed');$('rightBtn').classList.remove('pressed')}
function setPedal(which,on){if(paused||pendingWinAt||!['river','store','approach'].includes(mode)){if(!on)drive[which]=false;return}drive[which]=on;$(which==='gas'?'rightBtn':'leftBtn').classList.toggle('pressed',on)}
function bottle(b,x,y,z,c='#5caa94',s=1){b.cylinder(x,y+.38*s,z,.38*s,.76*s,.38*s,c);b.cone(x,y+.83*s,z,.38*s,.18*s,.38*s,c);b.cylinder(x,y+.99*s,z,.19*s,.2*s,.19*s,'#e3e6ce');b.box(x,y+.4*s,z+.2*s,.27*s,.31*s,.025,'#f6efd6');b.box(x,y+.42*s,z+.22*s,.16*s,.055*s,.02,c)}
function orange(b,x,y,z,s=1){b.sphere(x,y,z,.78*s,.74*s,.76*s,'#ef9d32');b.sphere(x-.13*s,y+.13*s,z+.27*s,.22*s,.28*s,.06*s,'#f7b957');b.cylinder(x,y+.39*s,z,.07*s,.13*s,.07*s,'#816742');b.sphere(x+.13*s,y+.42*s,z,.32*s,.08*s,.17*s,'#568b4f')}
function confettiBurst(x=0){for(let i=0;i<90;i++)effects.push({x:x+(rnd(i+time)-.5)*9,y:4+rnd(i+42)*6,z:.5+rnd(i+12)*3,vx:(rnd(i+90)-.5)*5,vy:1+rnd(i+32)*3,vz:(rnd(i+18)-.5)*1.5,life:3.6,confetti:true,color:i%6})}
function playScreen(n,kind,side=false){
  level=n;mode=kind;paused=false;finishLocked=false;pendingWinAt=0;canClearAt=0;clearDrive();charging=false;basketShot=null;
  document.body.classList.remove('side-view','at-door','cinematic','basketball');if(side)document.body.classList.add('side-view');if(kind==='basketball')document.body.classList.add('basketball');
  document.body.classList.add('playing');$('home').classList.add('hidden');$('customizer').classList.add('hidden');$('modal').classList.add('hidden');$('hud').classList.remove('hidden');$('doorPrompt').classList.add('hidden');$('basketControls').classList.toggle('hidden',kind!=='basketball');
}
function buildSupermarketExit(){
  clearScene();renderer.orthoHeight=null;renderer.fog='#cfdfd8';renderer.fov=68;const b=new Builder();
  b.box(0,-.15,-2,44,.3,50,'#d5d4bd');b.box(0,-.1,-8,18,.1,17,'#e9e8d7');
  for(let x of[-7,7]){b.box(x,2.9,0,8,5.8,.6,'#e8d8b9');b.box(x,2.9,.34,6.5,2.3,.06,'#b9d5d0');b.box(x,5.9,0,8.4,.5,1,'#46755b')}
  b.box(0,5.75,0,6,.8,1,'#46755b');b.box(0,6.5,.25,8,.8,.5,'#ed8250');blockText(b,'MARKT',0,6.5,.53,.2);
  for(let x of[-3.1,3.1])b.box(x,2.6,.15,.24,5.2,.9,'#eee7cc');
  for(let z=-14;z<2;z+=3){b.box(0,.002,z,17,.015,.03,'#b7b8aa');for(let x=-8;x<9;x+=3)b.box(x,.002,z,.025,.015,3,'#b7b8aa')}
  for(let x of[-6,6])for(let z of[-6,-12]){b.box(x,1.5,z,2.2,3,4,'#b8bd9e');for(let i=0;i<4;i++)b.box(x,1+i*.65,z,2.3,.08,4.1,'#e1dac0')}
  mesh(b);exitDoors=[];for(let side of[-1,1]){const d=new Builder();d.box(0,2.5,0,2.9,4.9,.16,'#8eb7b5');d.box(side*1.37,2.5,.11,.08,4.8,.06,'#e4e4cf');d.box(0,2.5,.12,.055,4.8,.05,'#d4dcca');d.box(0,1.3,.12,2.8,.1,.05,'#e1e1c9');const m=mesh(d);exitDoors.push({mesh:m,side})}
  cart=makeCart(true);dynamic.push(cart);
}
function startIntro(){playScreen(1,'intro');buildSupermarketExit();introStart=time;$('gameTip').textContent='Dein Bauernhof-Buddy rollt los. Gleich übernimmst du das Steuer.';document.body.classList.add('cinematic');updateHUD()}
function advanceIntro(){
  const t=time-introStart,turn=clamp((t-2.3)/2,0,1),x=turn*5,z=-5+Math.min(t,2.3)*4+Math.sin(turn*Math.PI/2)*2;
  cart.matrix=M.transform(x,.08,z,Math.PI+turn*Math.PI/2,0,0,.88);
  const door=clamp((t-.1)/.9,0,1);for(const d of exitDoors)d.mesh.matrix=M.transform(d.side*(1.5+door*2.8),0,.15);
  const ease=turn*turn*(3-2*turn);renderer.eye=[mix(x,x+5,ease),mix(4.2,5.5,ease),mix(z-8,z+27,ease)];renderer.target=[mix(x,x+5,ease),mix(1.5,2.2,ease),mix(z+2,z,ease)];renderer.fov=mix(68,29,ease);
  if(t>4.35)startApproach();
}
function startApproach(){
  playScreen(1,'approach',true);buildDoorHub(1);avatar.visible=false;const old=cart;dynamic.splice(dynamic.indexOf(old),1);renderer.dispose(old);cart=makeCart(true);dynamic.push(cart);playerX=-3;speed=0;jumpY=0;jumpV=0;cart.matrix=sideMatrix(playerX,.08);sideCamera(playerX);
  $('gameTip').innerHTML='<b>→ / D</b> Gas geben und zur Tür LVL 1 rollen &nbsp; · &nbsp; <b>← / A</b> Bremsen';updateHUD();
}
function beginRun(){unlocked=[true,false,false];completed=[false,false,false];cansCleared=false;basketRound=1;oranges=0;runTime=0;score=0;syncConfig();Sound.start();startIntro()}
function goLevel(n,part='auto'){
  if(!unlocked[n-1]){toast('Schaffe zuerst das vorherige Level.');return false}
  if(n===1)startRiver();else if(n===2){if(part==='cans'||!cansCleared)startMarket();else startBasketball(part==='basketballRetry'?basketRound:completed[1]?1:basketRound)}else startOrangeStore();return true;
}
function showLevelMenu(){
  if(mode==='home'||mode==='customize')return;const previousMode=mode,wasFailure=finishLocked&&['river','store','market','basketball'].includes(mode);paused=true;clearDrive();charging=false;
  let cards='';for(let n=1;n<=3;n++)cards+='<button id="chooseLevel'+n+'" '+(!unlocked[n-1]?'disabled':'')+'><span>'+n+'</span><div><b>'+LEVELS[n-1].name+'</b><small>'+(!unlocked[n-1]?'Noch gesperrt':completed[n-1]?'Geschafft · erneut spielen':'Freigeschaltet')+'</small></div></button>';
  modal('<div class="eyebrow">DEINE FREIGESCHALTETEN LEVELS</div><h2>Wohin soll’s gehen?</h2><div class="level-picker">'+cards+'</div>'+(cansCleared?'<button class="secondary" id="replayCans">LVL 2 · Dosenwerfen wiederholen</button><button class="secondary" id="resumeBasket">LVL 2 · Basketball spielen</button>':'')+'<p class="fine-print">Freischaltungen bleiben nach Fehlern erhalten. Ein neuer Run von der Startseite setzt sie zurück.</p><button class="primary" id="resumeMenu">Zurück zum Spiel</button>');
  for(let n=1;n<=3;n++)$('chooseLevel'+n).onclick=()=>goLevel(n);
  if(cansCleared){$('replayCans').onclick=()=>goLevel(2,'cans');$('resumeBasket').onclick=()=>goLevel(2,'basketball')}
  $('resumeMenu').onclick=()=>{if(previousMode==='range'){showRange(level);return}if(previousMode==='victory'){showVictory();return}if(wasFailure){finishLocked=false;fail(lastFailure);return}closeModal();paused=false};
}
function startCelebration(next){
  portalTarget=next;clearDrive();buildDoorHub(next);mode='celebrate';paused=false;finishLocked=true;introStart=time;document.body.classList.remove('side-view','basketball');document.body.classList.add('at-door');$('basketControls').classList.add('hidden');$('doorPrompt').classList.add('hidden');confettiBurst(-2);Sound.fx('win');updateHUD();
}
function showRange(n){
  paused=true;clearDrive();const names=['Beste Schokolade','Beste Sportgetränke','Beste Orangen'],icons=['▦','◉','🍊'];
  const detail=n===1?'Zarte Alpenmilch, knackige Haselnuss und dunkler Kakao. Deine Schokoladen-Vielfalt ist entdeckt.':n===2?'12 Dosen und drei Basketball-Runden geschafft. Fruchtige Sportgetränke für deine nächste Challenge.':'Frische Orangen zwischen den Regalen eingesammelt. Jetzt wartet dein Demo-Gutschein an der Kasse.';
  modal('<span class="new-range">JETZT NEU IN UNSEREM SORTIMENT</span><h2 class="range-title">'+names[n-1]+'</h2><span class="modal-emoji">'+icons[n-1]+'</span><p>'+detail+'</p><button class="primary" id="nextLevel">'+(n===3?'Zur Kasse fahren':'Weiter zu Level '+(n+1))+'</button><button class="secondary" id="rangeLevels">Level-Auswahl</button>');
  $('nextLevel').onclick=()=>{closeModal();if(n===3)startCheckout();else goLevel(n+1)};$('rangeLevels').onclick=showLevelMenu;
}
function buildCourt(){
  clearScene();renderer.orthoHeight=null;renderer.fog='#cbdde0';renderer.eye=[.8,5.5,12];renderer.target=[0,2.7,-5];renderer.fov=49;
  const b=new Builder();b.box(0,-.12,-4,18,.24,27,'#bd925f');for(let i=-8;i<=8;i++)b.box(i,.012,-4,.025,.02,26,'#caa36f');b.box(0,0,-8,5,.035,8,'#5c9697');
  for(let x of[-6.5,6.5]){b.box(x,.025,-5,.08,.025,21,'#fff0c5');for(let z=-10;z<5;z+=2)bottle(b,x,.2,z,z%4?'#70ad93':'#d9a746',1.25)}
  b.box(0,2.8,-9.1,.22,5.6,.22,'#476b6a');b.box(0,4.3,-8.6,3.7,2.15,.15,'#e3ecda');for(let x of[-.55,.55])b.box(x,3.95,-8.49,.06,.75,.05,'#d57448');for(let y of[3.57,4.33])b.box(0,y,-8.49,1.15,.06,.05,'#d57448');
  b.torus(0,3.5,-7.85,1.2,.25,1.2,'#e57d3d');b.torus(0,2.9,-7.85,.73,.1,.73,'#f8edd2');for(let i=0;i<12;i++){const a=i*Math.PI/6;b.box(Math.cos(a)*.42,3.19,-7.85+Math.sin(a)*.42,.025,.62,.025,'#e9dfc4',0,0,(i%2?1:-1)*.12)}
  for(let x of[-7.7,7.7]){b.box(x,2,-4,.3,4,22,'#4b7e79');for(let i=0;i<7;i++)b.sphere(x,4.25,-13+i*3,.18,.25,.18,'#f0c36b')}
  mesh(b);cart=makeCart(false);cart.matrix=M.transform(-3.5,.02,2,-.4,0,0,.8);dynamic.push(cart);makeStandingAvatar();avatar.matrix=M.transform(1,.05,2,0,0,0,.9);
}
function startBasketball(round=1){
  playScreen(2,'basketball');buildCourt();basketRound=clamp(round,1,3);basketAttempts=3;score=basketRound-1;power=0;charging=false;basketShot=null;Sound.theme='market';$('gameTip').textContent='Halte den Wurf und lasse im grünen Bereich los.';updateHUD();
}
function basketTarget(){return[.55,.65,.46][basketRound-1]}
function basketTolerance(){return[.17,.15,.14][basketRound-1]}
function startCharge(){if(mode!=='basketball'||paused||basketShot||charging)return;charging=true;chargeStart=time;power=0;Sound.fx('click')}
function releaseShot(){
  if(!charging)return;charging=false;if(mode!=='basketball'||paused||basketShot)return;
  const made=Math.abs(power-basketTarget())<=basketTolerance();basketShot={t:0,made,start:[1,1.15,1.35],target:made?[0,3.5,-7.85]:[(power-basketTarget())*7,3.4+(power-basketTarget())*2,-7.85]};Sound.fx('throw');
}
function finishBasketShot(){
  const made=basketShot.made;basketShot=null;
  if(made){score=basketRound;Sound.fx('collect');spark(0,3.5,-7.85);if(basketRound===3){levelWin();return}basketRound++;basketAttempts=3;toast('Treffer! Weiter zu Runde '+basketRound+'.')}
  else{basketAttempts--;Sound.fx('miss');if(basketAttempts===0){fail('Die drei Versuche in Basketball-Runde '+basketRound+' sind aufgebraucht. Dein Dosen-Checkpoint bleibt gespeichert.');return}toast('Knapp daneben. '+basketAttempts+' Versuch'+(basketAttempts===1?'':'e')+' in dieser Runde übrig.')}
  power=0;updateHUD();
}
function buildStore(){
  clearScene();renderer.fog='#e0e6d8';const b=new Builder();b.box(67,-.18,-1,190,.36,21,'#d6d7c7');b.box(67,3.5,-6,190,7,.3,'#f1e6cf');b.box(67,6.6,-4,190,.35,12,'#ebe8d8');
  for(let x=-20;x<168;x+=3){b.box(x,.007,1,.025,.015,14,'#b3bdae');b.box(x+1.5,.008,-1,3,.015,.025,'#b3bdae')}
  for(let i=0;i<28;i++){const x=-9+i*5.4;if(i<26){b.box(x,2,-3.9,4.6,4,.7,'#708f84');for(let row=0;row<4;row++){const y=.35+row*.91;b.box(x,y,-3.2,4.8,.1,1.6,'#d1cbbb');for(let j=0;j<6;j++){const px=x-1.9+j*.74;if(i%3===0)chocolate(b,px,y+.13,-2.85,.52,j%2?'#76432b':'#8b5835');else if(i%3===1)bottle(b,px,y+.07,-2.85,['#72a991','#dda348','#a583a4'][j%3],.56);else orange(b,px,y+.33,-2.9,.61)}}}if(i%3===0){b.box(x,6.25,.5,3.8,.09,1.2,'#fffce5');b.box(x,5.85,-1,3.2,.5,.12,'#5d8c71');blockText(b,'GANG '+Math.min(3,Math.max(1,Math.floor((x+10)/45)+1)),x,5.85,-.91,.095)}}
  b.box(151,.8,1,6,1.6,3.5,'#5d8b78');b.box(149.5,1.65,1,2.6,.13,3.7,'#555d51');b.box(153,1.65,1,1.6,.13,3.7,'#dacba7');b.box(152.5,2.1,.5,.2,.9,.2,'#65796d');b.box(152.5,2.65,.5,1.45,.8,.15,'#2e5e53');blockText(b,'20%',152.5,2.65,.6,.13);b.box(151,4.7,-.2,4.2,.85,.2,'#e68b4b');blockText(b,'KASSE',151,4.7,-.05,.14);
  mesh(b);cart=makeCart(true);dynamic.push(cart);sideCamera(0);
}
function startOrangeStore(){
  playScreen(3,'store',true);buildStore();score=0;oranges=0;playerX=0;travel=0;speed=0;jumpY=0;jumpV=0;
  for(let i=0;i<20;i++)rows.push({x:12+i*6,type:'orange',taken:false});for(const x of[33,73,113])rows.push({x,type:'obstacle',taken:false});
  cart.matrix=sideMatrix(0,.2);Sound.theme='parkour';$('gameTip').innerHTML='<b>→ / D</b> Gas &nbsp; · &nbsp; <b>← / A</b> Bremse &nbsp; · &nbsp; <b>Leertaste</b> Springen · Sammle 20 Orangen bis zur Kasse.';updateHUD();
}
function collectProduct(r){r.taken=true;score++;pickups.push({type:r.type,x:r.x,y:groundHeight(r.x)+1.3,z:1,t:0});Sound.fx('collect');updateHUD()}
function startCheckout(){paused=false;mode='checkoutApproach';introStart=time;checkoutStart=playerX;clearDrive();$('doorPrompt').classList.add('hidden');document.body.classList.remove('side-view');document.body.classList.add('cinematic');$('basketControls').classList.add('hidden');updateHUD()}
function advanceCheckout(){
  const p=clamp((time-introStart)/2.2,0,1);playerX=mix(checkoutStart,147.8,p);cart.matrix=sideMatrix(playerX,.2);renderer.orthoHeight=null;renderer.fov=48;renderer.eye=[playerX+7.5,5.5,13];renderer.target=[playerX+2.2,1.7,0];
  if(p===1){mode='checkoutWaiting';document.body.classList.add('at-door');$('doorEyebrow').textContent='DEIN EINKAUF IST KOMPLETT';$('doorTitle').textContent='Dein Gutschein an der Kasse.';$('doorDescription').textContent=oranges+' von 20 Orangen gesammelt. Hol dir deinen Demo-Rabatt für den nächsten Einkauf.';$('enterDoor').textContent='Demo-Gutschein abholen';$('doorPrompt').classList.remove('hidden')}
}

function buildWorld(kind='home'){if(kind==='river'||kind==='parkour'){buildSideWorld(kind);return}clearScene();renderer.orthoHeight=null;const b=new Builder(),winter=kind==='market'||kind==='parkour';renderer.fog=winter?'#cededb':'#d0dfca';b.box(0,-.5,-50,220,1,260,winter?'#f2e6ca':'#d5c89b');
 for(let i=0;i<15;i++){let x=(i%2?-1:1)*(13+rnd(i+2)*32),z=-22-i*7;b.sphere(x,1,z,15+rnd(i)*12,9+rnd(i+5)*16,18,winter?'#d5dcca':i%2?'#a1ac78':'#bbc292')}
 for(let i=0;i<65;i++){let x=(i%2?-1:1)*(6+rnd(i+22)*24),z=13-i*2.2;if(kind==='home'&&x<0&&z>0)x-=7;if(kind==='home'&&x>0&&z>-3)x+=12;if(i%4===0&&!winter)roundTree(b,x,z,.65+rnd(i)*.8);else tree(b,x,z,.55+rnd(i+11)*1.05,winter);if(i%6===0)candyCane(b,x*.85,z,.9)}
 if(kind==='home'){b.box(8,.1,3,5.5,.18,5,'#d0bd8a');b.box(0,.03,-4,4,.06,13,'#c7b58a');makeDoor(1,0,-8);cart=makeCart(true,false);dynamic.push(cart)}
 if(kind==='market'){b.box(0,.06,-9,12,.08,18,'#e4d0ad');for(let x of[-5.8,5.8]){b.box(x,1.4,-8,3.8,2.8,3.8,'#b77b4b');b.box(x,3.35,-8,5.2,.3,5.2,'#f7edda',0,0,.03);b.box(x,3.13,-8,5,.38,4.9,'#a74736');for(let i=0;i<4;i++)b.box(x-1.7+i*1.1,3.15,-5.53,.5,.43,.1,'#ede2c8');b.box(x,1.45,-5.98,3.2,1.35,.1,'#523d2c');b.box(x,1.17,-5.7,3.65,.16,.7,'#dfb779');for(let i=0;i<4;i++)bottle(b,x-1.2+i*.8,1.27,-5.62,i%2?'#73a793':'#daa24b',.58);tree(b,x*1.6,-5,1.1,true)}
 b.box(0,1.15,-7,6,.23,2.3,'#a96c40');for(let x of[-2.6,2.6])b.box(x,.6,-7,.2,1.2,1.65,'#805633');b.box(0,3.9,-8.5,6,.45,.4,'#356b4e');for(let x of[-3,3])b.box(x,2,-8.5,.2,4,.2,'#815d37');for(let i=0;i<12;i++){const x=-7+i*1.28,y=4.9+Math.abs(x)*.045;b.sphere(x,y,-6,.16,.22,.16,i%2?'#f8cb5f':'#eaa16c');if(i)b.box(x-.6,y+.1,-6,1.3,.035,.035,'#686640')}
 tree(b,0,-18,2.3,true);for(let i=0;i<10;i++)b.sphere(Math.sin(i*2.4)*(1.8-i*.1),1.6+i*.5,-17.6,.2,.2,.2,i%2?'#dc7750':'#f6ce71');cart=makeCart(false);cart.matrix=M.transform(-4.2,0,2,-.5,0,0,.73);dynamic.push(cart);avatar=renderer.mesh(new Builder());renderer.dispose(avatar);const ab=new Builder();makeAvatar(ab,true);avatar=renderer.mesh(ab);avatar.matrix=M.transform(1,0,2,Math.PI,0,0,.85);dynamic.push(avatar)}

 mesh(b)}
const shared={};
function makeShared(){let b=new Builder();chocolate(b,0,0,0,1.15,'#6a3924');shared.chocolate=renderer.mesh(b);b=new Builder();b.add('cone',0,.57,0,1.55,1.35,1.35,'#797c72',.4,0,.13,5);b.box(-.35,.27,.24,.7,.54,.8,'#96998b',.25,0,.18);shared.rock=renderer.mesh(b);b=new Builder();orange(b,0,0,0,1.2);shared.orange=renderer.mesh(b);b=new Builder();b.box(0,.6,0,1.7,1.2,1.3,'#bb8754');b.box(0,.64,0,1.76,.14,1.35,'#d4b27b');b.box(0,.64,0,.14,1.3,1.36,'#d4b27b');shared.obstacle=renderer.mesh(b);b=new Builder();b.sphere(0,0,0,.3,.3,.3,'#ed8b47');shared.ball=renderer.mesh(b);b=new Builder();b.sphere(0,0,0,.57,.57,.57,'#e68c3c');b.torus(0,0,0,.58,.04,.58,'#6d4b35');b.torus(0,0,0,.58,.04,.58,'#6d4b35',Math.PI/2);shared.basketball=renderer.mesh(b);b=new Builder();b.sphere(0,0,0,.15,.15,.15,'#ffd286');shared.spark=renderer.mesh(b)}
makeShared();
shared.confetti=['#f07543','#efc74f','#64a589','#8c84bc','#e9cfa3','#a6cecd'].map(c=>renderer.mesh(new Builder().box(0,0,0,.16,.23,.035,c)));
function updateCart(){if(!cart)return;const old=cart.matrix;const i=dynamic.indexOf(cart);renderer.dispose(cart);cart=makeCart(mode!=='market',mode==='river');cart.matrix=old;if(i>=0)dynamic[i]=cart;else dynamic.push(cart)}
function setupHome(){clearDrive();charging=false;$('basketControls').classList.add('hidden');document.body.classList.remove('cinematic','basketball');$('doorPrompt').classList.add('hidden');document.body.classList.remove('side-view','at-door');buildWorld('home');mode='home';level=0;paused=false;finishLocked=false;$('home').classList.remove('hidden');$('customizer').classList.add('hidden');$('hud').classList.add('hidden');$('modal').classList.add('hidden');document.body.classList.remove('playing');renderer.fov=48;renderer.eye=[12,8.5,18];renderer.target=[0,1,-7];Sound.theme='home'}
function showCustomizer(){setupHome();mode='customize';$('home').classList.add('hidden');$('customizer').classList.remove('hidden');renderer.eye=innerWidth<540?[6,5.7,10]:[13,7.2,16];renderer.target=innerWidth<540?[3.8,1.4,2.6]:[4,1.4,0];if(innerWidth<540)renderer.target=[4,0,2];syncConfig()}
function syncConfig(){for(const group of $$('[data-option]'))for(const button of group.querySelectorAll('button'))button.classList.toggle('selected',button.dataset.value===config[group.dataset.option]);try{localStorage.setItem('cartventure-style',JSON.stringify(config))}catch{}}
function modal(html){$('modalCard').innerHTML=html;$('modal').classList.remove('hidden');requestAnimationFrame(()=>$('modalCard').querySelector('button')?.focus({preventScroll:true}))}
function closeModal(){$('modal').classList.add('hidden');$('world').focus({preventScroll:true})}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),2200)}
function updateHUD(){
 const n=Math.max(0,level-1);$('hudLevel').textContent='LEVEL 0'+level;$('hudName').textContent=LEVELS[n].name;
 const basket=mode==='basketball',target=level===1?20:level===2?(basket?3:12):20;
 $('hudProgressText').textContent=level===1?'SCHOKOLADE':level===2?(basket?'BASKETBALL · RUNDE '+basketRound+'/3 · '+basketAttempts+' VERSUCHE':'DOSEN · '+(5-throws)+' BÄLLE ÜBRIG'):'ORANGEN · GANG '+Math.min(3,1+Math.floor(Math.max(0,playerX)/45));
 $('hudScore').textContent=score+' / '+target;$('hudProgress').style.width=Math.min(100,score/target*100)+'%';
 $$('.run-pips>span').forEach((p,i)=>{p.classList.toggle('active',unlocked[i]);p.textContent=completed[i]?'✓':i+1});
 const side=['river','store','approach'].includes(mode);$('jumpBtn').classList.toggle('hidden',!side||mode==='approach');$('mobileControls').classList.toggle('hidden',!side);$('speedometer').classList.toggle('hidden',!side);$('crosshair').classList.toggle('hidden',mode!=='market');$('basketControls').classList.toggle('hidden',!basket);
 if(basket){$('basketRoundLabel').textContent='Runde '+basketRound+' / 3 · '+basketAttempts+' Versuche';$('powerTarget').style.left=((basketTarget()-basketTolerance())*100)+'%';$('powerTarget').style.width=(basketTolerance()*200)+'%';$('powerNeedle').style.left=(power*100)+'%'}
}
function startRiver(){
 playScreen(1,'river',true);buildSideWorld('river');playerX=0;travel=0;speed=0;score=0;jumpY=0;jumpV=0;clearDrive();finishLocked=false;
 cart=makeCart(true,true);dynamic.push(cart);cart.matrix=sideMatrix(0,groundHeight(0)+.07);document.body.classList.add('side-view');document.body.classList.remove('at-door');
 for(let i=0;i<30;i++)rows.push({x:10+i*7,type:'chocolate',taken:false});for(let i=0;i<7;i++)rows.push({x:34.5+i*28,type:'rock',taken:false});
 Sound.theme='river';$('gameTip').innerHTML='<b>→ / D</b> Gas halten &nbsp; · &nbsp; <b>← / A</b> Bremsen &nbsp; · &nbsp; <b>Leertaste</b> Springen';updateHUD();
}
function startMarket(){
 playScreen(2,'market');buildWorld('market');throws=0;score=0;canAnimations=[];cans=[];renderer.eye=[0,5.3,12];renderer.target=[0,2.3,-6];renderer.fov=47;
 const positions=[];for(const [count,y]of [[5,1.66],[4,2.41],[2,3.16],[1,3.91]])for(let j=0;j<count;j++)positions.push([(j-(count-1)/2)*.9,y]);
 positions.forEach(([x,y],i)=>{const b=new Builder(),c=i%2?'#dd9b48':'#669f89';b.cylinder(0,0,0,.67,.68,.67,c);b.cylinder(0,.35,0,.69,.055,.69,'#d6d2b8');b.cylinder(0,-.35,0,.69,.055,.69,'#d6d2b8');b.box(0,0,.341,.42,.37,.02,'#fff1c9');b.box(0,0,.355,.22,.07,.02,c);const m=renderer.mesh(b);m.matrix=M.transform(x,y,-6.5);dynamic.push(m);cans.push({x,y,z:-6.5,mesh:m,down:false})});
 Sound.theme='market';$('gameTip').textContent='12 Dosen mit 5 Bällen abräumen. Danach geht’s direkt zu drei Basketball-Runden.';updateHUD();
}
function jump(){if(!['river','store'].includes(mode)||paused||pendingWinAt||jumpY>.02)return;jumpV=mode==='river'?9.1:9.4;Sound.fx('jump')}
function spark(x,y,z){for(let i=0;i<10;i++)effects.push({x,y,z,vx:(rnd(time+i)-.5)*4,vy:2+rnd(i)*3,vz:(rnd(i+3)-.5)*4,life:.7})}
function fail(reason){
 if(finishLocked)return;finishLocked=true;paused=true;clearDrive();charging=false;Sound.fx('fail');lastFailure=reason;const failedLevel=level,part=mode==='basketball'?'basketballRetry':mode==='market'?'cans':'auto';
 modal('<span class="modal-emoji">↻</span><div class="eyebrow">DEIN CHECKPOINT BLEIBT GESPEICHERT</div><h2>Noch ein Versuch.</h2><p>'+reason+'</p><p>Du wiederholst nur '+(mode==='basketball'?'Basketball-Runde '+basketRound:'Level '+level)+'. Freigeschaltete Levels bleiben erreichbar.</p><button class="primary" id="retryBtn">Hier erneut versuchen</button><button class="secondary" id="failureLevels">Level-Auswahl</button><button class="text-button" id="failHome">Zur Startseite</button>');
 $('retryBtn').onclick=()=>goLevel(failedLevel,part);$('failureLevels').onclick=showLevelMenu;$('failHome').onclick=setupHome;
}
function levelWin(){
 if(finishLocked)return;finishLocked=true;pendingWinAt=0;clearDrive();charging=false;completed[level-1]=true;if(level<3)unlocked[level]=true;
 if(level===3){oranges=score;mode='range';Sound.fx('win');confettiBurst(playerX);showRange(3)}else startCelebration(level+1);
}
function showVictory(){
 const discount=oranges===20?20:Math.max(5,Math.floor(oranges/20*15));mode='victory';paused=true;Sound.theme='victory';$('doorPrompt').classList.add('hidden');const couponCode='WINTER-DEMO-'+String(discount).padStart(2,'0');
 modal('<span class="modal-emoji">✳</span><div class="eyebrow">DEIN BONUS DIREKT AN DER KASSE</div><h2>Tierisch gut<br>eingekauft!</h2><div class="discount">'+discount+'<span>%</span></div><p>Dein Demo-Gutschein bei <b>FRISCH & FABELHAFT</b></p><div class="coupon"><b>'+couponCode+'</b><div class="barcode"></div><small>DEMO · KEIN ECHTER GUTSCHEIN · NICHT EINLÖSBAR</small></div><div class="stat-row"><span><b>'+completed.filter(Boolean).length+'/3</b>LEVEL GESCHAFFT</span><span><b>'+oranges+'/20</b>ORANGEN</span><span><b>'+Math.floor(runTime)+' s</b>DEIN RUN</span></div><button class="primary" id="downloadCoupon">Demo-Gutschein herunterladen</button><button class="secondary" id="victoryLevels">Levels weiterspielen</button><button class="secondary" id="againBtn">Neuer Run · Fortschritt zurücksetzen</button><button class="text-button" id="victoryHome">Zur Startseite</button><p class="fine-print">Studienprototyp. Alle Gutscheine sind nicht einlösbare Demos.</p>');
 $('downloadCoupon').onclick=()=>downloadCoupon(discount,couponCode);$('againBtn').onclick=beginRun;$('victoryLevels').onclick=showLevelMenu;$('victoryHome').onclick=setupHome;
}
function downloadCoupon(d,code){const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="580" viewBox="0 0 1000 580"><rect width="1000" height="580" rx="30" fill="#fff8e9"/><rect x="20" y="20" width="960" height="540" rx="20" fill="none" stroke="#e0b98f" stroke-width="3" stroke-dasharray="10 7"/><g fill="#332b23" font-family="Arial,sans-serif" text-anchor="middle"><text x="500" y="80" font-size="30" font-weight="bold">CARTVENTURE · WINTER RUSH</text><text x="500" y="260" font-size="170" font-weight="bold" fill="#ef6937">'+d+'%</text><text x="500" y="320" font-size="26">FRISCH &amp; FABELHAFT · DEIN DEMO-SUPERMARKT</text><text x="500" y="390" font-size="32" font-weight="bold">'+code+'</text><text x="500" y="460" font-size="23">DEMO · KEIN ECHTER GUTSCHEIN · NICHT EINLÖSBAR</text><text x="500" y="510" font-size="17">Studienprojekt Visualisieren</text></g></svg>';const blob=new Blob([svg],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Cartventure-Demo-Gutschein-'+d+'.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Dein Demo-Gutschein wird heruntergeladen.')}
function throwBall(px,py){if(mode!=='market'||paused||throws>=5||finishLocked||balls.length)return;throws++;Sound.fx('throw');updateHUD();const points=cans.filter(c=>!c.down).map(c=>({c,p:renderer.project([c.x,c.y,c.z])}));let best=null,dist=Infinity;for(const o of points){const d=Math.hypot(o.p.x-px,o.p.y-py);if(d<dist){dist=d;best=o.c}}const hit=dist<Math.max(42,innerHeight*.075)?best:null;const target=hit?[hit.x,hit.y,hit.z]:[(px/innerWidth-.5)*9,(1-py/innerHeight)*5,-7];balls.push({start:[1,1.9,2],target,t:0,hit,px,py})}
function resolveThrow(ball){
 if(ball.hit){const radius=1.35;const knocked=cans.filter(c=>!c.down&&Math.hypot(c.x-ball.hit.x,(c.y-ball.hit.y)*.7)<radius);for(const c of knocked){c.down=true;canAnimations.push({c,t:0,vx:(c.x-ball.hit.x)*3+(rnd(c.y+time)-.5)*3,vy:3+rnd(c.x+time)*2,rz:0});score++;spark(c.x,c.y,c.z)}Sound.fx('can');updateHUD();if(score===12){cansCleared=true;canClearAt=time+.8;toast('Alle 12 Dosen! Basketball-Checkpoint gespeichert.');return}}
 else{Sound.fx('miss');toast('Ziele direkt auf eine Dose.')}
 if(throws>=5&&score<12)fail('Es stehen noch '+(12-score)+' Dosen. Versuche es noch einmal in Level 2.');
}
function pauseGame(){if(!['river','store','market','basketball','intro','approach','approachDoor','celebrate','checkoutApproach','checkoutWaiting'].includes(mode)||paused)return;paused=true;clearDrive();charging=false;Sound.fx('click');modal('<span class="modal-emoji">Ⅱ</span><div class="eyebrow">DEIN WAGEN WARTET</div><h2>Kleine Winterpause.</h2><p>Atme kurz durch. Dein Run geht genau hier weiter.</p><button class="primary" id="resumeBtn">Weiterspielen</button><button class="secondary" id="quitBtn">Run beenden</button>');$('resumeBtn').onclick=()=>{paused=false;closeModal()};$('quitBtn').onclick=()=>{modal('<div class="eyebrow">RUN BEENDEN</div><h2>Zurück zum Start?</h2><p>Deine Freischaltungen bleiben bis zum nächsten neuen Run erhalten. Tier und Wagen bleiben gespeichert.</p><button class="primary" id="confirmQuit">Zur Startseite</button><button class="secondary" id="cancelQuit">Weiter im Run</button>');$('confirmQuit').onclick=setupHome;$('cancelQuit').onclick=()=>{paused=false;closeModal()}}}
function showInfo(which='help'){
 const legal=which==='legal';modal('<div class="eyebrow">CARTVENTURE · FARM BUDDIES</div><h2>'+(legal?'Gut zu wissen.':'Tierisch einfach losrollen.')+'</h2><div class="rules"><div><b>Level 1:</b> 20 Tafeln sammeln. Rechts/D halten für Gas, Links/A für die Bremse. Leertaste/Oben/W zum Springen. Steine bleiben auf der Strecke.</div><div><b>Level 2:</b> 12 Dosen mit 5 Bällen abräumen. Dann in drei Basketball-Runden je einen Korb treffen. Wurf halten und im grünen Bereich loslassen; drei Versuche je Runde.</div><div><b>Level 3:</b> 20 Orangen in den Supermarktgängen sammeln. An der Kasse wartet der Demo-Gutschein. Alle Orangen = 20 %, weniger Orangen = weniger Rabatt.</div><div><b>Checkpoints:</b> Fehler starten nur das aktuelle Level beziehungsweise die Basketball-Runde neu. Über LEVELS oder 1/2/3 wechselst du zwischen freigeschalteten Levels. Ein neuer Run von der Startseite setzt den Fortschritt zurück.</div><div><b>Pause:</b> Escape/P. Pedale und Wurftaste funktionieren auch mit Maus und Touch.</div></div>'+(legal?'<p class="fine-print">Fiktiver Supermarkt, beispielhaftes Sortiment und nicht einlösbare Demo-Gutscheine. Nur Tier- und Wagenstil werden lokal gespeichert; Checkpoints gelten während des aktuellen Runs.</p>':'')+'<button class="primary" id="closeInfo">Alles klar</button>');$('closeInfo').onclick=closeModal;
}
// Original, generated-in-browser music and sound effects. No external audio files.
const Sound={ctx:null,on:false,theme:'home',step:0,timer:null,musicGain:null,start(){if(!this.ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;this.ctx=new Audio();this.musicGain=this.ctx.createGain();this.musicGain.gain.value=.2;this.musicGain.connect(this.ctx.destination)}this.ctx.resume();if(!this.on){this.on=true;this.update();this.timer=setInterval(()=>this.tick(),205)}},toggle(){if(!this.ctx){this.start();return}this.on=!this.on;if(this.on){this.ctx.resume();this.timer=setInterval(()=>this.tick(),205)}else{clearInterval(this.timer);this.ctx.suspend()}this.update()},update(){$('soundBtn').setAttribute('aria-label',this.on?'Ton ausschalten':'Ton einschalten');$('soundBtn').title=this.on?'Ton ausschalten':'Ton einschalten';$('soundBtn').querySelector('.sound-state').textContent=this.on?'AN':'AUS'},tone(freq,start,duration,volume=.1,type='sine',end=null,music=false){if(!this.on||!this.ctx)return;const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,c.currentTime+start);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(20,end),c.currentTime+start+duration);g.gain.setValueAtTime(0,c.currentTime+start);g.gain.linearRampToValueAtTime(volume,c.currentTime+start+.015);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+start+duration);o.connect(g);g.connect(music?this.musicGain:c.destination);o.start(c.currentTime+start);o.stop(c.currentTime+start+duration+.02)},tick(){if(document.hidden||paused&&mode!=='home'&&mode!=='customize')return;const melody=this.theme==='market'?[76,79,83,79,74,78,81,78,72,76,79,76,74,78,81,86]:this.theme==='parkour'?[72,76,79,83,81,79,76,74,72,76,79,84,83,79,76,74]:[72,0,76,79,0,76,74,0,71,0,74,77,0,74,72,0];const n=melody[this.step%16];if(n)this.tone(440*Math.pow(2,(n-69)/12),0,.27,.1,'sine',null,true);if(this.step%4===0)this.tone(440*Math.pow(2,([48,45,53,55][Math.floor(this.step/8)%4]-69)/12),0,.6,.16,'triangle',null,true);this.step++},fx(name){const f=(...a)=>this.tone(...a);if(name==='collect'){f(700,0,.12,.065);f(1050,.07,.15,.055)}else if(name==='win'){[523,659,784,1046].forEach((n,i)=>f(n,i*.13,.4,.09,'triangle'))}else if(name==='fail'){f(200,0,.3,.12,'sawtooth',55);f(90,.12,.35,.1,'triangle',35)}else if(name==='can'){f(900,0,.12,.12,'triangle',250);f(1300,.08,.2,.08,'square',350)}else if(name==='jump')f(220,0,.2,.05,'sine',650);else if(name==='throw')f(450,0,.15,.04,'triangle',100);else if(name==='start'){f(330,0,.2,.06);f(660,.1,.3,.06)}else if(name==='sip')f(300,0,.3,.04,'sine',600);else if(name==='miss')f(170,0,.15,.035);else if(name==='move')f(260,0,.06,.015);else f(600,0,.06,.025)}};
function frame(now){
  requestAnimationFrame(frame);const dt=Math.min((now-last)/1000||.016,.04);last=now;
  if(!paused||mode==='home'||mode==='customize')time+=dt;
  if(!paused&&['river','market','basketball','store','approach'].includes(mode))runTime+=dt;
  if(mode==='home'||mode==='customize'){
    if(cart){cartRotation=mix(cartRotation,Math.PI+.38+Math.sin(time*.2)*.08+rotationOffset,.07);cart.matrix=M.transform(mode==='customize'&&innerWidth<540?4:8,.16+Math.sin(time*1.3)*.035,3,cartRotation,0,0,mode==='customize'&&innerWidth<540?1.17:1.45)}
    if(mode==='home'){renderer.eye=[12+Math.sin(time*.12)*.35,8.5,18];renderer.target=[0,1,-7]}
  }
  if(!paused&&mode==='intro')advanceIntro();
  if(!paused&&['river','store','approach'].includes(mode)){
    const river=mode==='river',approach=mode==='approach',previous=playerX;
    const groundAt=x=>approach?.08:groundHeight(x),slope=(groundAt(playerX+.3)-groundAt(playerX-.3))/.6;
    const acceleration=drive.brake?-15:drive.gas?7.5:-1;
    speed=pendingWinAt?0:clamp(speed+(acceleration-(speed>.05?slope*1.7:0))*dt,0,12);if(speed<.03&&!drive.gas)speed=0;
    playerX+=speed*dt;travel=playerX;jumpV-=22*dt;jumpY=Math.max(0,jumpY+jumpV*dt);if(jumpY===0)jumpV=0;
    if(cart)cart.matrix=sideMatrix(playerX,groundAt(playerX)+.07+jumpY,Math.atan(slope)+(jumpY?-.08:Math.sin(time*speed)*.01),.88,1);
    sideCamera(playerX);$('speedValue').textContent=Math.round(speed*5);$('speedFill').style.width=(speed/12*100)+'%';
    if(approach&&playerX>=4.1){mode='approachDoor';introStart=time;clearDrive();document.body.classList.add('cinematic')}
    if(!pendingWinAt&&!approach)for(const r of rows){
      const obstacle=r.type==='rock'||r.type==='obstacle';if(r.taken||r.cleared||r.missed)continue;
      if(previous<=r.x+1.05&&playerX>=r.x-1.05){
        if(obstacle&&jumpY<1.08){fail(river?'Ein kantiger Stein hat deinen Wagen erwischt. Wiederhole nur dieses Level — deine Freischaltungen bleiben erhalten.':'Dein Wagen hat eine Kiste erwischt. Der Supermarkt bleibt freigeschaltet.');break}
        if(!obstacle&&jumpY<1.12){collectProduct(r);if(river&&score===20){pendingWinAt=time+.5;clearDrive();break}}
      }
      if(playerX>r.x+1.3){if(obstacle)r.cleared=true;else r.missed=true}
    }
    if(mode==='store'&&playerX>139&&!finishLocked){oranges=score;levelWin()}
    if(mode==='river'&&playerX>223&&!finishLocked)fail('Es fehlen noch Tafeln bis zu den 20. Versuche es noch einmal in Level 1.');
  }
  if(!paused&&mode==='approachDoor'){
    const p=clamp((time-introStart)/.9,0,1);if(gate)gate.matrix=M.transform(...doorHinge,-p*Math.PI*.55);if(cart)cart.matrix=sideMatrix(mix(4.1,6,p),.15,0,.88,mix(1,-1.3,p));if(p===1)startRiver();
  }
  if(!paused&&pendingWinAt&&time>=pendingWinAt&&mode==='river'){pendingWinAt=0;levelWin()}
  if(!paused&&mode==='celebrate'){
    const p=clamp((time-introStart)/1.35,0,1);avatar.matrix=sideMatrix(mix(-3,.8,p),mix(1.05,.08,p)+Math.sin(p*Math.PI)*3.1,-Math.sin(p*Math.PI)*.12,.9,1);if(p===1){mode='range';showRange(level)}
  }
  if(!paused&&mode==='checkoutApproach')advanceCheckout();
  if(!paused&&mode==='market'){
    for(let i=balls.length-1;i>=0;i--){const b=balls[i];b.t+=dt*1.7;if(b.t>=1){balls.splice(i,1);resolveThrow(b)}}
    for(const a of canAnimations){a.t+=dt;const c=a.c;c.mesh.matrix=M.transform(c.x+a.vx*a.t,Math.max(.4,c.y+a.vy*a.t-6*a.t*a.t),c.z-a.t*1.8,a.t*3,0,a.t*(a.vx<0?-4:4))}
    if(canClearAt&&time>=canClearAt){canClearAt=0;startBasketball(basketRound)}
  }
  if(!paused&&mode==='basketball'){
    if(charging){const t=(time-chargeStart)/1.3%2;power=t<=1?t:2-t;$('powerNeedle').style.left=clamp(power*100,0,98.5)+'%'}
    if(basketShot){basketShot.t+=dt/1.25;if(basketShot.t>=1)finishBasketShot()}
  }
  if(!paused){
    for(let i=pickups.length-1;i>=0;i--){pickups[i].t+=dt/.46;if(pickups[i].t>=1)pickups.splice(i,1)}
    for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.z+=e.vz*dt;e.vy-=dt*(e.confetti?3:6);if(e.life<=0)effects.splice(i,1)}
  }
  renderer.begin(time);for(const m of sceneMeshes)renderer.draw(m);for(const m of dynamic)renderer.draw(m);
  if(['river','store','checkoutApproach','checkoutWaiting'].includes(mode)||mode==='range'&&level===3)for(const r of rows){
    if(r.taken||r.x<playerX-18||r.x>playerX+35)continue;const m=shared[r.type],collectible=r.type==='chocolate'||r.type==='orange';
    m.matrix=M.transform(r.x,groundHeight(r.x)+(collectible?1.3:.05),1,0,r.type==='chocolate'?Math.PI/2:0,r.type==='chocolate'?Math.sin(time*1.6+r.x)*.05:0,collectible?1.05:1);renderer.draw(m);
  }
  for(const p of pickups){const t=clamp(p.t,0,1),m=shared[p.type];m.matrix=M.transform(mix(p.x,playerX,t),mix(p.y,groundHeight(playerX)+1.4+jumpY,t)+Math.sin(t*Math.PI)*.65,mix(p.z,.8,t),0,p.type==='chocolate'?Math.PI/2:0,t*1.4,1-t*.78);renderer.draw(m)}
  for(const b of balls){const p=b.start.map((v,i)=>mix(v,b.target[i],b.t));p[1]+=Math.sin(b.t*Math.PI)*2;shared.ball.matrix=M.transform(...p);renderer.draw(shared.ball)}
  if(basketShot){const t=clamp(basketShot.t,0,1),p=basketShot.start.map((v,i)=>mix(v,basketShot.target[i],t));p[1]+=Math.sin(t*Math.PI)*3.3;shared.basketball.matrix=M.transform(...p,t*4);renderer.draw(shared.basketball)}
  else if(mode==='basketball'){shared.basketball.matrix=M.transform(1,1.15,1.35,0);renderer.draw(shared.basketball)}
  for(const e of effects){const m=e.confetti?shared.confetti[e.color]:shared.spark;m.matrix=M.transform(e.x,e.y,e.z,e.life*5,e.life*3,e.life*4,Math.min(1,e.life*2));renderer.draw(m)}
}

$('playBtn').onclick=beginRun;$('customizeBtn').onclick=showCustomizer;$('backHome').onclick=setupHome;$('brand').onclick=()=>{if(document.body.classList.contains('playing'))pauseGame();else setupHome()};$('startRun').onclick=beginRun;$('aboutBtn').onclick=()=>showInfo('about');$('helpBtn').onclick=()=>showInfo('help');$('legalBtn').onclick=()=>showInfo('legal');$('soundBtn').onclick=()=>Sound.toggle();$('pauseBtn').onclick=pauseGame;$('levelMenuBtn').onclick=showLevelMenu;
$('fullscreenBtn').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.().catch(()=>toast('Vollbild ist hier nicht verfügbar.'));else document.exitFullscreen?.()};
$('rotateBtn').onclick=()=>{rotationOffset+=Math.PI/2;Sound.fx('click')};
for(const tab of $$('[data-tab]'))tab.onclick=()=>{$$('[data-tab]').forEach(t=>t.classList.toggle('active',t===tab));$('characterOptions').classList.toggle('hidden',tab.dataset.tab!=='character');$('cartOptions').classList.toggle('hidden',tab.dataset.tab!=='cart')};
for(const group of $$('[data-option]'))for(const button of group.querySelectorAll('button'))button.onclick=()=>{config[group.dataset.option]=button.dataset.value;syncConfig();updateCart();Sound.fx('click')};
for(const button of $$('[data-info]'))button.onclick=()=>showInfo('help');
$('enterDoor').onclick=()=>{if(mode==='checkoutWaiting')showVictory()};
window.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement)return;const k=e.key.toLowerCase();
 if(['1','2','3'].includes(k)&&!['home','customize'].includes(mode)){e.preventDefault();goLevel(Number(k));return}
 if(['arrowleft','arrowright','arrowup',' ','a','d','w'].includes(k)&&['river','store','approach'].includes(mode)){e.preventDefault();if(!paused){heldKeys.add(k);if(['arrowright','d'].includes(k))setPedal('gas',true);if(['arrowleft','a'].includes(k))setPedal('brake',true);if([' ','arrowup','w'].includes(k)&&!e.repeat)jump()}}
 if(k===' '&&mode==='basketball'){e.preventDefault();if(!e.repeat)startCharge()}
 if(k==='e'&&mode==='checkoutWaiting'){e.preventDefault();showVictory()}
 if(k==='escape'||k==='p'){if(paused){if($('resumeMenu'))$('resumeMenu').click();else if($('resumeBtn'))$('resumeBtn').click()}else pauseGame()}
 if(mode==='market'&&(e.key===' '||e.key==='Enter')&&!paused&&e.target===$('world')){e.preventDefault();throwBall(innerWidth/2,innerHeight*.52)}
});
window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();heldKeys.delete(k);if(k===' '&&mode==='basketball'){e.preventDefault?.();releaseShot()}if(['arrowright','d'].includes(k)&&!heldKeys.has('arrowright')&&!heldKeys.has('d'))setPedal('gas',false);if(['arrowleft','a'].includes(k)&&!heldKeys.has('arrowleft')&&!heldKeys.has('a'))setPedal('brake',false)});
for(const [id,pedal]of [['leftBtn','brake'],['rightBtn','gas']]){const button=$(id);button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture?.(e.pointerId);setPedal(pedal,true)};button.onpointerup=button.onpointercancel=button.onlostpointercapture=()=>setPedal(pedal,false)}
$('jumpBtn').onpointerdown=e=>{e.preventDefault();jump()};$('shootBtn').onpointerdown=e=>{e.preventDefault();$('shootBtn').setPointerCapture?.(e.pointerId);startCharge()};$('shootBtn').onpointerup=releaseShot;$('shootBtn').onpointercancel=()=>{charging=false};
$('world').onpointerdown=e=>{if(mode==='basketball'){$('world').setPointerCapture?.(e.pointerId);startCharge()}else throwBall(e.clientX,e.clientY)};$('world').onpointerup=()=>{if(mode==='basketball')releaseShot()};$('world').onpointercancel=()=>{charging=false};
window.addEventListener('pointermove',e=>{if(mode==='market'&&!paused){$('crosshair').style.left=e.clientX+'px';$('crosshair').style.top=e.clientY+'px'}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearDrive();charging=false;pauseGame()}});window.addEventListener('blur',()=>{clearDrive();charging=false;if(!['home','customize','victory','range'].includes(mode))pauseGame()});
setupHome();syncConfig();$('loading').classList.add('hidden');requestAnimationFrame(frame);
window.cartventure={getState:()=>({version:'1.3',mode,level,paused,score,throws,oranges,travel,playerX,speed,jumpY,runTime,cansCleared,basketRound,basketAttempts,power,charging,drive:{...drive},config:{...config},unlocked:[...unlocked],completed:[...completed]}),getCanTargets:()=>cans.filter(c=>!c.down).map(c=>({x:c.x,y:c.y,screen:renderer.project([c.x,c.y,c.z])}))};
