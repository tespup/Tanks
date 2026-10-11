"use strict";

function drawTreads(g, pal, trackPhase) {
    g.fillStyle = pal.tread;
    g.fillRect(-24, -20, 10, 40); g.fillRect(14, -20, 10, 40);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    const ph = ((trackPhase % 8) + 8) % 8;
    for (let i = 0; i < 6; i++) {
        const yy = -20 + ((i * 8 + ph) % 48);
        if (yy < -20 || yy > 18) continue;
        g.fillRect(-24, yy, 10, 3); g.fillRect(14, yy, 10, 3);
    }
    g.fillStyle = 'rgba(255,255,255,0.10)';
    g.fillRect(-24, -20, 2, 40); g.fillRect(22, -20, 2, 40);
}

function drawMuzzle(g, muzzle, tips) {
    if (muzzle <= 0) return;
    const m = clamp(muzzle / 0.07, 0, 1);
    for (let i = 0; i < tips.length; i++) {
        g.globalAlpha = m;
        g.fillStyle = '#fff8c0'; g.beginPath(); g.arc(tips[i][0], tips[i][1], 6 * m + 2, 0, 7); g.fill();
        g.fillStyle = '#ffd040'; g.beginPath(); g.arc(tips[i][0], tips[i][1], 3.5 * m + 1, 0, 7); g.fill();
        g.globalAlpha = 1;
    }
}

function drawArmorPips(g, hp, color) {
    const n = Math.max(0, hp || 0);
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(-12, 14, 24, 5);
    if (n <= 0) return;
    const w = 4, gap = 2, total = n * w + (n - 1) * gap;
    let x = -total / 2;
    g.fillStyle = color;
    for (let i = 0; i < n; i++) { g.fillRect(x, 14.5, w, 4); x += w + gap; }
}

function drawRotRings(g, t, r, color, count, speed) {
    g.save();
    g.strokeStyle = color; g.lineWidth = 2;
    for (let i = 0; i < count; i++) {
        const a0 = t * speed + i * (Math.PI * 2 / count);
        g.beginPath(); g.arc(0, 2, r, a0, a0 + 1.1); g.stroke();
    }
    g.restore();
}

