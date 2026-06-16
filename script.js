
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const TILE=32;
let map=null,gold=0,moving=false;
let surfSelected=false,surfLevel=1,upgradeMenu=false;
const player={x:0,y:0};
const delayBase=160;
document.getElementById("file").addEventListener("change",e=>{
 const f=e.target.files[0]; if(!f)return;
 const r=new FileReader();
 r.onload=()=>{map=JSON.parse(r.result);map.objects??=[];for(const o of map.objects)if(o.type==="chest")o.opened??=false;
 outer:for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)if(map.tiles[y][x]===2){player.x=x;player.y=y;break outer;} draw();};
 r.readAsText(f);
});
function tileColor(t){return t===1?"gray":t===2?"green":t===3?"deepskyblue":"black";}
function draw(){
 if(!map)return;ctx.clearRect(0,0,640,640);
 for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){ctx.fillStyle=tileColor(map.tiles[y][x]);ctx.fillRect(x*TILE,y*TILE,TILE,TILE);ctx.strokeRect(x*TILE,y*TILE,TILE,TILE);}
 for(const o of map.objects){if(o.type!=="chest")continue;ctx.fillStyle=o.opened?"#666":"#8B4513";ctx.fillRect(o.x*TILE+4,o.y*TILE+4,24,24);if(!o.opened){ctx.fillStyle="gold";ctx.fillRect(o.x*TILE+8,o.y*TILE+8,16,5);}}
 if(surfSelected){ctx.fillStyle="deepskyblue";ctx.beginPath();ctx.moveTo(player.x*TILE+16,player.y*TILE+2);ctx.lineTo(player.x*TILE+30,player.y*TILE+30);ctx.lineTo(player.x*TILE+2,player.y*TILE+30);ctx.closePath();ctx.fill();}
 ctx.fillStyle="yellow";ctx.beginPath();ctx.arc(player.x*TILE+16,player.y*TILE+16,surfSelected?7:10,0,6.28);ctx.fill();
 let info=document.getElementById("info"); if(!info){info=document.createElement("div");info.id="info";document.body.appendChild(info);}
 info.innerHTML=`Gold:${gold}<br>Surf Lv.${surfLevel} ${surfSelected?"(AN)":"(AUS)"}${upgradeMenu?"<br><b>Upgrade: U (44 Gold), ESC schließen</b>":""}`;
}
async function move(dx,dy){
 if(!map||moving)return;
 let nx=player.x+dx,ny=player.y+dy;
 if(nx<0||ny<0||nx>=map.width||ny>=map.height)return;
 let t=map.tiles[ny][nx];
 if(!(t===2||(t===3&&surfSelected)))return;
 moving=true;player.x=nx;player.y=ny;draw();
 let d=delayBase;
 if(surfSelected){
   if(t===2)d=220;
   else d=Math.max(60,delayBase*(1-0.02*(surfLevel-1)));
 }
 await new Promise(r=>setTimeout(r,d));moving=false;
}
document.addEventListener("keydown",e=>{
 let k=e.key.toLowerCase();
 if(k==="m"){upgradeMenu=!upgradeMenu;draw();return;}
 if(k==="escape"){upgradeMenu=false;draw();return;}
 if(k==="u"&&upgradeMenu&&gold>=44&&surfLevel<5){gold-=44;surfLevel++;draw();return;}
 if(k==="1"){
   if(map&&map.tiles[player.y][player.x]===3&&surfSelected)return;
   surfSelected=!surfSelected;draw();return;
 }
 if(k==="w")move(0,-1); else if(k==="s")move(0,1); else if(k==="a")move(-1,0); else if(k==="d")move(1,0);

 if(k==="e"&&map){
   for(const o of map.objects){
     if(o.type==="chest"&&!o.opened&&Math.abs(o.x-player.x)+Math.abs(o.y-player.y)===1){
       o.opened=true;
       const r=Math.random();
       let g=r<0.45?1+Math.floor(Math.random()*5):r<0.75?6+Math.floor(Math.random()*5):r<0.93?11+Math.floor(Math.random()*10):r<0.99?21+Math.floor(Math.random()*8):29+Math.floor(Math.random()*5);
       gold+=g;draw();break;
     }
   }
 }
});
