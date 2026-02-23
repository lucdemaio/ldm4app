const fs=require('fs');
const p='c:/Users/picking-beo/Desktop/turni enterprise/script.js';
const s=fs.readFileSync(p,'utf8');
const lines=s.split(/\r?\n/);
let cum=0;let bt=0;let dbl=0;let squ=0;let par=0;
for(let i=0;i<lines.length;i++){
  const line=lines[i];
  bt += (line.match(/`/g)||[]).length;
  dbl += (line.match(/"/g)||[]).length;
  squ += (line.match(/'/g)||[]).length;
  par += (line.match(/\(/g)||[]).length - (line.match(/\)/g)||[]).length;
  if(i<2366){ cum += (line.match(/\{/g)||[]).length - (line.match(/\}/g)||[]).length }
}
console.log('backticks up to 2366:', bt);
console.log("paren diff:", par);
console.log('brace cum up to 2366:', cum);
console.log('total lines:', lines.length);
console.log('line2366:', lines[2365]);