function drawPlayerTank(g, power, trackPhase, t, muzzle, hp, palSet) {
    const set = palSet || P1_PALETTES;
    const pal = set[clamp(power, 0, MAX_POWER)] || set[0];
    const pu = 0.5 + 0.5 * Math.sin(t * 6);
    
    if (power >= 3) {
        g.save();
        g.globalAlpha = 0.16 + 0.14 * pu;
        g.fillStyle = pal.aura || pal.light;
        g.beginPath(); g.arc(0, 0, 25, 0, 7); g.fill();
        g.restore();
    }
    
    drawTreads(g, pal, trackPhase);
    
    if (power === 0) {
        g.fillStyle = pal.dark;  g.fillRect(-12, -15, 24, 30);
        g.fillStyle = pal.body;  g.fillRect(-10, -13, 20, 26);
        g.fillStyle = pal.light; g.fillRect(-10, -13, 20, 3);
        g.fillStyle = pal.dark;  g.fillRect(-2.5, -23, 5, 11);
        g.fillStyle = pal.body;  g.beginPath(); g.arc(0, 0, 7, 0, 7); g.fill();
        g.fillStyle = pal.dark;  g.beginPath(); g.arc(0, 0, 3, 0, 7); g.fill();
        drawMuzzle(g, muzzle, [[0, -24]]);
        return;
    }
    if (power === 1) {
        g.fillStyle = pal.dark;  g.fillRect(-14, -16, 28, 32);
        g.fillStyle = pal.body;  g.fillRect(-12, -14, 24, 28);
        g.fillStyle = pal.light; g.fillRect(-12, -14, 24, 3); g.fillRect(-12, -14, 3, 28);
        g.fillStyle = pal.dark;  g.fillRect(-17, -9, 4, 18); g.fillRect(13, -9, 4, 18);
        g.fillStyle = pal.light; g.fillRect(-17, -9, 4, 2); g.fillRect(13, -9, 4, 2);
        g.fillStyle = pal.body;
        g.beginPath(); g.moveTo(-8, -14); g.lineTo(0, -20); g.lineTo(8, -14); g.closePath(); g.fill();
        g.fillStyle = pal.dark;  g.fillRect(-3, -27, 6, 16);
        g.fillStyle = pal.body;  g.fillRect(-2, -27, 4, 15);
        g.fillStyle = pal.light; g.fillRect(-2, -27, 4, 2);
        g.fillStyle = pal.dark;  g.beginPath(); g.arc(0, 1, 10, 0, 7); g.fill();
        g.fillStyle = pal.body;  g.beginPath(); g.arc(0, 1, 8, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,250,200,' + (0.5 + 0.5 * Math.sin(t * 12)).toFixed(2) + ')';
        g.beginPath(); g.arc(0, 1, 4, 0, 7); g.fill();
        g.fillStyle = pal.light;
        g.beginPath(); g.moveTo(-15, 6); g.lineTo(-20, 11); g.lineTo(-15, 16); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(15, 6);  g.lineTo(20, 11);  g.lineTo(15, 16);  g.closePath(); g.fill();
        drawMuzzle(g, muzzle, [[0, -28]]);
        return;
    }
    if (power === 2) {
        g.fillStyle = pal.dark;  g.fillRect(-15, -17, 30, 34);
        g.fillStyle = pal.body;  g.fillRect(-13, -15, 26, 30);
        g.fillStyle = pal.light; g.fillRect(-13, -15, 26, 3);
        g.fillStyle = pal.dark;  g.fillRect(-19, -11, 5, 22); g.fillRect(14, -11, 5, 22);
        g.fillStyle = pal.light; g.fillRect(-19, -11, 5, 2); g.fillRect(14, -11, 5, 2);
        g.fillStyle = pal.dark;  g.fillRect(-10, -24, 4, 14); g.fillRect(-2, -26, 4, 16); g.fillRect(6, -24, 4, 14);
        g.fillStyle = pal.body;  g.fillRect(-9, -24, 2, 13);  g.fillRect(-1, -26, 2, 15); g.fillRect(7, -24, 2, 13);
        g.fillStyle = pal.dark;  g.beginPath(); g.arc(0, 2, 11, 0, 7); g.fill();
        g.fillStyle = pal.body;  g.beginPath(); g.arc(0, 2, 9, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,250,200,' + (0.55 + 0.45 * Math.sin(t * 8)).toFixed(2) + ')';
        g.beginPath(); g.arc(0, 2, 4, 0, 7); g.fill();
        g.strokeStyle = pal.light; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(9, 8); g.lineTo(15, 15); g.stroke();
        drawMuzzle(g, muzzle, [[-8, -25], [0, -27], [8, -25]]);
        return;
    }
    if (power === 3) {
        g.fillStyle = pal.dark;  g.fillRect(-15, -17, 30, 34);
        g.fillStyle = pal.body;  g.fillRect(-13, -15, 26, 30);
        g.fillStyle = pal.light; g.fillRect(-13, -15, 26, 3);
        g.fillStyle = '#e8ffff'; g.fillRect(-11, -5, 4, 9); g.fillRect(7, -5, 4, 9);
        g.fillStyle = pal.dark;  g.fillRect(-19, -11, 5, 22); g.fillRect(14, -11, 5, 22);
        g.fillStyle = pal.light; g.fillRect(-19, -11, 5, 2); g.fillRect(14, -11, 5, 2);
        g.fillStyle = pal.dark;  g.fillRect(-10, -24, 4, 14); g.fillRect(-2, -26, 4, 16); g.fillRect(6, -24, 4, 14);
        g.fillStyle = '#e8ffff'; g.fillRect(-9, -25, 2, 3); g.fillRect(-1, -27, 2, 3); g.fillRect(7, -25, 2, 3);
        g.fillStyle = pal.dark;  g.beginPath(); g.arc(0, 2, 11, 0, 7); g.fill();
        g.fillStyle = pal.body;  g.beginPath(); g.arc(0, 2, 9, 0, 7); g.fill();
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 2, 3.5 + 2 * pu, 0, 7); g.fill();
        drawRotRings(g, t, 15, 'rgba(232,255,255,0.85)', 2, 3);
        drawArmorPips(g, hp, pal.light);
        drawMuzzle(g, muzzle, [[-8, -25], [0, -27], [8, -25]]);
        return;
    }
    if (power === 4) {
        g.fillStyle = pal.dark;  g.fillRect(-16, -18, 32, 36);
        g.fillStyle = pal.body;  g.fillRect(-14, -16, 28, 32);
        g.fillStyle = pal.light; g.fillRect(-14, -16, 28, 3);
        g.fillStyle = '#e8f0ff'; g.fillRect(-11, -6, 4, 10); g.fillRect(7, -6, 4, 10);
        g.fillStyle = pal.dark;  g.fillRect(-20, -12, 6, 24); g.fillRect(14, -12, 6, 24);
        g.fillStyle = pal.light; g.fillRect(-20, -12, 6, 2); g.fillRect(14, -12, 6, 2);
        g.fillStyle = 'rgba(0,0,0,0.4)';
        [[-17, -8], [-17, 0], [-17, 8], [17, -8], [17, 0], [17, 8]].forEach(q => { g.beginPath(); g.arc(q[0], q[1], 1.6, 0, 7); g.fill(); });
        g.fillStyle = pal.dark;  g.fillRect(-10, -25, 4, 15); g.fillRect(-2, -27, 4, 17); g.fillRect(6, -25, 4, 15);
        g.fillStyle = '#dff0ff'; g.fillRect(-9, -26, 2, 3); g.fillRect(-1, -28, 2, 3); g.fillRect(7, -26, 2, 3);
        g.fillStyle = pal.dark;  g.beginPath(); g.arc(0, 2, 12, 0, 7); g.fill();
        g.fillStyle = pal.body;  g.beginPath(); g.arc(0, 2, 10, 0, 7); g.fill();
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 2, 3.5 + 1.6 * pu, 0, 7); g.fill();
        drawRotRings(g, t, 16, 'rgba(220,240,255,0.8)', 2, 2.4);
        drawArmorPips(g, hp, pal.light);
        drawMuzzle(g, muzzle, [[-8, -26], [0, -28], [8, -26]]);
        return;
    }
    
    // Power 5
    g.fillStyle = pal.dark;  g.fillRect(-17, -18, 34, 36);
    g.fillStyle = pal.body;  g.fillRect(-15, -16, 30, 32);
    g.fillStyle = pal.light; g.fillRect(-15, -16, 30, 3);
    g.fillStyle = pal.dark;  g.fillRect(-21, -13, 6, 26); g.fillRect(15, -13, 6, 26);
    g.fillStyle = pal.light; g.fillRect(-21, -13, 6, 2); g.fillRect(15, -13, 6, 2);
    g.fillStyle = pal.dark;
    g.fillRect(-12, -24, 3, 13); g.fillRect(-6, -26, 3, 15); g.fillRect(-1.5, -28, 3, 17); g.fillRect(3, -26, 3, 15); g.fillRect(9, -24, 3, 13);
    g.fillStyle = pal.light;
    g.fillRect(-12, -25, 3, 2); g.fillRect(-6, -27, 3, 2); g.fillRect(-1.5, -29, 3, 2); g.fillRect(3, -27, 3, 2); g.fillRect(9, -25, 3, 2);
    g.fillStyle = pal.dark;  poly(g, 0, 2, 12, 6, t * 0.7);
    g.fillStyle = pal.body;  poly(g, 0, 2, 10, 6, t * 0.7);
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 2, 3.5 + 2 * pu, 0, 7); g.fill();
    drawRotRings(g, t, 17, 'rgba(255,220,160,0.85)', 3, -2.8);
    drawArmorPips(g, hp, pal.light);
    drawMuzzle(g, muzzle, [[-10.5, -25], [-4.5, -27], [0, -29], [4.5, -27], [10.5, -25]]);
}

