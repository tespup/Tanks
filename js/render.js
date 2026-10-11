"use strict";

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

let scanlines = null, vignetteOv = null, mouseX = -1, mouseY = -1, fatalMsg = '';

function buildOverlays() {
    scanlines = document.createElement('canvas');
    scanlines.width = CANVAS_W; scanlines.height = CANVAS_H;
    const s = scanlines.getContext('2d');
    s.fillStyle = 'rgba(0,0,0,0.13)';
    for (let y = 0; y < CANVAS_H; y += 3) s.fillRect(0, y, CANVAS_W, 1);
    
    vignetteOv = document.createElement('canvas');
    vignetteOv.width = CANVAS_W; vignetteOv.height = CANVAS_H;
    const v = vignetteOv.getContext('2d');
    const gr = v.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.35, CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.85);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.42)');
    v.fillStyle = gr; v.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawFieldGrid(g, time) {
    const p = PAL;
    ctx.fillStyle = p ? p.bg : '#0c0c10';
    ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
    if (p) {
        ctx.fillStyle = p.bg2;
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++)
            if (((x + y) & 1) === 0) ctx.fillRect(FIELD_X + x * TILE, FIELD_Y + y * TILE, TILE, TILE);
    }
    const hpArr = game.brickHp;
    const anim = Math.floor(time * 2) % 2;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const t = g[y][x];
        if (t === T.EMPTY) continue;
        const dx = FIELD_X + x * TILE, dy = FIELD_Y + y * TILE;
        if (t === T.BRICK) {
            const cracked = hpArr && hpArr[y] && hpArr[y][x] === 1;
            ctx.drawImage(cracked ? tileSprites.brickCracked : tileSprites.brick, dx, dy);
        }
        else if (t === T.CONCRETE) {
            const ch = hpArr && hpArr[y] ? hpArr[y][x] : 0;
            ctx.drawImage(ch <= 3 ? tileSprites.concreteCracked : tileSprites.concrete, dx, dy);
        }
        else if (t === T.STEEL) ctx.drawImage(tileSprites.steel, dx, dy);
        else if (t === T.WATER) ctx.drawImage(anim ? tileSprites.water1 : tileSprites.water0, dx, dy);
        else if (t === T.SAND)  ctx.drawImage(anim ? tileSprites.sand1 : tileSprites.sand0, dx, dy);
        else if (t === T.BASE)  ctx.drawImage(tileSprites.base, dx, dy);
        else if (t === T.BASE_DEAD) ctx.drawImage(tileSprites.baseDead, dx, dy);
    }
}

function drawBaseShield(time) {
    if (game.baseArmor <= 0 || !game.baseAlive) return;
    const bx = FIELD_X + 6 * TILE + TILE / 2, by = FIELD_Y + 12 * TILE + TILE / 2;
    const pu = 0.55 + 0.45 * Math.sin(time * 4);
    ctx.save();
    ctx.globalAlpha = 0.26 + 0.2 * pu;
    const gr = ctx.createRadialGradient(bx, by, 4, bx, by, 32);
    gr.addColorStop(0, 'rgba(160,240,255,0.9)');
    gr.addColorStop(1, 'rgba(60,180,255,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(bx, by, 32, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#8ceaff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bx, by, 26 + 2 * pu, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1;
    drawShieldIcon(ctx, bx, by - 2, 11, 'rgba(96,224,255,0.95)', game.baseArmor);
    ctx.restore();
}

function drawBaseHpBar() {
    if (!game.baseAlive) return;
    const x = FIELD_X + 6 * TILE + 2, y = FIELD_Y + 12 * TILE - 8;
    const k = clamp(game.baseHp / BASE_MAX_HP, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x, y, 44, 5);
    ctx.fillStyle = k > 0.5 ? '#60e050' : (k > 0.25 ? '#ffd040' : '#ff4040');
    ctx.fillRect(x + 1, y + 1, 42 * k, 3);
}

function drawForest(g) {
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++)
        if (g[y][x] === T.TREE) ctx.drawImage(tileSprites.tree, FIELD_X + x * TILE, FIELD_Y + y * TILE);
}

function drawSpawnStar(cx, cy, progress, time, color) {
    const a = 0.4 + 0.6 * Math.abs(Math.sin(time * 16));
    const r = 8 + clamp(progress, 0, 1) * 18;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = a;
    ctx.fillStyle = color || '#a0e0ff';
    ctx.rotate(time * 3);
    for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -r); ctx.lineTo(4, -4); ctx.lineTo(r * 0.4, 0); ctx.lineTo(4, 4);
        ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
}

function drawShieldRing(cx, cy, time) {
    ctx.save();
    ctx.strokeStyle = Math.floor(time * 10) % 2 ? '#60c0ff' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(time * 10);
    for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, 28 + i * 3, time * (i ? 4 : -4), time * (i ? 4 : -4) + Math.PI * 1.5);
        ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
}

