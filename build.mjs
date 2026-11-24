import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const engine=read('src/engine.js').replace(/export /g,'');
const animals=read('src/animals.js').replace(/export /g,'');
const game=read('src/game.js').replace(/^import .*\n/gm,'');
const html=read('src/index.template.html')
  .replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+read('src/style.css')+'</style>')
  .replace('<script type="module" src="game.js"></script>',()=>'<script>\n'+engine+'\n'+animals+'\n'+game+'\n</script>');
writeFileSync(new URL('index.html',import.meta.url),html);
console.log('Built root index.html ('+Buffer.byteLength(html)+' bytes).');
