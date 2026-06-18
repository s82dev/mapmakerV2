const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const TILE = 32;
const VIEW_W = 20;
const VIEW_H = 20;

let map = null;
let gold = 0;

const player = {
    x: 0,
    y: 0
};

let surfSelected = false;
let surfLevel = 1;

let moving = false;

// ===== Tastatur =====

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// ===== Richtung =====

let dirX = 0;
let dirY = 1;

// ===== Surfen =====

let surfing = false;
let surfDX = 0;
let surfDY = 0;

// ===== Geschwindigkeit =====

const WALK_DELAY = 145;
const SURF_DELAY = 145;

// ===== Teleporter =====

// Cooldown pro Teleporter-ID
const teleportCooldown = {};

// Blinkstatus
let teleportBlink = true;

// Schutz vor sofortigem Zurückteleportieren
let teleportProtectionUntil = 0;

// Blinktimer
setInterval(() => {

    teleportBlink = !teleportBlink;

    if (map) draw();

}, 500);

// ===== Kamera =====

function getCamera() {

    let camX = player.x - Math.floor(VIEW_W / 2);
    let camY = player.y - Math.floor(VIEW_H / 2);

    camX = Math.max(0, Math.min(camX, map.width - VIEW_W));
    camY = Math.max(0, Math.min(camY, map.height - VIEW_H));

    return {
        x: camX,
        y: camY
    };
}

// ===== Map laden =====

document.getElementById("file").addEventListener("change", e => {

    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {

        map = JSON.parse(reader.result);

        map.objects ??= [];
        map.teleports ??= [];

        for (const obj of map.objects) {

            if (obj.type === "chest")
                obj.opened ??= false;

        }

        if (map.spawn) {

            player.x = map.spawn.x;
            player.y = map.spawn.y;

        }

        draw();

    };

    reader.readAsText(file);

});
// ===== Zeichnen =====

function draw() {

    if (!map) return;

    const cam = getCamera();

    ctx.clearRect(0, 0, 640, 640);

    // ===== Map =====

    for (let y = 0; y < VIEW_H; y++) {

        for (let x = 0; x < VIEW_W; x++) {

            const mx = cam.x + x;
            const my = cam.y + y;

            if (mx < 0 || my < 0) continue;
            if (mx >= map.width || my >= map.height) continue;

            const tile = map.tiles[my][mx];

            switch (tile) {

                case 1:
                    ctx.fillStyle = "gray";
                    break;

                case 2:
                    ctx.fillStyle = "#4caf50";
                    break;

                case 3:
                    ctx.fillStyle = "#2196f3";
                    break;

                case 4:

                    let visible = true;

                    if (map.teleports) {

                        const tp = map.teleports.find(t =>
                            t.x === mx &&
                            t.y === my
                        );

                        if (tp) {

                            const cd = teleportCooldown[tp.id] || 0;

                            if (Date.now() < cd) {

                                visible = teleportBlink;

                            }

                        }

                    }

                    ctx.fillStyle = visible
                        ? "#b000ff"
                        : "#222222";

                    break;

                default:
                    ctx.fillStyle = "black";

            }

            ctx.fillRect(
                x * TILE,
                y * TILE,
                TILE,
                TILE
            );

            ctx.strokeRect(
                x * TILE,
                y * TILE,
                TILE,
                TILE
            );

        }

    }

    // ===== Truhen =====

    for (const o of map.objects) {

        if (o.type !== "chest") continue;

        const sx = (o.x - cam.x) * TILE;
        const sy = (o.y - cam.y) * TILE;

        if (
            sx < 0 ||
            sy < 0 ||
            sx >= 640 ||
            sy >= 640
        ) continue;

        ctx.fillStyle =
            o.opened
                ? "#666"
                : "#8B4513";

        ctx.fillRect(
            sx + 4,
            sy + 4,
            24,
            24
        );

        if (!o.opened) {

            ctx.fillStyle = "gold";

            ctx.fillRect(
                sx + 8,
                sy + 8,
                16,
                5
            );

        }

    }

    // ===== Spieler =====

    const px = (player.x - cam.x) * TILE;
    const py = (player.y - cam.y) * TILE;

    if (surfSelected) {

        ctx.fillStyle = "deepskyblue";

        ctx.beginPath();
        ctx.moveTo(px + 16, py + 2);
        ctx.lineTo(px + 30, py + 30);
        ctx.lineTo(px + 2, py + 30);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "yellow";

        ctx.beginPath();
        ctx.arc(
            px + 16,
            py + 16,
            7,
            0,
            Math.PI * 2
        );
        ctx.fill();

    } else {

        ctx.fillStyle = "yellow";

        ctx.beginPath();
        ctx.arc(
            px + 16,
            py + 16,
            10,
            0,
            Math.PI * 2
        );
        ctx.fill();

    }

    // ===== Inventar =====

    document.getElementById("inventory").innerHTML = `
<h2>🎒 Inventar</h2>
<p>🪙 Gold: <b>${gold}</b></p>
<p>🏄 Surfbrett: <b>Lv.${surfLevel}/5</b> ${surfSelected ? "✅" : "❌"}</p>`;
}
// ===== Belohnung =====

