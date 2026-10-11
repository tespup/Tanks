"use strict";

const particles = [], rings = [], floaters = [], debris = [];

function addParticle(x, y, vx, vy, life, color, size, grav) {
    if (particles.length > 900) return;
    particles.push({x: x, y: y, vx: vx, vy: vy, life: life, maxLife: life, color: color, size: size, grav: grav || 0});
}

function addDebris(x, y, vx, vy, rot, vrot, w, h, color, life) {
    if (debris.length > 360) return;
    debris.push({x: x, y: y, vx: vx, vy: vy, rot: rot, vrot: vrot, w: w, h: h, color: color, life: life, maxLife: life});
}

function addRing(x, y, color, delay) {
    rings.push({x: x, y: y, t: -(delay || 0), dur: 0.45, color: color});
}

function addFloater(x, y, text, color) {
    floaters.push({x: x, y: y, text: text, color: color, t: 0});
}

function burst(x, y, count, colors, s0, s1, z0, z1, grav) {
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, s = rand(s0, s1);
        addParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(0.35, 0.9),
            colors[randInt(0, colors.length - 1)], rand(z0, z1), grav || 300);
    }
}

function explodeBig(x, y) {
    burst(x, y, 42, ['#ff5020', '#ffa030', '#ffe060', '#fff2b0'], 80, 340, 3, 8, 260);
    for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2, s = rand(60, 220);
        addDebris(x, y, Math.cos(a) * s, Math.sin(a) * s - rand(30, 120), rand(0, 6.3), rand(-10, 10),
            rand(3, 7), rand(3, 6), STEEL_DEBRIS[randInt(0, STEEL_DEBRIS.length - 1)], rand(0.5, 1.0));
    }
    addRing(x, y, '#ffd060', 0); addRing(x, y, '#ff6030', 0.08);
    Sound.boomBig();
}

function explodeSmall(x, y) {
    burst(x, y, 16, ['#ff7040', '#ffc060', '#fff0a0'], 60, 220, 2, 6, 280);
    addRing(x, y, '#ffb060', 0);
    Sound.boomSmall();
}

function bulletPop(x, y) {
    burst(x, y, 16, ['#ffffff', '#fff8c0', '#ffd040', '#ff9040'], 70, 270, 2, 5, 150);
    addRing(x, y, '#ffe080', 0);
    for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2, s = rand(60, 190);
        addDebris(x, y, Math.cos(a) * s, Math.sin(a) * s - 50, rand(0, 6.3), rand(-16, 16),
            rand(2, 4), rand(2, 3), ['#ffd88a', '#ff9040', '#fff2c0'][randInt(0, 2)], rand(0.25, 0.55));
    }
    Sound.pop();
}

function brickShatter(x, y, big) {
    const n = big ? 20 : 6;
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = rand(big ? 140 : 80, big ? 420 : 200);
        addDebris(x + rand(-12, 12), y + rand(-12, 12), Math.cos(a) * s, Math.sin(a) * s - rand(40, big ? 190 : 90),
            rand(0, 6.28), rand(-13, 13), rand(big ? 5 : 3, big ? 12 : 7), rand(big ? 4 : 3, big ? 8 : 6),
            BRICK_DEBRIS[randInt(0, BRICK_DEBRIS.length - 1)], rand(0.55, big ? 1.2 : 0.8));
    }
    for (let i = 0; i < (big ? 18 : 6); i++) {
        addParticle(x + rand(-14, 14), y + rand(-14, 14), rand(-60, 60), rand(-80, -10),
            rand(0.4, 0.95), DUST_COL, rand(4, big ? 11 : 7), -24);
    }
    if (big) { addRing(x, y, BRICK_DEBRIS[0], 0); addRing(x, y, '#ffb070', 0.06); }
}

function steelShatter(x, y) {
    for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2, s = rand(120, 340);
        addDebris(x, y, Math.cos(a) * s, Math.sin(a) * s - rand(40, 150), rand(0, 6.3), rand(-12, 12),
            rand(4, 9), rand(3, 6), STEEL_DEBRIS[randInt(0, STEEL_DEBRIS.length - 1)], rand(0.5, 1.0));
    }
    sparks(x, y);
}