function drawExcavator(g, trackPhase, t, building, progress, powerPal, hp) {
    const pal = EXCAVATOR_PAL;
    const pp = powerPal || P1_PALETTES[0];
    drawTreads(g, pal, trackPhase);
    if (building) {
        g.save();
        g.globalAlpha = 0.16 + 0.14 * Math.sin(t * 9);
        g.fillStyle = '#c0c8ce';
        g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fill();
        g.restore();
    }
    g.fillStyle = pal.dark;  g.fillRect(-14, -6, 28, 25);
    g.fillStyle = pal.body;  g.fillRect(-12, -4, 24, 21);
    g.fillStyle = pal.light; g.fillRect(-12, -4, 24, 3);
    g.fillStyle = '#20180a';
    for (let i = 0; i < 4; i++) g.fillRect(-12 + i * 7, 12, 4, 5);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(-11, 7, 22, 4);
    g.fillStyle = pp.body;             g.fillRect(-11, 7, 22, 4);
    g.fillStyle = pal.dark;  g.fillRect(-9, 0, 18, 12);
    g.fillStyle = '#7fd4ff'; g.fillRect(-7, 2, 14, 7);
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(-7, 2, 14, 2);
    
    const lift = building ? Math.sin(t * 12) * 4.5 : Math.sin(t * 2.2) * 1.4;
    g.save();
    g.translate(0, lift * 0.35);
    g.fillStyle = pal.dark; g.fillRect(-4, -18, 8, 15);
    g.fillStyle = pal.body; g.fillRect(-3, -17, 6, 13);
    g.fillStyle = pal.light; g.fillRect(-3, -17, 2, 13);
    const by = -18 + lift * 0.5;
    g.fillStyle = '#3a4046';
    g.beginPath(); g.moveTo(-11, by); g.lineTo(11, by); g.lineTo(8, by - 7); g.lineTo(-8, by - 7); g.closePath(); g.fill();
    g.fillStyle = '#9aa2a8';
    g.beginPath(); g.moveTo(-9, by - 1); g.lineTo(9, by - 1); g.lineTo(7, by - 6); g.lineTo(-7, by - 6); g.closePath(); g.fill();
    g.fillStyle = '#c0c8ce';
    for (let i = -1; i <= 1; i++) g.fillRect(i * 7 - 1.5, by - 9, 3, 3);
    g.restore();
    
    const bl = Math.floor(t * 5) % 2 === 0;
    g.fillStyle = bl ? '#ff8020' : '#ffd040';
    g.beginPath(); g.arc(0, 19, 3.4, 0, 7); g.fill();
    if (bl) { g.save(); g.globalAlpha = 0.35; g.fillStyle = '#ff8020'; g.beginPath(); g.arc(0, 19, 8, 0, 7); g.fill(); g.restore(); }
    
    if (building) {
        g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(-16, -25, 32, 5);
        g.fillStyle = '#c0c8ce';         g.fillRect(-15, -24, 30 * clamp(progress, 0, 1), 3);
    }
    drawArmorPips(g, hp, pal.light);
}

