// Original farm-animal models, built from the game's editable 3D primitives.
export function addAnimal(b,config,standing=false){
  const kind=config.animal||'cow',base=standing?0:1.2,bird=kind==='hen'||kind==='duck';
  const fur=kind==='goat'?'#c7b49a':kind==='duck'?'#f5cf5c':'#fff1d7';
  const foot=bird?'#e48c32':'#514b42',head=base+1.65;
  b.sphere(0,base+.78,.06,bird?1.13:1.05,bird?1.38:1.22,.94,fur);
  for(const side of[-1,1]){
    b.cylinder(side*.28,base+.2,-.04,.12,.35,.12,foot);
    b.box(side*.28,base+.075,-.16,bird?.36:.29,.15,bird?.43:.32,foot);
    b.sphere(side*.51,base+.77,-.02,bird?.32:.27,bird?.79:.67,bird?.65:.34,fur);
  }
  b.sphere(0,head,-.14,bird?.86:1.07,bird?.9:1,.91,fur);
  if(kind==='cow'){
    b.sphere(.25,base+.85,-.335,.4,.48,.11,'#4d493f');
    b.sphere(-.27,head+.1,-.53,.35,.4,.09,'#45463f');
    b.sphere(0,head-.25,-.61,.8,.42,.4,'#e5aa95');
    for(const side of[-1,1]){b.sphere(side*.22,head-.2,-.8,.1,.07,.045,'#936858');b.sphere(side*.57,head+.1,-.05,.4,.24,.34,fur);b.sphere(side*.58,head+.1,-.23,.24,.12,.04,'#e4a18e');b.add('cone',side*.33,head+.57,-.04,.16,.48,.16,'#e0c78f',0,0,side*-.22,8)}
    b.cylinder(0,base+.67,.65,.08,.5,.08,'#ece0bc',.6);b.sphere(0,base+.43,.8,.19,.29,.2,'#45463f');
  }else if(kind==='goat'){
    b.sphere(0,head-.25,-.6,.67,.42,.37,'#e2c5a4');
    for(const side of[-1,1]){b.add('cone',side*.3,head+.65,.02,.22,.88,.22,'#866e51',0,.28,side*.13,8);b.sphere(side*.56,head+.05,-.02,.49,.24,.3,'#c7b49a');b.sphere(side*.58,head+.04,-.2,.28,.1,.045,'#ddaf98')}
    b.add('cone',0,head-.64,-.5,.28,.46,.25,'#846d54',0,Math.PI,0,8);
  }else if(kind==='hen'){
    b.add('cone',0,head-.13,-.67,.36,.46,.32,'#e9a13e',0,-Math.PI/2,0,8);
    for(let i=0;i<3;i++)b.sphere(0,head+.48+i%2*.05,-.37+i*.2,.22,.3,.25,'#d95d47');
    b.sphere(0,head-.38,-.49,.19,.28,.16,'#dc5c45');
    for(const side of[-1,1])b.sphere(side*.19,base+.9,.58,.28,.62,.48,'#e4d5b5');
  }else{
    b.sphere(0,head-.17,-.67,.74,.23,.59,'#e79a38');
    b.sphere(0,base+.7,.62,.45,.42,.69,'#e8bc42');
    b.sphere(.11,head+.42,-.09,.18,.3,.18,'#f5cf5c');
  }
  for(const side of[-1,1]){
    b.sphere(side*.245,head+.05,-.524,.25,.28,.1,'#fffdf5');
    b.sphere(side*.245,head+.04,-.579,.115,.155,.045,'#303e37');
    b.sphere(side*.215,head+.075,-.602,.038,.045,.02,'#ffffff');
  }
  if(config.accessory==='cap'){
    b.sphere(0,head+.42,-.07,.95,.34,.86,config.outfit);
    b.box(0,head+.39,-.63,.8,.055,.49,config.outfit);
  }else if(config.accessory==='scarf'){
    b.torus(0,base+1.27,-.06,1.03,.48,.91,config.outfit);
    b.box(.25,base+.99,-.46,.25,.62,.1,config.outfit,0,0,-.12);
  }
}