function drawBullet(b, time) {
    const x = FIELD_X + b.x, y = FIELD_Y + b.y, cx = x + 4, cy = y + 4;
    if (b.explosive) {
        const gr = ctx.createRadialGradient(cx, cy, 1, cx, cy, 20);
        gr.addColorStop(0, 'rgba(255,200,120,0.9)');
        gr.addColorStop(0.5, 'rgba(255,90,30,0.4)');
        gr.addColorStop(1, 'rgba(255,90,30,0)');
        ctx.fillStyle = gr; ctx.fillRect(cx - 20, cy - 20, 40, 40);
        ctx.fillStyle = '#401810'; ctx.fillRect(x, y, 8, 8);
        ctx.fillStyle = '#ff8040'; ctx.fillRect(x + 1, y + 1, 6, 6);
        ctx.fillStyle = '#ffe0a0'; ctx.fillRect(x + 3, y + 3, 2, 2);
        return;
    }
    if (b.freeze) {
        const gr = ctx.createRadialGradient(cx, cy, 1, cx, cy, 18);
        gr.addColorStop(0, 'rgba(220,250,255,0.95)');
        gr.addColorStop(0.5, 'rgba(90,200,255,0.4)');
        gr.addColorStop(1, 'rgba(90,200,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(cx - 18, cy - 18, 36, 36);
        ctx.fillStyle = '#bfeaff';
        ctx.fillRect(x + 3, y, 2, 8); ctx.fillRect(x, y + 3, 8, 2);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 3, y + 3, 2, 2);
        return;
    }
    if (b.side === 1) {
        const gr = ctx.createRadialGradient(cx, cy, 1, cx, cy, 16);
        gr.addColorStop(0, 'rgba(255,150,150,0.85)');
        gr.addColorStop(0.45, 'rgba(255,150,150,0.2)');
        gr.addColorStop(1, 'rgba(255,150,150,0)');
        ctx.fillStyle = gr; ctx.fillRect(cx - 16, cy - 16, 32, 32);
        ctx.fillStyle = '#e05050'; ctx.fillRect(x + 1, y + 1, 6, 6);
        ctx.fillStyle = '#ffe0e0'; ctx.fillRect(x + 2, y + 2, 4, 4);
        ctx.fillStyle = '#fff'; ctx.fillRect(x + 3, y + 3, 2, 2);
        return;
    }
    const tier = clamp(b.tier || 0, 0, 5);
    const S = [6, 7, 8, 9, 10, 12][tier];
    const R = [16, 18, 20, 24, 28, 32][tier];
    const colGlow = ['rgba(255,240,180,', 'rgba(255,225,140,', 'rgba(255,205,100,', 'rgba(255,235,150,', 'rgba(255,245,200,', 'rgba(255,150,80,'][tier];
    const pulse = 1 + 0.12 * Math.sin(time * 12 + b.x * 0.13);
    const blink = Math.floor(time * (9 + tier * 3) + (b.x + b.y) * 0.1) % 2 === 0;
    const gr = ctx.createRadialGradient(cx, cy, 1, cx, cy, R);
    gr.addColorStop(0, colGlow + '0.9)');
    gr.addColorStop(0.4, colGlow + (tier >= 3 ? '0.5)' : '0.3)'));
    gr.addColorStop(1, colGlow + '0)');
    ctx.fillStyle = gr; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    if (tier >= 3 && blink) {
        ctx.save(); ctx.globalAlpha = 0.5;
        ctx.strokeStyle = tier >= 4 ? '#aef4ff' : '#fff8c0';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, S * 1.15 + 2 * Math.sin(time * 10), 0, 7); ctx.stroke();
        ctx.restore();
    }
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
    const s = S * pulse;
    ctx.fillStyle = (blink && tier >= 2) ? '#ffffff' : ['#f0a020', '#f0b030', '#f0b838', '#f0c040', '#ffd060', '#ff8838'][tier];
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.fillStyle = '#fff8c0'; ctx.fillRect(-s / 4, -s / 4, s / 2, s / 2);
    if (tier >= 4) { ctx.fillStyle = blink ? '#ffffff' : '#aef4ff'; ctx.fillRect(-s / 8, -s / 8, s / 4, s / 4); }
    ctx.restore();
    if (tier >= 5) {
        ctx.fillStyle = 'rgba(255,220,120,0.8)';
        for (let i = 0; i < 3; i++) {
            const a = time * 14 + i * 2.1;
            ctx.fillRect(cx + Math.cos(a) * 10 - 1, cy + Math.sin(a) * 10 - 1, 2, 2);
        }
    }
}

function drawPowerUpIcon(pu, time) {
    if (pu.ttl < 3 && Math.floor(time * 8) % 2) return;
    const x = FIELD_X + pu.x, y = FIELD_Y + pu.y;
    const pulse = 0.85 + 0.15 * Math.sin(time * 6);
    ctx.save();
    ctx.translate(x + TILE / 2, y + TILE / 2);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(-17, -17, 34, 34);
    ctx.strokeStyle = POWERUPS[pu.type].color; ctx.lineWidth = 2; ctx.strokeRect(-17, -17, 34, 34);
    ctx.fillStyle = POWERUPS[pu.type].color;
    switch (pu.type) {
        case 'star': {
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const r = (i % 2) ? 5 : 12, a = -Math.PI / 2 + i * Math.PI / 5;
                const sx = Math.cos(a) * r, sy = Math.sin(a) * r;
                if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
            }
            ctx.closePath(); ctx.fill();
            break;
        }
        case 'gun': {
            ctx.fillStyle = '#b0b8c0';
            ctx.fillRect(-8, -4, 18, 8); ctx.fillRect(-8, 4, 8, 9);
            ctx.fillStyle = '#8a929e'; ctx.fillRect(-8, -4, 18, 2);
            ctx.fillStyle = '#7fe0ff'; ctx.fillRect(8, -2, 3, 4);
            break;
        }
        case 'grenade':
            ctx.fillRect(-5, -8, 10, 14); ctx.fillRect(-3, -11, 6, 4);
            ctx.fillStyle = '#fff'; ctx.fillRect(-2, -4, 2, 6);
            break;
        case 'helmet':
            ctx.beginPath(); ctx.arc(0, 2, 11, Math.PI, 0); ctx.fill();
            ctx.fillRect(-11, 2, 22, 4);
            break;
        case 'shovel':
            ctx.fillRect(-2, -12, 4, 12);
            ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.lineTo(5, 12); ctx.lineTo(-5, 12);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P",monospace'; ctx.textAlign = 'center'; ctx.fillText('∞', 0, -13);
            break;
        case 'baseshield':
            drawShieldIcon(ctx, 0, 0, 13, POWERUPS[pu.type].color, 5);
            break;
        case 'tank':
            drawMiniTank(ctx, 0, 0, {body: '#50e050', dark: '#2a802a', tread: '#1a4a1a'});
            break;
        case 'clock':
            ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fill();
            ctx.fillStyle = '#000'; ctx.fillRect(-1, -8, 2, 9); ctx.fillRect(-1, -1, 7, 2);
            break;
    }
    ctx.restore();
}