function drawEnemyTank(g, type, pal, hp, maxHp, trackPhase, t, muzzle) {
    drawTreads(g, pal, trackPhase);
    if (type === 'basic') {
        g.fillStyle = pal.dark;  g.fillRect(-12, -15, 24, 30);
        g.fillStyle = pal.body;  g.fillRect(-10, -13, 20, 26);
        g.fillStyle = pal.light; g.fillRect(-10, -13, 20, 3);
        g.fillStyle = pal.dark;  g.fillRect(-2.5, -23, 5, 11);
        g.fillStyle = pal.body;  g.beginPath(); g.arc(0, 0, 7, 0, 7); g.fill();
        g.fillStyle = pal.dark;  g.beginPath(); g.arc(0, 0, 3, 0, 7); g.fill();
        drawMuzzle(g, muzzle, [[0, -24]]);
    } else if (type === 'fast') {
        g.fillStyle = pal.dark;  g.fillRect(-9, -16, 18, 32);
        g.fillStyle = pal.body;  g.fillRect(-7, -14, 14, 28);
        g.fillStyle = pal.light; g.fillRect(-7, -14, 14, 3);
        g.fillStyle = pal.body;
        g.beginPath(); g.moveTo(-7, -14); g.lineTo(0, -22); g.lineTo(7, -14); g.closePath(); g.fill();
        g.fillStyle = pal.dark;  g.fillRect(-2, -26, 4, 12);
        g.fillStyle = pal.dark;  g.beginPath(); g.arc(0, 2, 6, 0, 7); g.fill();
        g.fillStyle = pal.light; g.beginPath(); g.arc(0, 2, 3, 0, 7); g.fill();
        const a = 0.25 + 0.3 * Math.abs(Math.sin(t * 10));
        g.fillStyle = 'rgba(220,245,255,' + a.toFixed(2) + ')';
        g.fillRect(-17, 8, 3, 9); g.fillRect(14, 8, 3, 9);
        drawMuzzle(g, muzzle, [[0, -27]]);
    } else if (type === 'power') {
        g.fillStyle = pal.dark;  g.fillRect(-14, -16, 28, 32);
        g.fillStyle = pal.body;  g.fillRect(-12, -14, 24, 28);
        g.fillStyle = pal.light; g.fillRect(-12, -14, 24, 3);
        g.fillStyle = pal.dark;  g.fillRect(-16, -6, 3, 12); g.fillRect(13, -6, 3, 12);
        g.fillStyle = pal.dark;  g.fillRect(-7, -25, 4, 13); g.fillRect(3, -25, 4, 13);
        g.fillStyle = pal.body;  g.fillRect(-6, -25, 2, 12); g.fillRect(4, -25, 2, 12);
        g.fillStyle = pal.dark;  g.beginPath(); g.arc(0, 1, 11, 0, 7); g.fill();
        g.fillStyle = pal.body;  g.beginPath(); g.arc(0, 1, 9, 0, 7); g.fill();
        g.fillStyle = pal.light; g.beginPath(); g.arc(-3, -2, 3.5, 0, 7); g.fill();
        drawMuzzle(g, muzzle, [[-5, -26], [5, -26]]);
    } else if (type === 'armor') {
        g.fillStyle = pal.dark;  g.fillRect(-16, -18, 32, 36);
        g.fillStyle = pal.body;  g.fillRect(-14, -16, 28, 32);
        g.fillStyle = pal.light; g.fillRect(-14, -16, 28, 3);
        g.fillStyle = pal.dark;  g.fillRect(-19, -12, 5, 24); g.fillRect(14, -12, 5, 24); g.fillRect(-10, -19, 20, 4);
        g.fillStyle = 'rgba(0,0,0,0.45)';
        [[-11, -10], [11, -10], [-11, 10], [11, 10]].forEach(q => { g.beginPath(); g.arc(q[0], q[1], 1.8, 0, 7); g.fill(); });
        g.fillStyle = pal.dark;  g.fillRect(-8, -24, 5, 12); g.fillRect(3, -24, 5, 12);
        g.fillStyle = pal.light; g.fillRect(-7, -24, 2, 10); g.fillRect(5, -24, 2, 10);
        g.fillStyle = pal.dark;  g.beginPath(); g.arc(0, 2, 10, 0, 7); g.fill();
        g.fillStyle = pal.body;  g.beginPath(); g.arc(0, 2, 8, 0, 7); g.fill();
        g.fillStyle = pal.light; g.beginPath(); g.arc(-2, 0, 3, 0, 7); g.fill();
        drawMuzzle(g, muzzle, [[-5.5, -25], [5.5, -25]]);
    } else if (type === 'stealth') {
        g.fillStyle = pal.dark;  g.fillRect(-10, -16, 20, 32);
        g.fillStyle = pal.body;  g.fillRect(-8, -14, 16, 28);
        g.fillStyle = pal.light; g.fillRect(-8, -14, 16, 3);
        g.fillStyle = pal.dark;  g.fillRect(-2, -26, 4, 12);
        g.fillStyle = pal.body;  g.beginPath(); g.arc(0, 0, 7, 0, 7); g.fill();
        const eb = Math.floor(t * 3) % 2 === 0;
        g.fillStyle = eb ? '#ff50ff' : '#8030a0';
        g.beginPath(); g.arc(0, 0, 3, 0, 7); g.fill();
        if (eb) { g.save(); g.globalAlpha = 0.35; g.fillStyle = '#ff50ff'; g.beginPath(); g.arc(0, 0, 7, 0, 7); g.fill(); g.restore(); }
        g.globalAlpha = 0.4 + 0.3 * Math.sin(t * 5);
        g.strokeStyle = pal.light; g.lineWidth = 1.5;
        g.strokeRect(-11, -15, 22, 30);
        g.globalAlpha = 1;
        drawMuzzle(g, muzzle, [[0, -27]]);
    } else if (type === 'matka') {
        g.fillStyle = pal.dark;  g.fillRect(-12, -15, 24, 30);
        g.fillStyle = pal.body;  g.fillRect(-10, -13, 20, 26);
        g.fillStyle = pal.light; g.fillRect(-10, -13, 20, 3);
        g.fillStyle = pal.dark;  g.fillRect(-6, -24, 4, 12); g.fillRect(2, -24, 4, 12);
        g.fillStyle = pal.body;  g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill();
        g.fillStyle = pal.dark;  g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill();
        g.fillStyle = '#fff8d0';
        g.beginPath(); g.ellipse(-4, 10, 3, 4, 0, 0, 7); g.fill();
        g.beginPath(); g.ellipse(4, 10, 3, 4, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.25)';
        g.beginPath(); g.ellipse(-4, 11, 2, 2, 0, 0, 7); g.fill();
        g.beginPath(); g.ellipse(4, 11, 2, 2, 0, 0, 7); g.fill();
        drawMuzzle(g, muzzle, [[-5, -25], [5, -25]]);
    } else if (type === 'freezer') {
        g.fillStyle = pal.dark;  g.fillRect(-12, -15, 24, 30);
        g.fillStyle = pal.body;  g.fillRect(-10, -13, 20, 26);
        g.fillStyle = pal.light; g.fillRect(-10, -13, 20, 3);
        g.fillStyle = pal.dark;  g.fillRect(-3, -26, 6, 14);
        g.fillStyle = '#e8ffff';
        g.beginPath(); g.moveTo(0, -32); g.lineTo(4, -26); g.lineTo(0, -22); g.lineTo(-4, -26); g.closePath(); g.fill();
        g.fillStyle = pal.dark;  g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill();
        g.fillStyle = pal.body;  g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill();
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 2.5 + Math.abs(Math.sin(t * 6)) * 1.5, 0, 7); g.fill();
        g.globalAlpha = 0.25 + 0.15 * Math.sin(t * 4);
        g.fillStyle = '#8ceaff';
        g.beginPath(); g.arc(0, 0, 17, 0, 7); g.fill();
        g.globalAlpha = 1;
        drawMuzzle(g, muzzle, [[0, -30]]);
    } else if (type === 'kamikaze') {
        const bl = Math.floor(t * 6) % 2 === 0;
        g.fillStyle = pal.dark;  g.fillRect(-11, -15, 22, 30);
        g.fillStyle = pal.body;  g.fillRect(-9, -13, 18, 26);
        g.fillStyle = pal.light; g.fillRect(-9, -13, 18, 3);
        g.fillStyle = '#ffd040'; g.fillRect(-9, -4, 18, 3); g.fillRect(-9, 3, 18, 3);
        g.fillStyle = pal.dark;  g.fillRect(-2, -22, 4, 10);
        g.fillStyle = '#202020'; g.beginPath(); g.arc(0, -24, 5, 0, 7); g.fill();
        g.fillStyle = bl ? '#ff4040' : '#ffd040'; g.beginPath(); g.arc(0, -24, 2.5, 0, 7); g.fill();
        g.fillStyle = pal.dark;  g.beginPath(); g.arc(0, 2, 8, 0, 7); g.fill();
        g.fillStyle = bl ? '#ff6050' : '#a02010'; g.beginPath(); g.arc(0, 2, 5, 0, 7); g.fill();
        if (bl) { g.globalAlpha = 0.3; g.fillStyle = '#ff4040'; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.fill(); g.globalAlpha = 1; }
    } else if (type === 'breaker') {
        g.fillStyle = pal.dark;  g.fillRect(-17, -19, 34, 38);
        g.fillStyle = pal.body;  g.fillRect(-15, -17, 30, 34);
        g.fillStyle = pal.light; g.fillRect(-15, -17, 30, 3);
        g.fillStyle = pal.dark;  g.fillRect(-21, -14, 6, 28); g.fillRect(15, -14, 6, 28);
        g.fillStyle = pal.light;
        for (let i = 0; i < 4; i++) { g.fillRect(-21, -12 + i * 7, 6, 2); g.fillRect(15, -12 + i * 7, 6, 2); }
        g.fillStyle = pal.dark;
        g.fillRect(-11, -12, 4, 8); g.fillRect(7, -12, 4, 8);
        g.fillStyle = pal.light; g.fillRect(-11, -12, 4, 2); g.fillRect(7, -12, 4, 2);
        g.fillStyle = pal.dark;  g.fillRect(-6, -28, 12, 20);
        g.fillStyle = pal.body;  g.fillRect(-4, -28, 8, 18);
        g.fillStyle = '#ff9040'; g.fillRect(-5, -29, 10, 3);
        g.fillStyle = pal.dark;  g.beginPath(); g.arc(0, 4, 11, 0, 7); g.fill();
        g.fillStyle = pal.body;  g.beginPath(); g.arc(0, 4, 9, 0, 7); g.fill();
        const bl2 = Math.floor(t * 3) % 2 === 0;
        g.fillStyle = bl2 ? '#ff9040' : '#803810';
        g.beginPath(); g.arc(0, 4, 4, 0, 7); g.fill();
        drawArmorPips(g, hp, pal.light);
        drawMuzzle(g, muzzle, [[0, -29]]);
    }
}

