"use strict";

class Tank {
    constructor(x, y, dir, isPlayer, type, playerIndex) {
        this.x = x; this.y = y; this.dir = dir;
        this.isPlayer = !!isPlayer;
        this.type = type || 'basic';
        this.side = this.isPlayer ? 0 : 1;
        this.playerIndex = (playerIndex === undefined || playerIndex === null) ? -1 : playerIndex;
        const st = ENEMY_TYPES[this.type] || null;
        this.speed = isPlayer ? PLAYER_SPEEDS[0] : (st ? st.speed : 70);
        this.hp = isPlayer ? 1 : (st ? st.hp : 1);
        this.maxHp = this.hp;
        this.cooldown = 0.5;
        this.shieldTimer = 0;
        this.frozen = 0;
        this.spawnTimer = isPlayer ? 0.8 : 1.0;
        this.spawnMax = this.spawnTimer;
        this.trackPhase = 0; this.muzzle = 0;
        this.dead = false; this.deathHandled = false;
        this.blocked = false; this.blockTime = 0;
        this.flash = false; this.forceStar = false;
        this.hitFlash = 0; this.onSand = false;
        this.mode = 'tank';
        this.buildT = 0; this.buildTotal = BUILD_TIME; this.buildTile = null;
        this.aiTimer = rand(0.3, 1.2);
        this.shootTimer = rand(0.8, 2.0);
        this.tpCool = 0;
        this.ghost = 0;
        this.mineCool = 0;
        this.stealthT = rand(0, 6);
        this.matkaT = MATKA_INTERVAL;
    }
    rect() { return {x: this.x, y: this.y, w: TILE, h: TILE}; }
    touchRect() { return {x: this.x + TANK_INSET, y: this.y + TANK_INSET, w: TILE - TANK_INSET * 2, h: TILE - TANK_INSET * 2}; }
    center() { return {x: this.x + TILE / 2, y: this.y + TILE / 2}; }
    tileAt(gm, x, y) {
        const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
        if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return T.EMPTY;
        return gm.grid[ty][tx];
    }
    canOccupy(nx, ny, gm) {
        if (nx < 0 || ny < 0 || nx + TILE > FIELD_W || ny + TILE > FIELD_H) return false;
        const x0 = Math.floor(nx / TILE), x1 = Math.floor((nx + TILE - 1) / TILE);
        const y0 = Math.floor(ny / TILE), y1 = Math.floor((ny + TILE - 1) / TILE);
        const allTerrain = this.isPlayer && (gm.playerPower[this.playerIndex] || 0) >= 4;
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
            const t = gm.grid[ty][tx];
            if (t === T.BRICK || t === T.CONCRETE || t === T.STEEL || t === T.BASE || t === T.BASE_DEAD) return false;
            if (t === T.WATER && !allTerrain) return false;
        }
        if (this.ghost > 0) return true;
        const r = {x: nx + TANK_INSET, y: ny + TANK_INSET, w: TILE - TANK_INSET * 2, h: TILE - TANK_INSET * 2};
        const tanks = gm.allTanks();
        for (let i = 0; i < tanks.length; i++) {
            const o = tanks[i];
            if (o === this || o.dead || o.spawnTimer > 0) continue;
            if (rectsOverlap(r, o.touchRect())) return false;
        }
        return true;
    }
    alignPerp(gm) {
        if (this.dir === 0 || this.dir === 2) {
            const sx = Math.round(this.x / TILE) * TILE;
            if (sx !== this.x && this.canOccupy(sx, this.y, gm)) this.x = sx;
        } else {
            const sy = Math.round(this.y / TILE) * TILE;
            if (sy !== this.y && this.canOccupy(this.x, sy, gm)) this.y = sy;
        }
    }
    tryMove(dt, gm) {
        const v = DIRS[this.dir];
        const ctrTile = this.tileAt(gm, this.x + TILE / 2, this.y + TILE / 2);
        const allTerrain = this.isPlayer && (gm.playerPower[this.playerIndex] || 0) >= 4;
        this.onSand = (ctrTile === T.SAND) && !allTerrain;
        let sp = this.speed;
        if (this.onSand) sp *= SAND_SLOW;
        if (allTerrain && ctrTile === T.WATER && Math.random() < 0.55) {
            const c = this.center();
            waterSplash(c.x - v.x * 18, c.y - v.y * 18);
        }
        const d = sp * dt;
        const nx = this.x + v.x * d, ny = this.y + v.y * d;
        if (this.canOccupy(nx, ny, gm)) {
            this.x = nx; this.y = ny; this.trackPhase += d;
            this.blocked = false; this.blockTime = 0;
            if (this.onSand && Math.random() < (this.isPlayer ? 0.75 : 0.45)) {
                const c = this.center();
                sandDust(c.x - v.x * 18, c.y - v.y * 18);
                if (Math.random() < 0.05) Sound.sand();
            }
            return;
        }
        const assist = Math.max(sp * 0.95, 120) * dt;
        if (v.x !== 0) {
            const target = Math.round(this.y / TILE) * TILE;
            const diff = target - this.y;
            if (Math.abs(diff) > 0.4) {
                const ay = this.y + Math.sign(diff) * Math.min(Math.abs(diff), assist);
                const moved = Math.abs(ay - this.y);
                if (this.canOccupy(nx, ay, gm)) { this.x = nx; this.y = ay; this.trackPhase += d + moved; this.blocked = false; this.blockTime = 0; return; }
                if (this.canOccupy(this.x, ay, gm)) { this.y = ay; this.trackPhase += moved; this.blocked = false; this.blockTime = 0; return; }
            }
        } else {
            const target = Math.round(this.x / TILE) * TILE;
            const diff = target - this.x;
            if (Math.abs(diff) > 0.4) {
                const ax = this.x + Math.sign(diff) * Math.min(Math.abs(diff), assist);
                const moved = Math.abs(ax - this.x);
                if (this.canOccupy(ax, ny, gm)) { this.x = ax; this.y = ny; this.trackPhase += d + moved; this.blocked = false; this.blockTime = 0; return; }
                if (this.canOccupy(ax, this.y, gm)) { this.x = ax; this.trackPhase += moved; this.blocked = false; this.blockTime = 0; return; }
            }
        }
        this.blocked = true; this.blockTime += dt;
    }
    tryShoot(gm) {
        if (this.cooldown > 0) return;
        const st = ENEMY_TYPES[this.type];
        const pw = this.isPlayer ? clamp(gm.playerPower[this.playerIndex] || 0, 0, MAX_POWER) : 0;
        const salvo = this.isPlayer ? PLAYER_SALVO[pw] : (st ? st.salvo : 1);
        const cap = this.isPlayer ? (pw === 1 ? 3 : salvo) : (ENEMY_CAP[this.type] || 1);
        let mine = 0;
        for (let i = 0; i < gm.bullets.length; i++) { const b = gm.bullets[i]; if (b.owner === this && !b.dead) mine++; }
        if (mine >= cap) return;
        const shots = Math.min(salvo, cap - mine);
        const offsAll = this.isPlayer ? (PLAYER_BARRELS[salvo] || [0]) : ((st && st.barrels) || [0]);
        const sorted = offsAll.slice().sort((a, b) => Math.abs(a) - Math.abs(b));
        const use = sorted.slice(0, shots);
        const v = DIRS[this.dir], perp = {x: -v.y, y: v.x};
        const cx = this.x + TILE / 2, cy = this.y + TILE / 2;
        const spd = this.isPlayer ? PLAYER_BULLET_SPEED[pw] : (st ? st.bulletSpeed : 170);
        const isFreeze = (this.type === 'freezer');
        const isExpl = (this.type === 'breaker');
        for (let i = 0; i < use.length; i++) {
            const off = use[i];
            const bx = clamp(cx + v.x * MUZZLE_DIST + perp.x * off - 4, 0, FIELD_W - 8);
            const by = clamp(cy + v.y * MUZZLE_DIST + perp.y * off - 4, 0, FIELD_H - 8);
            const nb = new Bullet(bx, by, this.dir, spd, this);
            nb.freeze = isFreeze; nb.explosive = isExpl;
            gm.bullets.push(nb);
            muzzleFlash(bx + 4, by + 4, this.dir, isExpl);
        }
        this.cooldown = this.isPlayer ? PLAYER_COOLDOWN[pw] : ((st ? st.cool : 1.2) * rand(0.8, 1.3));
        this.muzzle = 0.07;
        if (this.isPlayer) Sound.shoot();
        else if (this.type === 'boss' || this.type === 'breaker') Sound.bossShoot();
        else Sound.enemyShoot();
    }
    updatePlayer(dt, gm) {
        if (this.spawnTimer > 0) { this.spawnTimer -= dt; return; }
        this.cooldown -= dt; this.shieldTimer -= dt; this.muzzle -= dt; this.hitFlash -= dt;
        this.tpCool = Math.max(0, this.tpCool - dt);
        this.ghost = Math.max(0, this.ghost - dt);
        this.mineCool = Math.max(0, this.mineCool - dt);
        this.frozen = Math.max(0, this.frozen - dt);
        if (this.frozen > 0) return;
        if (this.buildT > 0) {
            this.buildT -= dt;
            gm.buildFx(this, dt);
            if (this.buildT <= 0) { this.buildT = 0; gm.finishBuild(this); }
            return;
        }
        const inp = Input.st[clamp(this.playerIndex, 0, 1)];
        this.speed = PLAYER_SPEEDS[clamp(gm.playerPower[this.playerIndex] || 0, 0, MAX_POWER)];
        const want = inp.dir;
        if (want >= 0) {
            if (want !== this.dir) { this.dir = want; this.alignPerp(gm); }
            this.tryMove(dt, gm);
        }
        if (inp.fire) {
            if (this.mode === 'dig') gm.startBuild(this);
            else this.tryShoot(gm);
        }
        if (inp.digEdge) gm.toggleMode(this);
        if (inp.mineEdge) gm.placeMine(this);
        if (inp.teleEdge) gm.teleportPlayer(this);
    }
    chooseDirection(gm) {
        let bias = 0.65;
        let target = null;
        if (this.type === 'kamikaze') bias = 0.9;
        if (Math.random() < bias) {
            const p = this.type === 'kamikaze' ? gm.nearestAlivePlayer() : gm.randomAlivePlayer();
            if (p && Math.random() < 0.6) target = {x: p.x, y: p.y};
            else target = {x: 6 * TILE, y: 12 * TILE};
        }
        const tryDir = d => {
            const v = DIRS[d];
            if (this.canOccupy(this.x + v.x * 6, this.y + v.y * 6, gm)) { this.dir = d; this.alignPerp(gm); return true; }
            return false;
        };
        if (target) {
            const dx = target.x - this.x, dy = target.y - this.y;
            const opts = [];
            if (Math.abs(dx) > Math.abs(dy)) opts.push(dx > 0 ? 1 : 3, dy > 0 ? 2 : 0);
            else opts.push(dy > 0 ? 2 : 0, dx > 0 ? 1 : 3);
            for (let i = 0; i < opts.length; i++) if (tryDir(opts[i])) return;
        }
        const ds = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
        for (let i = 0; i < ds.length; i++) if (tryDir(ds[i])) return;
    }
    updateEnemy(dt, gm) {
        if (this.spawnTimer > 0) { this.spawnTimer -= dt; return; }
        this.shieldTimer -= dt; this.hitFlash -= dt; this.muzzle -= dt;
        if (gm.freezeTimer > 0) return;
        this.cooldown -= dt;
        this.stealthT += dt;
        if (this.type === 'matka') {
            this.matkaT -= dt;
            if (this.matkaT <= 0) { this.matkaT = MATKA_INTERVAL; gm.matkaSpawn(this); }
        }
        if (this.type === 'kamikaze') {
            const pl = gm.nearestAlivePlayer();
            if (pl) {
                const dx = this.x - pl.x, dy = this.y - pl.y;
                if (Math.hypot(dx, dy) < TILE * 1.2) { gm.kamikazeExplode(this); return; }
            }
        }
        this.aiTimer -= dt;
        if (this.aiTimer <= 0 || this.blocked) {
            this.chooseDirection(gm);
            this.aiTimer = rand(0.6, 2.0);
        }
        this.tryMove(dt, gm);
        if (this.blocked && this.blockTime > 0.22 && this.cooldown <= 0) this.tryShoot(gm);
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
            this.tryShoot(gm);
            this.shootTimer = rand(0.5, 1.6);
        }
    }
    hit() {
        if (this.shieldTimer > 0) return 0;
        this.hp--; this.hitFlash = 0.2;
        if (this.hp <= 0) { this.dead = true; return 2; }
        Sound.hitArmor();
        return 1;
    }
}