function drawMines(time) {
    for (let i = 0; i < game.mines.length; i++) {
        const m = game.mines[i];
        const mx = FIELD_X + m.x, my = FIELD_Y + m.y;
        const blink = Math.floor(m.t * 4) % 2 === 0;
        ctx.fillStyle = '#14161a'; ctx.beginPath(); ctx.arc(mx, my, 11, 0, 7); ctx.fill();
        ctx.fillStyle = '#2c3138'; ctx.beginPath(); ctx.arc(mx, my, 8, 0, 7); ctx.fill();
        ctx.fillStyle = '#14161a';
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.fillRect(mx + Math.cos(a) * 10 - 1.5, my + Math.sin(a) * 10 - 1.5, 3, 3); }
        ctx.fillStyle = blink ? '#ff4040' : '#601010';
        ctx.beginPath(); ctx.arc(mx, my, 3.5, 0, 7); ctx.fill();
        if (blink) { ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#ff4040'; ctx.beginPath(); ctx.arc(mx, my, 9, 0, 7); ctx.fill(); ctx.restore(); }
    }
}

function drawGhostBuild(p, time) {
    if (!p || p.buildT <= 0 || !p.buildTile) return;
    const k = clamp(1 - p.buildT / p.buildTotal, 0, 1);
    const gx = FIELD_X + p.buildTile.tx * TILE, gy = FIELD_Y + p.buildTile.ty * TILE;
    ctx.save();
    ctx.globalAlpha = 0.22 + 0.55 * k;
    ctx.drawImage(tileSprites.concrete, gx, gy);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = Math.floor(time * 8) % 2 ? '#c0c8ce' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(gx + 1, gy + 1, TILE - 2, TILE - 2);
    ctx.restore();
}

function drawBossBar(time) {
    let boss = null;
    for (const e of game.enemies) if (e.type === 'boss' && !e.dead && e.spawnTimer <= 0) { boss = e; break; }
    if (!boss) return;
    const w = 300, x = FIELD_X + (FIELD_W - w) / 2, y = FIELD_Y + 4;
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(x, y, w, 22);
    ctx.strokeStyle = Math.floor(time * 4) % 2 ? '#ff3050' : '#ffd040';
    ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, 20);
    const k = clamp(boss.hp / boss.maxHp, 0, 1);
    const gr = ctx.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, '#ff2040'); gr.addColorStop(1, '#ffe080');
    ctx.fillStyle = gr; ctx.fillRect(x + 4, y + 11, (w - 8) * k, 7);
    ctx.font = '7px "Press Start 2P",monospace';
    ctx.textAlign = 'left'; ctx.fillStyle = '#ff8090';
    ctx.fillText('БОСС · БРОНЯ 20', x + 6, y + 9);
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
    ctx.fillText(boss.hp + '/' + boss.maxHp, x + w - 6, y + 9);
}

function drawPanel(time) {
    const p = PAL;
    const x = PANEL_X, y = FIELD_Y;
    ctx.fillStyle = p ? p.panel : '#565a6e'; ctx.fillRect(x, y, PANEL_W, FIELD_H);
    ctx.fillStyle = p ? p.panelDark : '#3c3f50'; ctx.fillRect(x + 4, y + 4, PANEL_W - 8, FIELD_H - 8);
    ctx.textAlign = 'center';
    const cxp = x + PANEL_W / 2;
    ctx.fillStyle = '#fff';
    ctx.font = '9px "Press Start 2P",monospace';
    ctx.fillText('ВРАГИ', cxp, y + 22);
    let remaining = game.enemyQueue.length;
    for (let i = 0; i < game.enemies.length; i++) if (!game.enemies[i].dead) remaining++;
    const maxIcons = Math.min(remaining, 20);
    const bossAlive = game.enemies.some(e => e.type === 'boss' && !e.dead);
    for (let i = 0; i < maxIcons; i++) {
        const col = i % 2, row = Math.floor(i / 2);
        const tp = (bossAlive && i === maxIcons - 1) ? ENEMY_TYPES.boss : ENEMY_TYPES.basic;
        drawMiniTank(ctx, cxp - 22 + col * 32 + 6, y + 30 + row * 19 + 7, tp);
    }
    let cy = y + 30 + Math.ceil(maxIcons / 2) * 19 + 14;
    for (let pi = 0; pi < game.mode; pi++) {
        ctx.fillStyle = PLAYER_TAG[pi];
        ctx.font = '8px "Press Start 2P",monospace';
        ctx.fillText(game.mode > 1 ? ('ИГРОК ' + (pi + 1)) : 'ЖИЗНИ', cxp, cy);
        cy += 11;
        const lv = Math.max(0, game.lives[pi] | 0);
        const pal = (pi === 0 ? P1_PALETTES : P2_PALETTES)[0];
        const show = Math.min(lv, 6);
        for (let i = 0; i < show; i++) {
            const col = i % 3, row = Math.floor(i / 3);
            drawMiniTank(ctx, cxp - 34 + col * 26 + 6, cy + row * 18 + 6, pal);
        }
        if (show === 0) {
            ctx.fillStyle = '#ff6060';
            ctx.font = '8px "Press Start 2P",monospace';
            ctx.fillText('ВЫБЫЛ', cxp, cy + 9);
        }
        cy += (lv > 3 ? 2 : 1) * 18 + 5;
        if (lv > 6) {
            ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P",monospace';
            ctx.fillText('+' + (lv - 6), cxp, cy - 2); cy += 8;
        }
    }
    for (let pi = 0; pi < game.mode; pi++) {
        const pw = clamp(game.playerPower[pi] || 0, 0, MAX_POWER);
        ctx.fillStyle = (pw >= MAX_POWER) ? '#ff7040' : PLAYER_TAG[pi];
        ctx.font = '7px "Press Start 2P",monospace';
        ctx.fillText(pw >= MAX_POWER ? ('P' + (pi + 1) + ' МАКСИМУМ') : ('СИЛА ' + (pi + 1) + ': ' + pw + '/' + MAX_POWER), cxp, cy);
        cy += 7;
        for (let i = 0; i < MAX_POWER; i++) {
            const sx = cxp - 40 + i * 16;
            let col = 'rgba(0,0,0,0.45)';
            if (i < pw) col = (i < 3) ? '#ffd700' : ((i < 4) ? '#7fa8ff' : '#ff7040');
            ctx.fillStyle = col;
            ctx.fillRect(sx, cy, 12, 7);
            if (i < pw) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(sx, cy, 12, 2); }
        }
        cy += 13;
    }
    if (game.mines.length > 0) {
        ctx.fillStyle = '#ffb060';
        ctx.font = '7px "Press Start 2P",monospace';
        ctx.fillText('МИНЫ НА ПОЛЕ: ' + game.mines.length + '/' + MAX_MINES, cxp, cy);
        cy += 12;
    }
    cy += 2;
    const flagY = clamp(cy + 4, y + 380, y + 452);
    ctx.fillStyle = p ? p.accent : '#f0d030'; ctx.fillRect(cxp - 10, flagY, 20, 24);
    ctx.fillStyle = p ? p.panelDark : '#3c3f50'; ctx.fillRect(cxp - 3, flagY + 24, 6, 10);
    ctx.fillStyle = '#000';
    ctx.font = '10px "Press Start 2P",monospace';
    ctx.fillText(String(game.level), cxp, flagY + 17);
    ctx.fillStyle = '#c8d0f0';
    ctx.font = '7px "Press Start 2P",monospace';
    ctx.fillText('ИЗ ' + MAX_LEVEL, cxp, flagY + 46);
    ctx.fillStyle = '#fff';
    ctx.font = '9px "Press Start 2P",monospace';
    ctx.fillText('СЧЁТ', cxp, y + 540);
    ctx.fillStyle = '#f0d030';
    ctx.font = '11px "Press Start 2P",monospace';
    ctx.fillText(String(game.score), cxp, y + 558);
    ctx.fillStyle = '#9aa0c0';
    ctx.font = '7px "Press Start 2P",monospace';
    ctx.fillText('РЕКОРД ' + game.hiScore, cxp, y + 576);
    let status = '', statusCol = '#8a90b8';
    if (game.baseHp < BASE_MAX_HP) { status = 'БАЗА: ' + game.baseHp + '/' + BASE_MAX_HP; statusCol = '#ffb060'; }
    else if (game.baseArmor > 0) { status = 'ЩИТ БАЗЫ: ' + game.baseArmor; statusCol = '#60e0ff'; }
    else if (game.baseFortified) { status = 'БАЗА: СТАЛЬ'; statusCol = '#e6e9f4'; }
    else if (game.freezeTimer > 0) { status = 'ЗАМОРОЗКА ВРАГОВ'; statusCol = '#a0f0ff'; }
    else if (Sound.muted) { status = 'ЗВУК ВЫКЛ'; }
    else if (!Music.enabled) { status = 'МУЗЫКА ВЫКЛ'; }
    if (status) {
        ctx.fillStyle = statusCol;
        ctx.font = '7px "Press Start 2P",monospace';
        ctx.fillText(status, cxp, y + 602);
    }
    ctx.fillStyle = '#6f7aa8';
    ctx.font = '7px "Press Start 2P",monospace';
    ctx.fillText('♪ ' + MELODIES[(Math.max(1, game.level) - 1) % MELODIES.length].name, cxp, y + 616);
}