function drawBossTank(g, hp, maxHp, trackPhase, t, muzzle) {
    const pu = 0.5 + 0.5 * Math.sin(t * 5);
    g.save(); g.globalAlpha = 0.18 + 0.14 * pu; g.fillStyle = '#ff2040';
    g.beginPath(); g.arc(0, 0, 27, 0, 7); g.fill(); g.restore();
    g.fillStyle = '#1c060c'; g.fillRect(-24, -21, 11, 42); g.fillRect(13, -21, 11, 42);
    g.fillStyle = '#5a1622';
    const ph = ((trackPhase % 8) + 8) % 8;
    for (let i = 0; i < 6; i++) {
        const yy = -21 + ((i * 8 + ph) % 48);
        if (yy < -21 || yy > 19) continue;
        g.fillRect(-24, yy, 11, 3); g.fillRect(13, yy, 11, 3);
    }
    g.fillStyle = '#3a0a14'; g.fillRect(-16, -18, 32, 36);
    g.fillStyle = '#701428'; g.fillRect(-14, -16, 28, 32);
    g.fillStyle = '#c02040'; g.fillRect(-12, -14, 24, 24);
    g.fillStyle = '#ff8090'; g.fillRect(-12, -14, 24, 3);
    g.fillStyle = '#ff4060';
    g.beginPath(); g.moveTo(-14, -16); g.lineTo(-20, -24); g.lineTo(-8, -18); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(14, -16);  g.lineTo(20, -24);  g.lineTo(8, -18);  g.closePath(); g.fill();
    g.fillStyle = '#20060c'; g.fillRect(-11, -26, 5, 16); g.fillRect(-2.5, -29, 5, 19); g.fillRect(6, -26, 5, 16);
    g.fillStyle = '#c02040'; g.fillRect(-10, -26, 3, 15); g.fillRect(-1.5, -29, 3, 18); g.fillRect(7, -26, 3, 15);
    g.fillStyle = '#20060c'; g.beginPath(); g.arc(0, 3, 12, 0, 7); g.fill();
    g.fillStyle = '#701428'; g.beginPath(); g.arc(0, 3, 10, 0, 7); g.fill();
    g.fillStyle = '#ffe0e0';
    g.fillRect(-5, -1, 4, 4); g.fillRect(1, -1, 4, 4);
    g.fillRect(-3, 5, 6, 2);
    const bl = Math.floor(t * 6) % 2 === 0;
    g.fillStyle = bl ? '#ff2020' : '#801010';
    g.fillRect(-4, 0, 2, 2); g.fillRect(2, 0, 2, 2);
    g.save(); g.strokeStyle = 'rgba(255,64,96,0.8)'; g.lineWidth = 2;
    g.beginPath(); g.arc(0, 3, 16, t * 2, t * 2 + 1.2); g.stroke();
    g.beginPath(); g.arc(0, 3, 16, t * 2 + Math.PI, t * 2 + Math.PI + 1.2); g.stroke();
    g.restore();
    drawMuzzle(g, muzzle, [[-8.5, -27], [0, -30], [8.5, -27]]);
}