function shieldBurst(x, y) {
    burst(x, y, 24, ['#60e0ff', '#ffffff', '#a0f0ff'], 70, 280, 2, 6, 60);
    addRing(x, y, '#60e0ff', 0); addRing(x, y, '#ffffff', 0.08);
}

function teleportBurst(x, y, tag) {
    burst(x, y, 22, ['#a0f0ff', '#ffffff', tag || '#f0d030'], 70, 280, 2, 6, 0);
    addRing(x, y, '#a0f0ff', 0); addRing(x, y, '#ffffff', 0.08);
}

function sparks(x, y) { burst(x, y, 10, ['#fff060', '#ffffc0', '#ffa020'], 80, 300, 2, 4, 200); }
function smoke(x, y) { addParticle(x, y, rand(-14, 14), rand(-40, -16), rand(0.5, 1.0), 'rgba(90,90,100,0.55)', rand(4, 9), -14); }
function sandDust(x, y) { addParticle(x + rand(-16, 16), y + rand(-6, 16), rand(-34, 34), rand(-52, -12), rand(0.35, 0.8), SAND_COL, rand(3, 8), -12); }
function waterSplash(x, y) { addParticle(x + rand(-16, 16), y + rand(-8, 12), rand(-24, 24), rand(-70, -24), rand(0.3, 0.6), 'rgba(120,190,255,0.75)', rand(3, 6), 90); }
function buildDust(x, y, color) { addParticle(x + rand(-14, 14), y + rand(-14, 14), rand(-40, 40), rand(-70, -14), rand(0.4, 0.9), color || DUST_COL, rand(3, 8), -18); }

function muzzleFlash(x, y, dir, big) {
    const v = DIRS[dir];
    burst(x, y, big ? 12 : 6, ['#fff8c0', '#ffd040'], 40, big ? 220 : 160, 2, big ? 6 : 4, 0);
    addParticle(x, y, v.x * 70, v.y * 70, 0.12, '#fff8d0', big ? 9 : 6, 0);
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt;
    }
    for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.life -= dt;
        if (d.life <= 0) { debris.splice(i, 1); continue; }
        d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 520 * dt; d.rot += d.vrot * dt; d.vx *= 0.995;
    }
    for (let i = rings.length - 1; i >= 0; i--) { rings[i].t += dt; if (rings[i].t > rings[i].dur) rings.splice(i, 1); }
    for (let i = floaters.length - 1; i >= 0; i--) { const f = floaters[i]; f.t += dt; f.y -= 30 * dt; if (f.t > 1.3) floaters.splice(i, 1); }
}

function drawDebris(c) {
    for (let i = 0; i < debris.length; i++) {
        const d = debris[i];
        c.save();
        c.globalAlpha = clamp(d.life / d.maxLife, 0, 1);
        c.translate(d.x, d.y); c.rotate(d.rot);
        c.fillStyle = d.color; c.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
        c.fillStyle = 'rgba(255,255,255,0.26)'; c.fillRect(-d.w / 2, -d.h / 2, d.w, Math.max(1, d.h * 0.28));
        c.fillStyle = 'rgba(0,0,0,0.24)'; c.fillRect(-d.w / 2, d.h / 2 - Math.max(1, d.h * 0.22), d.w, Math.max(1, d.h * 0.22));
        c.restore();
    }
    c.globalAlpha = 1;
}

function drawParticles(c) {
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        c.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
        c.fillStyle = p.color;
        c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    c.globalAlpha = 1;
    for (let i = 0; i < rings.length; i++) {
        const r = rings[i];
        if (r.t < 0) continue;
        const k = r.t / r.dur;
        c.globalAlpha = 1 - k;
        c.strokeStyle = r.color; c.lineWidth = 3 * (1 - k) + 1;
        c.beginPath(); c.arc(r.x, r.y, 6 + k * 46, 0, Math.PI * 2); c.stroke();
    }
    c.globalAlpha = 1;
    c.font = '9px "Press Start 2P",monospace';
    c.textAlign = 'center';
    for (let i = 0; i < floaters.length; i++) {
        const f = floaters[i];
        c.globalAlpha = clamp(1.3 - f.t, 0, 1);
        c.fillStyle = '#000'; c.fillText(f.text, f.x + 1, f.y + 1);
        c.fillStyle = f.color; c.fillText(f.text, f.x, f.y);
    }
    c.globalAlpha = 1;
}