function drawTitleArt(time) {
    ctx.textAlign = 'center';
    drawTankSprite(ctx, CANVAS_W / 2 - 192, 104, 1, g => drawExcavator(g, time * 40, time, false, 0, P1_PALETTES[0], 1));
    drawTankSprite(ctx, CANVAS_W / 2, 96, 0, g => drawPlayerTank(g, MAX_POWER, time * 60, time, 0, PLAYER_HP[MAX_POWER], P1_PALETTES));
    drawTankSprite(ctx, CANVAS_W / 2 + 192, 104, 3, g => drawBossTank(g, 20, 20, time * 40, time, 0));
    drawTankSprite(ctx, CANVAS_W / 2 - 96, 140, 1, g => drawEnemyTank(g, 'stealth', ENEMY_TYPES.stealth, 1, 1, time * 50, time, 0));
    drawTankSprite(ctx, CANVAS_W / 2 + 96, 140, 3, g => drawEnemyTank(g, 'freezer', ENEMY_TYPES.freezer, 1, 1, time * 50, time, 0));
    const glow = 0.6 + 0.4 * Math.sin(time * 2);
    ctx.font = '32px "Press Start 2P",monospace';
    ctx.fillStyle = '#0a3a0a'; ctx.fillText('ТАНКИ', CANVAS_W / 2 + 4, 190);
    ctx.fillStyle = 'rgba(80,255,80,' + glow.toFixed(2) + ')';
    ctx.fillText('ТАНКИ', CANVAS_W / 2, 186);
    ctx.fillStyle = '#8a90b8';
    ctx.font = '9px "Press Start 2P",monospace';
    ctx.fillText('8-БИТ · ' + MAX_LEVEL + ' УРОВНЕЙ · 1-2 ИГРОКА', CANVAS_W / 2, 212);
    ctx.fillStyle = '#8be06a';
    ctx.font = '8px "Press Start 2P",monospace';
    ctx.fillText('10 МЕЛОДИЙ · 11 ПАЛИТР · 6 СТИЛЕЙ БЛОКОВ', CANVAS_W / 2, 232);
    ctx.fillStyle = '#ff8090';
    ctx.fillText('КАЖДЫЙ 5-Й УРОВЕНЬ — БОСС', CANVAS_W / 2, 250);
    ctx.fillStyle = '#ffb060';
    ctx.fillText('БАЗА: 20 ПОПАДАНИЙ · МИНЫ ×5 · БОНУС-ПУШКА', CANVAS_W / 2, 264);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('РЕКОРД: ' + game.hiScore, CANVAS_W / 2, 282);
}