function drawTankSprite(c, cx, cy, dir, bodyFn) {
    c.save();
    c.translate(cx, cy);
    c.fillStyle = 'rgba(0,0,0,0.40)';
    c.fillRect(-20, -16, 44, 44);
    c.rotate(dir * Math.PI / 2);
    bodyFn(c);
    c.restore();
}

function drawMiniTank(c, x, y, pal) {
    c.save(); c.translate(x, y); c.scale(0.33, 0.33);
    c.fillStyle = pal.tread; c.fillRect(-24, -20, 10, 40); c.fillRect(14, -20, 10, 40);
    c.fillStyle = pal.body;  c.fillRect(-14, -16, 28, 32);
    c.fillStyle = pal.dark;  c.fillRect(-3, -24, 6, 16);
    c.fillStyle = pal.body;  c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill();
    c.restore();
}

function drawShieldIcon(c, x, y, s, color, num) {
    c.save();
    c.translate(x, y);
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, -s); c.lineTo(s * 0.85, -s * 0.55); c.lineTo(s * 0.85, s * 0.2);
    c.quadraticCurveTo(s * 0.85, s * 0.85, 0, s * 1.1);
    c.quadraticCurveTo(-s * 0.85, s * 0.85, -s * 0.85, s * 0.2);
    c.lineTo(-s * 0.85, -s * 0.55);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath();
    c.moveTo(0, -s); c.lineTo(s * 0.85, -s * 0.55); c.lineTo(0, -s * 0.3);
    c.closePath(); c.fill();
    if (num !== undefined && num !== null) {
        c.fillStyle = '#04222c';
        c.font = Math.round(s * 1.05) + 'px "Press Start 2P",monospace';
        c.textAlign = 'center';
        c.fillText(String(num), 0, s * 0.55);
    }
    c.restore();
}