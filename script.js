if (upgradeMenuOpen) {

    // Hintergrund abdunkeln
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Menü
    ctx.fillStyle = "#1b1b1b";
    ctx.fillRect(170, 120, 300, 220);

    ctx.strokeStyle = "#555";
    ctx.lineWidth = 3;
    ctx.strokeRect(170, 120, 300, 220);

    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.fillText("Surfbrett Upgrade", 205, 155);

    ctx.font = "18px Arial";
    ctx.fillText("Level: " + surfLevel + "/5", 200, 195);
    ctx.fillText("Kosten: 44 Gold", 200, 225);

    if (surfLevel < 5) {
        ctx.fillStyle = "#33cc33";
        ctx.fillText("[U] Upgrade kaufen", 200, 270);
    } else {
        ctx.fillStyle = "#ffaa00";
        ctx.fillText("Max. Level erreicht", 200, 270);
    }

    ctx.fillStyle = "#cccccc";
    ctx.fillText("[ESC] Schließen", 200, 310);

}