class Bullet {
    constructor(x, y, dir, speed, owner) {
        this.x = x; this.y = y; this.dir = dir; this.speed = speed;
        this.owner = owner; this.dead = false; this.w = 8; this.h = 8;
        this.side = owner ? owner.side : 1;
        this.freeze = false; this.explosive = false;
        this.tier = (owner && owner.isPlayer) ? (game.playerPower[owner.playerIndex] || 0) : 0;
        this.steelPierce = (owner && owner.isPlayer) && this.tier >= 4;
    }
    rect() { return {x: this.x, y: this.y, w: this.w, h: this.h}; }
    hitRect() { const s = TILE; return {x: this.x + 4 - s / 2, y: this.y + 4 - s / 2, w: s, h: s}; }
    update(dt, gm) {
        const v = DIRS[this.dir];
        this.x += v.x * this.speed * dt;
        this.y += v.y * this.speed * dt;
        if (Math.random() < 0.45)
            addParticle(this.x + 4, this.y + 4, rand(-14, 14), rand(-14, 14), 0.14,
                this.explosive ? '#ff9050' : (this.freeze ? '#bfeaff' : (this.side === 0 ? '#fff0a0' : '#ffd0d0')), 2, 0);
        const cx = this.x + 4, cy = this.y + 4;
        const ER = TILE * 1.5;
        if (cx < 0 || cy < 0 || cx >= FIELD_W || cy >= FIELD_H) {
            this.dead = true;
            if (this.explosive) gm.shellExplosion(clamp(cx, 8, FIELD_W - 8), clamp(cy, 8, FIELD_H - 8), ER, true, false);
            else explodeSmall(clamp(cx, 5, FIELD_W - 5), clamp(cy, 5, FIELD_H - 5));
            return;
        }
        const tx = Math.floor(cx / TILE), ty = Math.floor(cy / TILE);
        const t = gm.grid[ty][tx];
        if (t === T.BRICK || t === T.CONCRETE) {
            this.dead = true;
            if (this.explosive) { gm.shellExplosion(cx, cy, ER, true, false); return; }
            const destroyed = gm.damageBrick(tx, ty);
            if (destroyed) { brickShatter(cx, cy, true); explodeSmall(cx, cy); Sound.brick(); }
            else { brickShatter(cx, cy, false); Sound.crack(); }
            return;
        }
        if (t === T.STEEL) {
            this.dead = true;
            if (this.explosive) { gm.shellExplosion(cx, cy, ER, true, false); return; }
            if (this.steelPierce) { gm.grid[ty][tx] = T.EMPTY; steelShatter(cx, cy); explodeSmall(cx, cy); }
            else { sparks(cx, cy); Sound.steel(); }
            return;
        }
        if (t === T.BASE) {
            this.dead = true;
            if (this.side === 1) { gm.hitBase(); } else { sparks(cx, cy); Sound.steel(); }
            if (this.explosive) gm.shellExplosion(cx, cy, ER, true, false);
            return;
        }
        if (this.side === 0) {
            for (let i = 0; i < gm.enemies.length; i++) {
                const e = gm.enemies[i];
                if (e.dead || e.spawnTimer > 0) continue;
                if (rectsOverlap(this.rect(), e.rect())) {
                    this.dead = true;
                    const res = e.hit();
                    if (res === 2) gm.onEnemyKilled(e);
                    else if (res === 1) { sparks(cx, cy); }
                    else { sparks(cx, cy); Sound.steel(); }
                    return;
                }
            }
        } else {
            for (let i = 0; i < gm.players.length; i++) {
                const p = gm.players[i];
                if (!p || p.dead || p.spawnTimer > 0) continue;
                if (rectsOverlap(this.rect(), p.rect())) {
                    this.dead = true;
                    if (this.freeze) {
                        if (p.shieldTimer > 0) { sparks(cx, cy); Sound.steel(); }
                        else { p.frozen = 3.0; addFloater(cx, cy - 20, 'ЗАМОРОЖЕН!', '#80d0ff'); Sound.stun(); }
                        return;
                    }
                    if (p.shieldTimer > 0) { sparks(cx, cy); Sound.steel(); return; }
                    const res = p.hit();
                    if (res === 2) gm.killPlayer(p);
                    else if (res === 1) {
                        sparks(cx, cy);
                        addFloater(cx, cy - 20, 'БРОНЯ -1', '#ff9090');
                        burst(cx, cy, 10, ['#ffffff', '#c0d8ff'], 60, 220, 2, 5, 200);
                    } else sparks(cx, cy);
                    if (this.explosive) gm.shellExplosion(cx, cy, ER, false, false);
                    return;
                }
            }
        }
    }
}

class PowerUp {
    constructor(x, y, type) { this.x = x; this.y = y; this.type = type; this.ttl = 14; this.t = 0; this.dead = false; }
    rect() { return {x: this.x + 6, y: this.y + 6, w: TILE - 12, h: TILE - 12}; }
    update(dt) { this.t += dt; this.ttl -= dt; if (this.ttl <= 0) this.dead = true; }
}