function reward(){

    const r=Math.random();

    if(r<0.45) return 1+Math.floor(Math.random()*5);

    if(r<0.75) return 6+Math.floor(Math.random()*5);

    if(r<0.93) return 11+Math.floor(Math.random()*10);

    if(r<0.99) return 21+Math.floor(Math.random()*8);

    return 29+Math.floor(Math.random()*5);

}

// ===== Teleporter =====

function teleportPlayer(){

    if(!map) return;

    if(!map.teleports) return;

    // Schutz nach Teleport
    if(Date.now()<teleportProtectionUntil)
        return;

    // Aktuellen Teleporter suchen
    const tp=map.teleports.find(t=>
        t.x===player.x &&
        t.y===player.y
    );

    if(!tp) return;

    // Cooldown aktiv?
    if(
        teleportCooldown[tp.id] &&
        teleportCooldown[tp.id]>Date.now()
    ){
        return;
    }

    // Ziel suchen
    const target=map.teleports.find(t=>

        t.id===tp.id &&

        (
            t.x!==tp.x ||
            t.y!==tp.y
        )

    );

    if(!target) return;

    // Beide Teleporter 5 Sekunden sperren
    teleportCooldown[tp.id]=Date.now()+5000;

    // Teleport
    player.x=target.x;
    player.y=target.y;

    // 200 ms Schutz gegen Zurückteleportieren
    teleportProtectionUntil=Date.now()+200;

    draw();

}
// ===== Bewegung =====

async function move(dx,dy){

    if(!map) return;
    if(moving) return;

    dirX=dx;
    dirY=dy;

    const nx=player.x+dx;
    const ny=player.y+dy;

    if(nx<0||ny<0) return;
    if(nx>=map.width||ny>=map.height) return;

    const current=map.tiles[player.y][player.x];
    const next=map.tiles[ny][nx];

    moving=true;

    // ===== LAND =====

    if(current===2 || current===4){

        // Land oder Teleporter
        if((next===2 || next===4) && !surfSelected){

            player.x=nx;
            player.y=ny;

            teleportPlayer();

        }

        // Surfen starten
        else if(next===3 && surfSelected){

            player.x=nx;
            player.y=ny;

            surfing=true;

            surfDX=dx;
            surfDY=dy;

        }

    }

    // ===== WASSER =====

    else if(current===3){

        // Weiter surfen
        if(next===3){

            player.x=nx;
            player.y=ny;

            surfDX=dx;
            surfDY=dy;

        }

        // Wasser verlassen
        else if(next===2 || next===4){

            player.x=nx;
            player.y=ny;

            surfing=false;
            surfSelected=false;

            surfDX=0;
            surfDY=0;

            teleportPlayer();

        }

        // Gegen Wand gefahren
        else{

            moving=false;

            if(surfing){

                setTimeout(()=>{

                    if(
                        surfing &&
                        (surfDX!==0 || surfDY!==0)
                    ){

                        move(surfDX,surfDY);

                    }

                },SURF_DELAY);

            }

            draw();
            return;

        }

    }

    draw();

    await new Promise(r=>setTimeout(r,WALK_DELAY));

    moving=false;

    // ===== Autosurf =====

    if(surfing){

        setTimeout(()=>{

            if(
                surfing &&
                !moving &&
                (surfDX!==0 || surfDY!==0)
            ){

                move(surfDX,surfDY);

            }

        },1);

    }

}
// ===== Dauerlaufen =====

setInterval(()=>{

    if(!map) return;
    if(moving) return;

    if(keys.w){
        move(0,-1);
        return;
    }

    if(keys.s){
        move(0,1);
        return;
    }

    if(keys.a){
        move(-1,0);
        return;
    }

    if(keys.d){
        move(1,0);
        return;
    }

},WALK_DELAY);


// ===== Taste drücken =====

document.addEventListener("keydown",e=>{

    const k=e.key.toLowerCase();

    if(keys.hasOwnProperty(k))
        keys[k]=true;

    // Richtung beim Surfen ändern
    if(surfing){

        if(k==="w"){
            surfDX=0;
            surfDY=-1;
        }

        if(k==="s"){
            surfDX=0;
            surfDY=1;
        }

        if(k==="a"){
            surfDX=-1;
            surfDY=0;
        }

        if(k==="d"){
            surfDX=1;
            surfDY=0;
        }

    }

    // Surfbrett auswählen
    if(k==="1"){

        if(!map) return;

        if(map.tiles[player.y][player.x]!==2)
            return;

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

    // Truhe öffnen
    if(k==="e" && map){

        for(const o of map.objects){

            if(
                o.type==="chest" &&
                !o.opened &&
                Math.abs(o.x-player.x)+
                Math.abs(o.y-player.y)===1
            ){

                o.opened=true;

                gold+=reward();

                draw();

                break;

            }

        }

    }

});


// ===== Taste loslassen =====

document.addEventListener("keyup",e=>{

    const k=e.key.toLowerCase();

    if(keys.hasOwnProperty(k))
        keys[k]=false;

});
