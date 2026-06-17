const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
const TILE=32;
const VIEW_W=20;
const VIEW_H=20;

let map=null;
let gold=0;
let moving=false;
const player={x:0,y:0};
let surfSelected=false;
let surfLevel=1;
let surfDir={x:0,y:0};
let surfLoop=false;

document.getElementById("file").addEventListener("change",e=>{
 const f=e.target.files[0];
 if(!f)return;
 const r=new FileReader();
 r.onload=()=>{
   map=JSON.parse(r.result);
   map.objects??=[];
   for(const o of map.objects){
      if(o.type==="chest") o.opened??=false;
   }
   if(map.spawn){
      player.x=map.spawn.x;
      player.y=map.spawn.y;
   }
   draw();
 };
 r.readAsText(f);
});

function draw(){
 if(!map)return;
 ctx.clearRect(0,0,640,640);

 let camX=Math.max(0,Math.min(player.x-10,map.width-VIEW_W));
 let camY=Math.max(0,Math.min(player.y-10,map.height-VIEW_H));

 for(let y=0;y<VIEW_H;y++){
   for(let x=0;x<VIEW_W;x++){
      const mx=camX+x,my=camY+y;
      if(mx>=map.width||my>=map.height)continue;
      switch(map.tiles[my][mx]){
        case 1:ctx.fillStyle="gray";break;
        case 2:ctx.fillStyle="#4caf50";break;
        case 3:ctx.fillStyle="#2196f3";break;
        default:ctx.fillStyle="black";
      }
      ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
      ctx.strokeRect(x*TILE,y*TILE,TILE,TILE);
   }
 }

 for(const o of map.objects){
   if(o.type!=="chest")continue;
   const sx=(o.x-camX)*TILE;
   const sy=(o.y-camY)*TILE;
   if(sx<0||sy<0||sx>=640||sy>=640)continue;
   ctx.fillStyle=o.opened?"#666":"#8B4513";
   ctx.fillRect(sx+4,sy+4,24,24);
   if(!o.opened){
      ctx.fillStyle="gold";
      ctx.fillRect(sx+8,sy+8,16,5);
   }
 }

 const px=(player.x-camX)*TILE;
 const py=(player.y-camY)*TILE;

 if(surfSelected){
   ctx.fillStyle="deepskyblue";
   ctx.beginPath();
   ctx.moveTo(px+16,py+2);
   ctx.lineTo(px+30,py+30);
   ctx.lineTo(px+2,py+30);
   ctx.closePath();
   ctx.fill();
   ctx.fillStyle="yellow";
   ctx.beginPath();
   ctx.arc(px+16,py+16,7,0,Math.PI*2);
   ctx.fill();
 }else{
   ctx.fillStyle="yellow";
   ctx.beginPath();
   ctx.arc(px+16,py+16,10,0,Math.PI*2);
   ctx.fill();
 }

 document.getElementById("inventory").innerHTML=`<h2>🎒 Inventar</h2>
<p>🪙 Gold: <b>${gold}</b></p>
<p>🏄 Surfbrett: <b>Lv.${surfLevel}/5</b> ${surfSelected?"✅":"❌"}</p>`;
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
 const nx=player.x+dx;
 const ny=player.y+dy;
 if(nx<0||ny<0||nx>=map.width||ny>=map.height)return;
 const current=map.tiles[player.y][player.x];
 const next=map.tiles[ny][nx];
 moving=true;
 if(current===2){
   if(next===2 && !surfSelected){
      player.x=nx; player.y=ny;
   }else if(next===3 && surfSelected){
      player.x=nx; player.y=ny;
      surfDir={x:dx,y:dy};
      if(!surfLoop){ surfLoop=true; autoSurf(); }
   }
 }else if(current===3){
   if(next===3){
      player.x=nx; player.y=ny;
      surfDir={x:dx,y:dy};
   }else if(next===2){
      player.x=nx; player.y=ny;
      surfSelected=false;
      surfLoop=false;
      surfDir={x:0,y:0};
   }
 }
 draw();
 await new Promise(r=>setTimeout(r,160));
 moving=false;
}

async function autoSurf(){
 while(surfLoop && surfSelected && map && map.tiles[player.y][player.x]===3){
   await new Promise(r=>setTimeout(r,180));
   if(moving) continue;
   const nx=player.x+surfDir.x;
   const ny=player.y+surfDir.y;
   if(nx<0||ny<0||nx>=map.width||ny>=map.height) break;
   const t=map.tiles[ny][nx];
   if(t===3){
      player.x=nx; player.y=ny;
      draw();
   }else if(t===2){
      player.x=nx; player.y=ny;
      surfSelected=false;
      surfLoop=false;
      draw();
      break;
   }else{
      break;
   }
 }
}

document.addEventListener("keydown",e=>{
 const k=e.key.toLowerCase();

 if(k==="w"){surfDir={x:0,y:-1};move(0,-1);}
 else if(k==="s"){surfDir={x:0,y:1};move(0,1);}
 else if(k==="a"){surfDir={x:-1,y:0};move(-1,0);}
 else if(k==="d"){surfDir={x:1,y:0};move(1,0);}
 else if(k==="1"){
   if(!map)return;
   if(map.tiles[player.y][player.x]!==2)return;

   const nearWater=
      (player.y>0&&map.tiles[player.y-1][player.x]===3)||
      (player.y<map.height-1&&map.tiles[player.y+1][player.x]===3)||
      (player.x>0&&map.tiles[player.y][player.x-1]===3)||
      (player.x<map.width-1&&map.tiles[player.y][player.x+1]===3);

   if(nearWater){
      surfSelected=true;
      draw();
   }
 }
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
