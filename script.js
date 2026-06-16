const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
const TILE=32;
let map=null;
let gold=0;
let moving=false;
const player={x:0,y:0};
let surfSelected=false;
let surfLevel=1;
let upgradeOpen=false;

document.getElementById("file").addEventListener("change",e=>{
 const f=e.target.files[0]; if(!f)return;
 const r=new FileReader();
 r.onload=()=>{
   map=JSON.parse(r.result);
   map.objects??=[];
   for(const o of map.objects) if(o.type==="chest") o.opened??=false;
   for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)if(map.tiles[y][x]===2){player.x=x;player.y=y;draw();return;}
 };
 r.readAsText(f);
});

function draw(){
 if(!map)return;
 ctx.clearRect(0,0,640,640);
 for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){
   const t=map.tiles[y][x];
   switch(t){case 1:ctx.fillStyle="gray";break;case 2:ctx.fillStyle="#4caf50";break;case 3:ctx.fillStyle="#2196f3";break;default:ctx.fillStyle="black";}
   ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
   ctx.strokeRect(x*TILE,y*TILE,TILE,TILE);
 }
 for(const o of map.objects){
   if(o.type!=="chest")continue;
   ctx.fillStyle=o.opened?"#666":"#8B4513";
   ctx.fillRect(o.x*TILE+4,o.y*TILE+4,24,24);
   if(!o.opened){ctx.fillStyle="gold";ctx.fillRect(o.x*TILE+8,o.y*TILE+8,16,5);}
 }
 if(surfSelected){ctx.fillStyle="deepskyblue";ctx.beginPath();ctx.moveTo(player.x*TILE+16,player.y*TILE+2);ctx.lineTo(player.x*TILE+30,player.y*TILE+30);ctx.lineTo(player.x*TILE+2,player.y*TILE+30);ctx.closePath();ctx.fill();ctx.fillStyle="yellow";ctx.beginPath();ctx.arc(player.x*TILE+16,player.y*TILE+16,7,0,Math.PI*2);ctx.fill();}else{ctx.fillStyle="yellow";ctx.beginPath();ctx.arc(player.x*TILE+16,player.y*TILE+16,10,0,Math.PI*2);ctx.fill();}
 document.getElementById("surfItem").textContent=`[1] ${surfSelected?"🟦":"⬜"} Surfbrett Lv.${surfLevel}`;
 document.getElementById("gold").textContent=gold;
 if(upgradeOpen){ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(120,140,400,220);ctx.fillStyle='white';ctx.font='20px sans-serif';ctx.fillText('Surfbrett Upgrade',180,180);ctx.fillText('Level: '+surfLevel,180,220);ctx.fillText('Kosten: 44 Gold',180,255);ctx.fillText('U = Upgrade | ESC = Schließen',180,290);ctx.fillText('Jedes Level: +2% Wasser-Speed',180,325);}
}

function reward(){
 const r=Math.random();
 if(r<0.45)return 1+Math.floor(Math.random()*5);
 if(r<0.75)return 6+Math.floor(Math.random()*5);
 if(r<0.93)return 11+Math.floor(Math.random()*10);
 if(r<0.99)return 21+Math.floor(Math.random()*8);
 return 29+Math.floor(Math.random()*5);
}

async function move(dx,dy){
 if(!map||moving)return;
 moving=true;
 const nx=player.x+dx, ny=player.y+dy;
 const tile=map.tiles[ny][nx];
 if(nx>=0&&ny>=0&&nx<map.width&&ny<map.height&&(tile===2||(tile===3&&surfSelected))){
   player.x=nx; player.y=ny; draw();
 }
 const base=160;
 const delay=(tile===3&&surfSelected)?Math.max(40,Math.round(base*(1-0.02*(surfLevel-1)))):Math.round(base*1.25);
 await new Promise(r=>setTimeout(r,delay));
 moving=false;
}

document.addEventListener("keydown",e=>{
 if(upgradeOpen){const k=e.key.toLowerCase(); if(k==="escape"){upgradeOpen=false;draw();return;} if(k==="u"){if(surfLevel<5 && gold>=44){gold-=44;surfLevel++;} draw();return;}}
 const k=e.key.toLowerCase();
 if(k==="w")move(0,-1);
 else if(k==="s")move(0,1);
 else if(k==="a")move(-1,0);
 else if(k==="d")move(1,0);
 else if(k==="1"){surfSelected=!surfSelected;draw();}
 else if(k==="m"){upgradeOpen=true;draw();}
 else if(k==="e"&&map){
   for(const o of map.objects){
     if(o.type==="chest"&&!o.opened&&Math.abs(o.x-player.x)+Math.abs(o.y-player.y)===1){
       o.opened=true;
       gold+=reward();
       draw();
       break;
     }
   }
 }
});