function drawUIMenu(time) {
    ctx.fillStyle = (UI.screen === 'main') ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    if (UI.screen === 'main') drawTitleArt(time);
    const L = menuLayout();
    ctx.fillStyle = '#141a30'; ctx.fillRect(L.x, L.y, L.w, L.h);
    ctx.strokeStyle = '#4a5480'; ctx.lineWidth = 3; ctx.strokeRect(L.x + 1.5, L.y + 1.5, L.w - 3, L.h - 3);
    ctx.strokeStyle = '#8fa0e0'; ctx.lineWidth = 1; ctx.strokeRect(L.x + 8.5, L.y + 8.5, L.w - 17, L.h - 17);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0d030';
    ctx.font = '15px "Press Start 2P",monospace';
    ctx.fillText(menuTitle(), CANVAS_W / 2, L.y + 38);
    if (UI.screen === 'main') {
        ctx.fillStyle = '#6f7aa8';
        ctx.font = '8px "Press Start 2P",monospace';
        ctx.fillText('ВЫБЕРИТЕ РЕЖИМ', CANVAS_W / 2, L.y + 56);
    }
    for (let i = 0; i < L.rects.length; i++) {
        const r = L.rects[i], it = L.items[i];
        const sel = (i === UI.index);
        if (sel) {
            ctx.fillStyle = 'rgba(240,208,48,' + (0.16 + 0.1 * Math.sin(time * 6)).toFixed(2) + ')';
            ctx.fillRect(r.x, r.y, r.w, r.h);
            ctx.strokeStyle = '#f0d030'; ctx.lineWidth = 2; ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
            ctx.fillStyle = '#f0d030';
            ctx.beginPath();
            ctx.moveTo(r.x + 9, r.y + r.h / 2 - 5); ctx.lineTo(r.x + 16, r.y + r.h / 2); ctx.lineTo(r.x + 9, r.y + r.h / 2 + 5);
            ctx.closePath(); ctx.fill();
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(r.x, r.y, r.w, r.h);
            ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1;
            ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        }
        ctx.font = (UI.screen === 'binds' ? '9px' : '10px') + ' "Press Start 2P",monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = sel ? '#ffffff' : '#9aa4cc';
        ctx.fillText(it.label, r.x + 26, r.y + r.h / 2 + 4);
        if (it.value) {
            ctx.textAlign = 'right';
            ctx.fillStyle = sel ? '#ffe070' : '#6ec6ff';
            ctx.fillText(it.value, r.x + r.w - 14, r.y + r.h / 2 + 4);
        }
    }
    ctx.textAlign = 'center';
    if (UI.screen === 'controls') {
        const lines = [
            'МЕНЮ / ПАУЗА:  ESC ИЛИ P        ЗВУК:  M',
            'НАЗНАЧАТЬ МОЖНО КЛАВИШИ И КНОПКИ/ОСИ ГЕЙМПАДА',
            'ГЕЙМПАДОВ НАЙДЕНО: ' + connectedPads()
        ];
        ctx.font = '8px "Press Start 2P",monospace';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillStyle = (i === 2 && connectedPads() > 0) ? '#8be06a' : '#6f7aa8';
            ctx.fillText(lines[i], CANVAS_W / 2, L.infoY + i * 20);
        }
    }
    if (UI.screen === 'main') {
        ctx.fillStyle = '#6f7aa8';
        ctx.font = '8px "Press Start 2P",monospace';
        ctx.fillText('ЗВЁЗДЫ: 1 ТЕМП ×3 · 2 ТРИ ДУЛА · 3 БРОНЯ', CANVAS_W / 2, L.infoY);
        ctx.fillText('4 ВЕЗДЕХОД+СТАЛЬ · 5 ПУЛЕМЁТ+МИНЫ (МАКС. 5 ЗВЁЗД)', CANVAS_W / 2, L.infoY + 18);
        ctx.fillText('ЩИТ БАЗЫ · ЛОПАТА = СТАЛЬ · БАЗА: 20 УДАРОВ', CANVAS_W / 2, L.infoY + 36);
    }
    const hint = UI.rebinding
        ? 'НАЖМИТЕ КЛАВИШУ ИЛИ КНОПКУ/ОСЬ ГЕЙМПАДА · ESC — ОТМЕНА'
        : 'СТРЕЛКИ — ВЫБОР    ENTER — ОК    ESC — НАЗАД    МЫШЬ РАБОТАЕТ';
    ctx.fillStyle = UI.rebinding ? (Math.floor(time * 3) % 2 ? '#ff8090' : '#ffffff') : '#6f7aa8';
    ctx.font = '8px "Press Start 2P",monospace';
    ctx.fillText(hint, CANVAS_W / 2, L.y + L.h - 18);
    if (UI.msgT > 0 && UI.msg) {
        ctx.fillStyle = '#ffd040';
        ctx.font = '9px "Press Start 2P",monospace';
        ctx.fillText(UI.msg, CANVAS_W / 2, L.y + L.h - 36);
    }
}

function drawLevelClear(time) {
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0d030';
    ctx.font = '20px "Press Start 2P",monospace';
    ctx.fillText('УРОВЕНЬ ' + game.level + ' ПРОЙДЕН!', CANVAS_W / 2, 98);
    const rows = ['basic', 'fast', 'power', 'armor', 'stealth', 'matka', 'freezer', 'kamikaze', 'breaker'];
    if (isBossLevel(game.level)) rows.push('boss');
    let tot = 0;
    for (let i = 0; i < rows.length; i++) tot += game.killStats[rows[i]] || 0;
    ctx.fillStyle = '#fff';
    ctx.font = '10px "Press Start 2P",monospace';
    ctx.fillText('БОНУС +500 · УНИЧТОЖЕНО ВРАГОВ: ' + tot + (game.bossesKilled > 0 ? ' · БОСС ПОВЕРЖЕН' : ''), CANVAS_W / 2, 128);
    ctx.fillStyle = '#8be06a';
    ctx.font = '9px "Press Start 2P",monospace';
    ctx.fillText('ТЕМА: ' + game.themeName + '   СТИЛЬ: ' + game.styleName, CANVAS_W / 2, 150);
    let yy = 172;
    const cx = CANVAS_W / 2;
    for (let i = 0; i < rows.length; i++) {
        const type = rows[i];
        const st = ENEMY_TYPES[type];
        if (type === 'boss') drawTankSprite(ctx, cx - 130, yy + 8, 1, g => drawBossTank(g, 0, 20, 0, time, 0));
        else drawMiniTank(ctx, cx - 130 + 6, yy + 8, st);
        ctx.textAlign = 'left';
        ctx.fillStyle = st.body;
        ctx.font = '9px "Press Start 2P",monospace';
        ctx.fillText('× ' + (game.killStats[type] || 0), cx - 98, yy + 12);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#9aa0c0';
        ctx.font = '7px "Press Start 2P",monospace';
        ctx.fillText(st.name + '  ' + st.score, cx + 166, yy + 12);
        yy += 30;
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8be06a';
    ctx.font = '9px "Press Start 2P",monospace';
    ctx.fillText('СЛЕДУЮЩАЯ МЕЛОДИЯ: ' + MELODIES[game.level % MELODIES.length].name, CANVAS_W / 2, yy + 8);
    ctx.fillStyle = '#8a90b8';
    ctx.font = '10px "Press Start 2P",monospace';
    if (game.level >= MAX_LEVEL) {
        if (Math.floor(time * 2) % 2 === 0) ctx.fillText('ФИНАЛ...', CANVAS_W / 2, yy + 34);
    } else if (Math.floor(time * 2) % 2 === 0) {
        ctx.fillText('УРОВЕНЬ ' + (game.level + 1) + ' ДАЛЕЕ' + (isBossLevel(game.level + 1) ? ' · БОСС!' : ''), CANVAS_W / 2, yy + 34);
    }
}

function drawGameOver(time) {
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4040';
    ctx.font = '28px "Press Start 2P",monospace';
    ctx.fillText('ИГРА ОКОНЧЕНА', CANVAS_W / 2, 220);
    ctx.fillStyle = '#fff';
    ctx.font = '13px "Press Start 2P",monospace';
    ctx.fillText('УРОВЕНЬ: ' + game.level + ' / ' + MAX_LEVEL, CANVAS_W / 2, 278);
    ctx.fillText('РЕЖИМ: ' + (game.mode > 1 ? '2 ИГРОКА' : '1 ИГРОК'), CANVAS_W / 2, 308);
    ctx.fillText('СЧЁТ: ' + game.score, CANVAS_W / 2, 338);
    ctx.fillStyle = '#f0d030';
    ctx.fillText('РЕКОРД: ' + game.hiScore, CANVAS_W / 2, 368);
    if (game.score > 0 && game.score >= game.hiScore && Math.floor(time * 3) % 2 === 0) {
        ctx.fillStyle = '#50ff50';
        ctx.font = '11px "Press Start 2P",monospace';
        ctx.fillText('НОВЫЙ РЕКОРД!', CANVAS_W / 2, 402);
    }
    if (Math.floor(time * 2) % 2 === 0) {
        ctx.fillStyle = '#8a90b8';
        ctx.font = '11px "Press Start 2P",monospace';
        ctx.fillText('ПРОБЕЛ — В ГЛАВНОЕ МЕНЮ', CANVAS_W / 2, 452);
    }
}

function drawVictory(time) {
    ctx.fillStyle = 'rgba(0,0,0,0.86)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = 'center';
    const glow = 0.6 + 0.4 * Math.sin(time * 3);
    ctx.font = '34px "Press Start 2P",monospace';
    ctx.fillStyle = 'rgba(255,215,60,' + glow.toFixed(2) + ')';
    ctx.fillText('ПОБЕДА!', CANVAS_W / 2, 190);
    ctx.fillStyle = '#fff';
    ctx.font = '12px "Press Start 2P",monospace';
    ctx.fillText('ВСЕ ' + MAX_LEVEL + ' УРОВНЕЙ ПРОЙДЕНЫ', CANVAS_W / 2, 240);
    ctx.fillText('РЕЖИМ: ' + (game.mode > 1 ? '2 ИГРОКА' : '1 ИГРОК'), CANVAS_W / 2, 268);
    ctx.fillStyle = '#f0d030';
    ctx.font = '14px "Press Start 2P",monospace';
    ctx.fillText('СЧЁТ: ' + game.score, CANVAS_W / 2, 308);
    ctx.fillStyle = '#9aa0c0';
    ctx.font = '10px "Press Start 2P",monospace';
    ctx.fillText('РЕКОРД: ' + game.hiScore, CANVAS_W / 2, 338);
    drawTankSprite(ctx, game.mode > 1 ? CANVAS_W / 2 - 70 : CANVAS_W / 2, 410, 0,
        g => drawPlayerTank(g, MAX_POWER, time * 60, time, 0, PLAYER_HP[MAX_POWER], P1_PALETTES));
    if (game.mode > 1) drawTankSprite(ctx, CANVAS_W / 2 + 70, 410, 0,
        g => drawPlayerTank(g, MAX_POWER, time * 60, time, 0, PLAYER_HP[MAX_POWER], P2_PALETTES));
    if (Math.floor(time * 2) % 2 === 0) {
        ctx.fillStyle = '#8a90b8';
        ctx.font = '11px "Press Start 2P",monospace';
        ctx.fillText('ПРОБЕЛ — В ГЛАВНОЕ МЕНЮ', CANVAS_W / 2, 500);
    }
}

function drawFatal() {
    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5050';
    ctx.font = '14px "Press Start 2P",monospace';
    ctx.fillText('ОШИБКА', CANVAS_W / 2, 110);
    ctx.fillStyle = '#ffd0d0';
    ctx.font = '8px "Press Start 2P",monospace';
    const s = String(fatalMsg || 'unknown');
    let line = '', ly = 160;
    for (let i = 0; i < s.length; i++) {
        line += s[i];
        if (line.length > 54 || i === s.length - 1) {
            ctx.fillText(line, CANVAS_W / 2, ly);
            ly += 18; line = '';
            if (ly > CANVAS_H - 40) break;
        }
    }
}

function render(time) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.save();
    ctx.fillStyle = PAL ? PAL.frame : '#3a3f5c';
    ctx.fillRect(FIELD_X - 6, FIELD_Y - 6, FIELD_W + 12, FIELD_H + 12);
    ctx.fillStyle = PAL ? PAL.frameDark : '#22263a';
    ctx.fillRect(FIELD_X - 3, FIELD_Y - 3, FIELD_W + 6, FIELD_H + 6);
    const g = game.grid || game.demoGrid;
    if (g) {
        drawFieldGrid(g, time);
        drawBaseShield(time);
        drawBaseHpBar();
        for (let i = 0; i < game.powerups.length; i++) drawPowerUpIcon(game.powerups[i], time);
        drawMines(time);
        for (let i = 0; i < game.enemies.length; i++) {
            const e = game.enemies[i];
            if (e.dead) continue;
            const ct = e.center();
            if (e.spawnTimer > 0) { drawSpawnStar(FIELD_X + ct.x, FIELD_Y + ct.y, 1 - e.spawnTimer / e.spawnMax, time); continue; }
            if (e.type === 'stealth' && (e.stealthT % 6) >= 3) continue;
            const st = ENEMY_TYPES[e.type] || ENEMY_TYPES.basic;
            let pal = {body: st.body, dark: st.dark, light: st.light, tread: st.tread};
            if (e.type === 'armor') {
                const k = e.hp / e.maxHp;
                if (k <= 0.25) pal = {body: '#f8e8b0', dark: '#a89860', light: '#ffffff', tread: '#5c3a22'};
                else if (k <= 0.5) pal = {body: '#f0c078', dark: '#a07038', light: '#fff0d0', tread: '#5c3a22'};
                else if (k <= 0.75) pal = {body: '#f0a060', dark: '#a04c28', light: '#ffe0c0', tread: '#5c3a22'};
            }
            if (game.freezeTimer > 0) pal = {body: '#a0e8ff', dark: '#4090c0', light: '#e8ffff', tread: '#2c5a78'};
            if (e.type === 'boss')
                drawTankSprite(ctx, FIELD_X + ct.x, FIELD_Y + ct.y, e.dir, gg => drawBossTank(gg, e.hp, e.maxHp, e.trackPhase, time, e.muzzle));
            else
                drawTankSprite(ctx, FIELD_X + ct.x, FIELD_Y + ct.y, e.dir, gg => drawEnemyTank(gg, e.type, pal, e.hp, e.maxHp, e.trackPhase, time, e.muzzle));
            ctx.textAlign = 'center';
            if (e.forceStar) {
                ctx.save();
                ctx.globalAlpha = 0.55 + 0.45 * Math.sin(time * 7);
                ctx.fillStyle = '#ffd700';
                ctx.font = '10px "Press Start 2P",monospace';
                ctx.fillText('★', FIELD_X + ct.x, FIELD_Y + e.y - 5);
                ctx.restore();
            } else if (e.flash && Math.floor(time * 6) % 2 === 0) {
                ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#ff3030';
                ctx.fillRect(FIELD_X + e.x, FIELD_Y + e.y, TILE, TILE); ctx.restore();
            }
            if (e.hitFlash > 0) {
                ctx.save(); ctx.globalAlpha = clamp(e.hitFlash / 0.2, 0, 1) * 0.6; ctx.fillStyle = '#ffffff';
                ctx.fillRect(FIELD_X + e.x, FIELD_Y + e.y, TILE, TILE); ctx.restore();
            }
        }
        for (let pi = 0; pi < game.mode; pi++) {
            const p = game.players[pi];
            drawGhostBuild(p, time);
            if (!p || p.dead) {
                if (p && game.respawnT[pi] > 0 && game.lives[pi] > 0 && game.state === 'playing') {
                    const sp = PLAYER_SPAWNS[pi];
                    const sx = FIELD_X + sp[0] * TILE + TILE / 2, sy = FIELD_Y + sp[1] * TILE + TILE / 2;
                    drawSpawnStar(sx, sy, clamp(1 - game.respawnT[pi] / 1.4, 0, 1), time);
                    ctx.fillStyle = PLAYER_TAG[pi];
                    ctx.font = '7px "Press Start 2P",monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('P' + (pi + 1), sx, sy + 40);
                }
                continue;
            }
            const ct = p.center();
            if (p.spawnTimer > 0) { drawSpawnStar(FIELD_X + ct.x, FIELD_Y + ct.y, 1 - p.spawnTimer / p.spawnMax, time); continue; }
            const pals = (pi === 0 ? P1_PALETTES : P2_PALETTES);
            const pw = clamp(game.playerPower[pi] || 0, 0, MAX_POWER);
            if (p.mode === 'dig') {
                const prog = p.buildT > 0 ? 1 - p.buildT / p.buildTotal : 0;
                drawTankSprite(ctx, FIELD_X + ct.x, FIELD_Y + ct.y, p.dir,
                    gg => drawExcavator(gg, p.trackPhase, time, p.buildT > 0, prog, pals[pw], p.hp));
            } else {
                drawTankSprite(ctx, FIELD_X + ct.x, FIELD_Y + ct.y, p.dir,
                    gg => drawPlayerTank(gg, pw, p.trackPhase, time, p.muzzle, p.hp, pals));
            }
            if (p.buildT > 0) {
                const k = 1 - p.buildT / p.buildTotal;
                const bx = FIELD_X + p.x, by = FIELD_Y + p.y - 9;
                ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(bx - 1, by - 1, TILE + 2, 8);
                ctx.fillStyle = '#c0c8ce';
                ctx.fillRect(bx, by, TILE * clamp(k, 0, 1), 6);
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.fillRect(bx, by, TILE * clamp(k, 0, 1), 2);
            }
            if (p.tpCool > 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(FIELD_X + p.x, FIELD_Y + p.y - (p.buildT > 0 ? 16 : 11), TILE, 5);
                ctx.fillStyle = '#a0f0ff';
                ctx.fillRect(FIELD_X + p.x, FIELD_Y + p.y - (p.buildT > 0 ? 16 : 11), TILE * (1 - p.tpCool / TELEPORT_COOLDOWN), 4);
            }
            if (p.shieldTimer > 0) drawShieldRing(FIELD_X + ct.x, FIELD_Y + ct.y, time);
            if (p.frozen > 0) {
                ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#80d0ff';
                ctx.fillRect(FIELD_X + p.x, FIELD_Y + p.y, TILE, TILE);
                ctx.restore();
                ctx.fillStyle = '#a0f0ff';
                ctx.font = '7px "Press Start 2P",monospace'; ctx.textAlign = 'center';
                ctx.fillText('ЗАМОРОЖЕН', FIELD_X + ct.x, FIELD_Y + p.y - 5);
            }
            if (p.hitFlash > 0) {
                ctx.save(); ctx.globalAlpha = clamp(p.hitFlash / 0.2, 0, 1) * 0.55; ctx.fillStyle = '#ffffff';
                ctx.fillRect(FIELD_X + p.x, FIELD_Y + p.y, TILE, TILE); ctx.restore();
            }
            ctx.textAlign = 'center';
            if (game.mode > 1) {
                ctx.fillStyle = PLAYER_TAG[pi];
                ctx.font = '7px "Press Start 2P",monospace';
                ctx.fillText((pi + 1) + 'P', FIELD_X + ct.x, FIELD_Y + p.y - (p.buildT > 0 ? 16 : 5));
            }
            if (pw >= MAX_POWER && p.buildT <= 0) {
                ctx.save();
                ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 4);
                ctx.fillStyle = '#ff9040';
                ctx.font = '7px "Press Start 2P",monospace';
                ctx.fillText('MG', FIELD_X + ct.x, FIELD_Y + p.y + TILE + 9);
                ctx.restore();
            }
            if (p.onSand) {
                ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = PAL ? PAL.sandLight : '#e3c478';
                ctx.fillRect(FIELD_X + p.x, FIELD_Y + p.y, TILE, TILE); ctx.restore();
                ctx.fillStyle = 'rgba(255,240,200,0.9)';
                ctx.font = '7px "Press Start 2P",monospace';
                ctx.fillText('ВЯЗКО x3', FIELD_X + ct.x, FIELD_Y + p.y + TILE + 19);
            }
        }
        for (let i = 0; i < game.bullets.length; i++) drawBullet(game.bullets[i], time);
        drawForest(g);
        ctx.save();
        ctx.translate(FIELD_X, FIELD_Y);
        drawDebris(ctx);
        drawParticles(ctx);
        ctx.restore();
        drawBossBar(time);
        if (game.bossAlertT > 0) {
            const k = game.bossAlertT / 5;
            const blink = Math.floor(time * 6) % 2 === 0;
            ctx.fillStyle = blink ? 'rgba(120,0,0,0.45)' : 'rgba(20,0,0,0.6)';
            ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
            if (blink) {
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ff3030';
                ctx.font = '26px "Press Start 2P",monospace';
                ctx.fillText('ВНИМАНИЕ!', FIELD_X + FIELD_W / 2, FIELD_Y + FIELD_H / 2 - 30);
                ctx.font = '16px "Press Start 2P",monospace';
                ctx.fillText('БОСС ПРИБЛИЖАЕТСЯ', FIELD_X + FIELD_W / 2, FIELD_Y + FIELD_H / 2 + 10);
            }
        }
        if (game.levelIntroT > 0 && game.state === 'playing') {
            const k = clamp(game.levelIntroT / 2.6, 0, 1);
            const fcx = FIELD_X + FIELD_W / 2, fcy = FIELD_Y + FIELD_H / 2;
            ctx.save();
            ctx.globalAlpha = Math.min(1, k * 1.8);
            ctx.fillStyle = 'rgba(0,0,0,0.70)';
            ctx.fillRect(FIELD_X, fcy - 84, FIELD_W, 168);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f0d030';
            ctx.font = '24px "Press Start 2P",monospace';
            ctx.fillText('УРОВЕНЬ ' + game.level, fcx, fcy - 56);
            ctx.fillStyle = '#8be06a';
            ctx.font = '9px "Press Start 2P",monospace';
            ctx.fillText('♪ ' + MELODIES[(game.level - 1) % MELODIES.length].name, fcx, fcy - 30);
            ctx.fillStyle = PAL ? PAL.accent : '#9aa0c0';
            ctx.fillText('ПАЛИТРА: ' + game.themeName + ' · ' + game.styleName, fcx, fcy - 12);
            ctx.fillStyle = '#ff8090';
            ctx.fillText('ВРАГИ: НЕВИДИМКА·МАТКА·МОРОЗ·КАМИКАДЗЕ·РАЗРУШИТЕЛЬ', fcx, fcy + 6);
            ctx.fillStyle = '#9aa0c0';
            ctx.fillText(game.mode > 1 ? '2 ИГРОКА · ЗАЩИТИТЕ БАЗУ!' : 'ЗАЩИТИ БАЗУ! (20 УДАРОВ)', fcx, fcy + 24);
            ctx.fillStyle = '#ffd700';
            ctx.fillText('ЗВЁЗДЫ: 1 ТЕМП · 2 ДУЛА · 3 БРОНЯ · 4 ВЕЗДЕХОД · 5 ПУЛЕМЁТ', fcx, fcy + 42);
            if (isBossLevel(game.level)) {
                ctx.fillStyle = '#ff2020';
                ctx.fillText('БОСС!', fcx, fcy + 60);
            }
            ctx.restore();
        }
        ctx.textAlign = 'center';
        let bottomLine = 0;
        if (game.freezeTimer > 0 && game.state === 'playing') {
            ctx.fillStyle = '#a0f0ff';
            ctx.font = '8px "Press Start 2P",monospace';
            ctx.fillText('ЗАМОРОЗКА ВРАГОВ ' + Math.ceil(game.freezeTimer), FIELD_X + FIELD_W / 2, FIELD_Y + FIELD_H + 6);
            bottomLine = 1;
        }
        for (let pi = 0; pi < game.mode; pi++) {
            const p = game.players[pi];
            if (!p || p.dead || game.state !== 'playing') continue;
            let txt = '';
            if (p.buildT > 0) txt = 'ЛЬЁМ БЕТОН ' + p.buildT.toFixed(1) + 'С';
            else if (p.mode === 'dig') txt = 'ЭКСКАВАТОР · ОГОНЬ = БЕТОН';
            else if ((game.playerPower[pi] || 0) >= MAX_POWER) txt = 'МИНЫ: ' + bindName(BINDS[pi].mine) + ' · ПОСТАВЛЕНО ' + game.mines.length + '/' + MAX_MINES;
            if (!txt) continue;
            bottomLine++;
            ctx.fillStyle = '#ffd040';
            ctx.font = '8px "Press Start 2P",monospace';
            ctx.fillText((game.mode > 1 ? ('P' + (pi + 1) + ' ') : '') + txt, FIELD_X + FIELD_W / 2, FIELD_Y + FIELD_H + 6 + bottomLine * 12);
        }
    }
    drawPanel(time);
    ctx.restore();
    if (game.state === 'levelclear') drawLevelClear(time);
    else if (game.state === 'gameover') drawGameOver(time);
    else if (game.state === 'victory') drawVictory(time);
    if (UI.active) drawUIMenu(time);
    if (scanlines) ctx.drawImage(scanlines, 0, 0);
    if (vignetteOv) ctx.drawImage(vignetteOv, 0, 0);
}