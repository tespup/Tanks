"use strict";

const game = {
    state: 'menu', mode: 1, level: 1, score: 0,
    lives: [3, 3], playerPower: [0, 0], respawnT: [0, 0], respawnTries: [0, 0],
    grid: null, brickHp: null, demoGrid: null,
    players: [null, null], enemies: [], bullets: [], powerups: [], mines: [],
    turrets: [], turretShells: [],
    enemyQueue: [], spawnTimer: 2, spawnIdx: 0,
    freezeTimer: 0, baseFortified: false, baseArmor: 0, baseHp: BASE_MAX_HP,
    bossAlertT: 0, bossesKilled: 0,
    levelIntroT: 0, transitionT: 0, gameOverT: 0,
    baseAlive: true, hiScore: 0, killStats: {},
    starsNeeded: 1, starsDropped: 0,
    levelClearPending: false, clearT: 0,
    pal: null, themeName: '', styleIdx: 0, styleName: '',
    
    allTanks() {
        const arr = [];
        for (let i = 0; i < this.players.length; i++) { const p = this.players[i]; if (p && !p.dead) arr.push(p); }
        for (let i = 0; i < this.enemies.length; i++) if (!this.enemies[i].dead) arr.push(this.enemies[i]);
        return arr;
    },
    alivePlayers() {
        const arr = [];
        for (let i = 0; i < this.mode; i++) { const p = this.players[i]; if (p && !p.dead && p.spawnTimer <= 0) arr.push(p); }
        return arr;
    },
    randomAlivePlayer() { const a = this.alivePlayers(); return a.length ? a[randInt(0, a.length - 1)] : null; },
    nearestAlivePlayer() {
        let best = null, bd = 1e9;
        for (let i = 0; i < this.mode; i++) {
            const p = this.players[i];
            if (!p || p.dead || p.spawnTimer > 0) continue;
            const d = p.x * p.x + p.y * p.y;
            if (d < bd) { bd = d; best = p; }
        }
        return best;
    },
    allPlayersOut() { for (let i = 0; i < this.mode; i++) if (this.lives[i] > 0) return false; return true; },
    isFortTile(tx, ty) {
        for (let i = 0; i < FORT.length; i++) if (FORT[i][0] === tx && FORT[i][1] === ty) return true;
        return (tx === 6 && ty === 12);
    },
    startGame(mode) {
        this.mode = (mode === 2) ? 2 : 1;
        this.level = 1; this.score = 0;
        this.lives = [3, 3]; this.playerPower = [0, 0];
        this.state = 'playing';
        this.startLevel();
    },
    startLevel() {
        const th = pickLevelTheme(this.level);
        applyLevelTheme(th.theme, th.style);
        this.grid = generateLevel(this.level);
        this.brickHp = buildBrickHp(this.grid);
        this.players = [null, null];
        this.enemies = []; this.bullets = []; this.powerups = []; this.mines = [];
        this.turrets = []; this.turretShells = [];
        particles.length = 0; rings.length = 0; floaters.length = 0; debris.length = 0;
        this.starsNeeded = (this.mode >= 2) ? 2 : 1;
        this.starsDropped = 0;
        this.enemyQueue = buildEnemyQueue(this.level, this.starsNeeded);
        this.spawnTimer = 1.5; this.spawnIdx = 0;
        this.freezeTimer = 0; this.baseFortified = false; this.baseArmor = 0;
        this.baseAlive = true; this.baseHp = BASE_MAX_HP;
        this.bossesKilled = 0;
        this.levelClearPending = false; this.clearT = 0;
        this.killStats = {basic: 0, fast: 0, power: 0, armor: 0, stealth: 0, matka: 0, freezer: 0, kamikaze: 0, breaker: 0, boss: 0};
        this.respawnT = [0, 0]; this.respawnTries = [0, 0];
        this.transitionT = 0; this.gameOverT = 0;
        this.levelIntroT = 2.6;
        if (isBossLevel(this.level)) {
            this.bossAlertT = 5; Sound.bossSiren();
            this.forceClearTile(6, 1);
            const b = new Tank(6 * TILE, 1 * TILE, 2, false, 'boss', -1);
            b.hp = BOSS_HP; b.maxHp = BOSS_HP; b.shieldTimer = 2;
            this.enemies.push(b);
        }
        for (let i = 0; i < this.mode; i++) this.spawnPlayer(i, true);
        Music.start((this.level - 1) % MELODIES.length);
    },
    restartLevel() { this.state = 'playing'; this.startLevel(); },
    toMainMenu() {
        this.saveHiScore(); Music.stop(); this.state = 'menu';
        this.grid = null; this.brickHp = null;
        applyLevelTheme(CLASSIC_THEME, 0);
        this.demoGrid = generateLevel(1);
        this.players = [null, null]; this.enemies = []; this.bullets = []; this.powerups = []; this.mines = [];
        this.turrets = []; this.turretShells = [];
        particles.length = 0; rings.length = 0; floaters.length = 0; debris.length = 0;
        this.levelClearPending = false; this.gameOverT = 0;
        this.score = 0; this.lives = [3, 3]; this.level = 1; this.playerPower = [0, 0];
        this.baseArmor = 0; this.baseFortified = false;
        UI.screen = 'main'; UI.index = 0; UI.active = true; UI.returnTo = 'main';
        UI.rebinding = false; UI.msg = ''; UI.msgT = 0;
    },
    spawnPlayer(pi, first) {
        const sp = PLAYER_SPAWNS[pi] || PLAYER_SPAWNS[0];
        const t = new Tank(sp[0] * TILE, sp[1] * TILE, 0, true, 'player', pi);
        t.shieldTimer = 3;
        if (!first) this.playerPower[pi] = 0;
        t.maxHp = PLAYER_HP[clamp(this.playerPower[pi], 0, MAX_POWER)];
        t.hp = t.maxHp;
        this.players[pi] = t;
        this.respawnT[pi] = 0; this.respawnTries[pi] = 0;
        Sound.respawn();
        const c = t.center();
        burst(c.x, c.y, 18, ['#ffffff', PLAYER_TAG[pi]], 60, 240, 2, 5, 0);
        addRing(c.x, c.y, '#fff8b0', 0);
    },
    teleportPlayer(p) {
        if (!p || p.dead || p.spawnTimer > 0 || p.frozen > 0 || p.buildT > 0) return;
        if (p.tpCool > 0) return;
        const c = p.center();
        const pi = clamp(p.playerIndex, 0, 1);
        const sp = PLAYER_SPAWNS[pi] || PLAYER_SPAWNS[0];
        teleportBurst(c.x, c.y, PLAYER_TAG[pi]);
        p.x = sp[0] * TILE; p.y = sp[1] * TILE; p.dir = 0;
        p.tpCool = TELEPORT_COOLDOWN; p.ghost = 0.5;
        teleportBurst(p.x + TILE / 2, p.y + TILE / 2, PLAYER_TAG[pi]);
        Sound.teleport();
        addFloater(p.x + TILE / 2, p.y - 6, 'ТЕЛЕПОРТ', '#a0f0ff');
    },
    placeMine(p) {
        if (!p || p.dead || p.spawnTimer > 0 || p.frozen > 0 || p.buildT > 0) return;
        const pw = clamp(this.playerPower[p.playerIndex] || 0, 0, MAX_POWER);
        if (pw < MAX_POWER) { addFloater(p.x + TILE / 2, p.y - 6, 'НУЖНА 5-Я ЗВЕЗДА', '#ff9040'); Sound.buildFail(); return; }
        if (p.mineCool > 0) return;
        if (this.mines.length >= MAX_MINES) { addFloater(p.x + TILE / 2, p.y - 6, 'МАКС. МИН (' + MAX_MINES + ')', '#ff9040'); Sound.buildFail(); return; }
        this.mines.push({x: p.x + TILE / 2, y: p.y + TILE / 2, t: 0});
        p.mineCool = MINE_COOLDOWN;
        Sound.buildDone();
        addFloater(p.x + TILE / 2, p.y - 6, 'МИНА (' + this.mines.length + '/' + MAX_MINES + ')', '#ff9040');
    },
    kamikazeExplode(k) {
        if (k.dead) return;
        k.dead = true;
        const c = k.center();
        const R = TILE * 1.2;
        explodeBig(c.x, c.y);
        this.killStats.kamikaze = (this.killStats.kamikaze || 0) + 1;
        for (let i = 0; i < this.enemies.length; i++) {
            const e = this.enemies[i];
            if (e === k || e.dead) continue;
            if (Math.hypot(e.x + TILE / 2 - c.x, e.y + TILE / 2 - c.y) < R) {
                e.dead = true; explodeBig(e.x + TILE / 2, e.y + TILE / 2);
            }
        }
        for (let i = 0; i < this.mode; i++) {
            const p = this.players[i];
            if (!p || p.dead) continue;
            if (Math.hypot(p.x + TILE / 2 - c.x, p.y + TILE / 2 - c.y) < R) this.killPlayer(p);
        }
        this.checkWin();
    },
    shellExplosion(x, y, R, hurtPlayers, hurtEnemies) {
        explodeBig(x, y);
        const x0 = Math.max(0, Math.floor((x - R) / TILE)), x1 = Math.min(COLS - 1, Math.floor((x + R) / TILE));
        const y0 = Math.max(0, Math.floor((y - R) / TILE)), y1 = Math.min(ROWS - 1, Math.floor((y + R) / TILE));
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
            const tt = this.grid[ty][tx];
            if (tt === T.BRICK || tt === T.CONCRETE) {
                const tcx = tx * TILE + TILE / 2, tcy = ty * TILE + TILE / 2;
                if (Math.hypot(tcx - x, tcy - y) <= R) {
                    this.grid[ty][tx] = T.EMPTY;
                    if (this.brickHp) this.brickHp[ty][tx] = 0;
                    brickShatter(tcx, tcy, false);
                }
            }
        }
        if (hurtPlayers) {
            for (let i = 0; i < this.mode; i++) {
                const p = this.players[i];
                if (!p || p.dead || p.spawnTimer > 0 || p.shieldTimer > 0) continue;
                if (Math.hypot(p.x + TILE / 2 - x, p.y + TILE / 2 - y) <= R) {
                    const res = p.hit();
                    if (res === 2) this.killPlayer(p);
                }
            }
        }
        if (hurtEnemies) {
            for (let i = 0; i < this.enemies.length; i++) {
                const e = this.enemies[i];
                if (e.dead || e.spawnTimer > 0) continue;
                if (Math.hypot(e.x + TILE / 2 - x, e.y + TILE / 2 - y) <= R) {
                    const res = e.hit();
                    if (res === 2) { e.dead = true; explodeBig(e.x + TILE / 2, e.y + TILE / 2); this.killStats[e.type] = (this.killStats[e.type] || 0) + 1; }
                }
            }
        }
    },
    matkaSpawn(m) {
        let alive = 0;
        for (let i = 0; i < this.enemies.length; i++) if (!this.enemies[i].dead) alive++;
        if (alive >= 18) return;
        const mtx = Math.floor((m.x + TILE / 2) / TILE), mty = Math.floor((m.y + TILE / 2) / TILE);
        const types = ['basic', 'fast', 'power', 'armor', 'stealth', 'kamikaze'];
        const type = types[randInt(0, types.length - 1)];
        const spots = [[mtx, mty - 1], [mtx, mty + 1], [mtx - 1, mty], [mtx + 1, mty]];
        for (let i = 0; i < spots.length; i++) {
            const tx = spots[i][0], ty = spots[i][1];
            if (tx < 1 || ty < 1 || tx >= COLS - 1 || ty >= ROWS - 1) continue;
            if (!this.isTileFree(tx, ty)) continue;
            const e = new Tank(tx * TILE, ty * TILE, 2, false, type, -1);
            e.flash = false; e.forceStar = false;
            this.enemies.push(e);
            addRing(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#a8c86a', 0);
            Sound.spawn();
            return;
        }
    },
    isTileFree(tx, ty) {
        if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return false;
        const t = this.grid[ty][tx];
        if (t === T.BRICK || t === T.CONCRETE || t === T.STEEL || t === T.WATER || t === T.BASE || t === T.BASE_DEAD) return false;
        const r = {x: tx * TILE, y: ty * TILE, w: TILE, h: TILE};
        const tanks = this.allTanks();
        for (let i = 0; i < tanks.length; i++) if (rectsOverlap(r, tanks[i].rect())) return false;
        return true;
    },
    forceClearTile(tx, ty) {
        if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return;
        const t = this.grid[ty][tx];
        if (t !== T.EMPTY && t !== T.BASE && t !== T.BASE_DEAD) {
            this.grid[ty][tx] = T.EMPTY;
            if (this.brickHp) this.brickHp[ty][tx] = 0;
        }
    },
    maxOnScreen() { return Math.min(3 + Math.floor(this.level / 4), 6); },
    trySpawnEnemy() {
        if (this.enemyQueue.length === 0) return;
        let alive = 0;
        for (let i = 0; i < this.enemies.length; i++) if (!this.enemies[i].dead) alive++;
        if (alive >= this.maxOnScreen()) return;
        for (let i = 0; i < SPAWN_POINTS.length; i++) {
            const idx = (this.spawnIdx + i) % SPAWN_POINTS.length;
            const tx = SPAWN_POINTS[idx][0], ty = SPAWN_POINTS[idx][1];
            if (!this.isTileFree(tx, ty)) continue;
            const info = this.enemyQueue.shift();
            const e = new Tank(tx * TILE, ty * TILE, 2, false, info.type, -1);
            e.flash = info.flash; e.forceStar = info.forceStar;
            this.enemies.push(e);
            this.spawnIdx = idx + 1;
            Sound.spawn();
            return;
        }
    },
    damageBrick(tx, ty) {
        if (!this.brickHp) { this.grid[ty][tx] = T.EMPTY; return true; }
        const hp = (this.brickHp[ty][tx] || 1) - 1;
        if (hp <= 0) { this.grid[ty][tx] = T.EMPTY; this.brickHp[ty][tx] = 0; return true; }
        this.brickHp[ty][tx] = hp;
        return false;
    },
    toggleMode(p) {
        if (!p || p.dead || p.spawnTimer > 0 || p.buildT > 0 || p.frozen > 0) return;
        p.mode = (p.mode === 'tank') ? 'dig' : 'tank';
        Sound.modeSwitch();
        const c = p.center();
        burst(c.x, c.y, 16, ['#ffd040', '#ffffff', '#e8a020'], 50, 220, 2, 5, 0);
        addRing(c.x, c.y, '#ffd040', 0);
        addFloater(c.x, c.y - 26, p.mode === 'dig' ? 'ЭКСКАВАТОР' : 'ТАНК', '#ffd040');
    },
    frontTile(tank) {
        const v = DIRS[tank.dir];
        const c = tank.center();
        return {tx: Math.floor((c.x + v.x * TILE) / TILE), ty: Math.floor((c.y + v.y * TILE) / TILE)};
    },
    startBuild(tank) {
        if (tank.buildT > 0 || tank.cooldown > 0 || tank.frozen > 0) return;
        if (tank.mode !== 'dig') return;
        const c = tank.center();
        const fail = (msg) => { tank.cooldown = 0.55; addFloater(c.x, c.y - 26, msg, '#ff8090'); Sound.buildFail(); };
        const f = this.frontTile(tank);
        if (f.tx < 0 || f.ty < 0 || f.tx >= COLS || f.ty >= ROWS) { fail('НЕТ МЕСТА'); return; }
        if (this.grid[f.ty][f.tx] !== T.EMPTY) { fail('НУЖНА ПУСТОТА'); return; }
        const r = {x: f.tx * TILE, y: f.ty * TILE, w: TILE, h: TILE};
        const tanks = this.allTanks();
        for (let i = 0; i < tanks.length; i++) if (rectsOverlap(r, tanks[i].rect())) { fail('ЗАНЯТО ТАНКОМ'); return; }
        tank.buildT = BUILD_TIME; tank.buildTotal = BUILD_TIME;
        tank.buildTile = {tx: f.tx, ty: f.ty};
        tank.cooldown = 0;
        Sound.digStart(); addFloater(c.x, c.y - 26, 'ЛЬЁМ БЕТОН 4 СЕК...', '#c0c8ce');
    },
    buildFx(tank, dt) {
        if (!tank.buildTile) return;
        const v = DIRS[tank.dir];
        const c = tank.center();
        const fx = c.x + v.x * 24, fy = c.y + v.y * 24;
        if (Math.random() < 0.75) buildDust(fx, fy, 'rgba(160,170,180,0.55)');
        if (Math.random() < 0.22) sparks(fx + rand(-8, 8), fy + rand(-8, 8));
        if (Math.random() < 0.03) Sound.sand();
    },
    finishBuild(tank) {
        const bt = tank.buildTile;
        tank.buildT = 0; tank.buildTile = null; tank.cooldown = 0.35;
        const c = tank.center();
        if (!bt) return;
        let ok = (bt.tx >= 0 && bt.ty >= 0 && bt.tx < COLS && bt.ty < ROWS);
        if (ok && this.grid[bt.ty][bt.tx] !== T.EMPTY) ok = false;
        if (ok) {
            const r = {x: bt.tx * TILE, y: bt.ty * TILE, w: TILE, h: TILE};
            const tanks = this.allTanks();
            for (let i = 0; i < tanks.length; i++) if (rectsOverlap(r, tanks[i].rect())) { ok = false; break; }
        }
        const px = bt.tx * TILE + TILE / 2, py = bt.ty * TILE + TILE / 2;
        if (!ok) { addFloater(c.x, c.y - 26, 'НЕ ВЫШЛО', '#ff8090'); Sound.buildFail(); return; }
        this.grid[bt.ty][bt.tx] = T.CONCRETE;
        if (this.brickHp) this.brickHp[bt.ty][bt.tx] = CONCRETE_HP;
        burst(px, py, 20, ['#c0c8ce', '#9aa2a8', '#ffffff'], 50, 200, 2, 6, 140);
        addRing(px, py, '#c0c8ce', 0);
        addFloater(px, py - 16, '+БЕТОН', '#c0c8ce');
        Sound.buildDone();
    },
    resolveBulletHits() {
        const B = this.bullets;
        for (let i = 0; i < B.length; i++) {
            const a = B[i];
            if (a.dead) continue;
            for (let j = i + 1; j < B.length; j++) {
                const b = B[j];
                if (b.dead) continue;
                if (a.side === b.side) continue;
                if (rectsOverlap(a.hitRect(), b.hitRect())) {
                    a.dead = true; b.dead = true;
                    bulletPop((a.x + b.x) / 2 + 4, (a.y + b.y) / 2 + 4);
                    break;
                }
            }
        }
    },
    onEnemyKilled(e) {
        const st = ENEMY_TYPES[e.type] || ENEMY_TYPES.basic;
        this.score += st.score;
        this.killStats[e.type] = (this.killStats[e.type] || 0) + 1;
        const c = e.center();
        if (e.type === 'boss') {
            this.bossesKilled++;
            explodeBig(c.x, c.y);
            explodeBig(c.x + rand(-30, 30), c.y + rand(-30, 30));
            explodeBig(c.x + rand(-30, 30), c.y + rand(-30, 30));
            addFloater(c.x, c.y - 30, 'БОСС ПОВЕРЖЕН! +' + st.score, '#ffd040');
            Sound.bossDeath();
            this.checkWin();
            return;
        }
        explodeBig(c.x, c.y);
        addFloater(c.x, c.y - 20, '+' + st.score, '#fff060');
        if (e.forceStar && this.starsDropped < this.starsNeeded) this.dropPowerUp('star');
        else if (e.flash) this.dropPowerUp(null);
        this.checkWin();
    },
    dropPowerUp(forcedType) {
        for (let i = 0; i < 300; i++) {
            const x = randInt(0, COLS - 1), y = randInt(0, ROWS - 1);
            const t = this.grid[y][x];
            if (t === T.EMPTY || t === T.TREE || t === T.SAND) {
                let type = forcedType;
                if (!type) {
                    const types = Object.keys(POWERUPS);
                    type = types[randInt(0, types.length - 1)];
                    if (type === 'gun' && Math.random() < 0.8) type = types[randInt(0, types.length - 2)];
                }
                this.powerups.push(new PowerUp(x * TILE, y * TILE, type));
                addRing(x * TILE + 24, y * TILE + 24, '#ffffff', 0);
                if (type === 'star') this.starsDropped++;
                return true;
            }
        }
        return false;
    },
    applyPowerUp(pu, player) {
        const pi = clamp(player.playerIndex, 0, 1);
        const c = player.center();
        addFloater(c.x, c.y - 24, POWERUPS[pu.type].name, POWERUPS[pu.type].color);
        burst(c.x, c.y, 26, ['#ffffff', POWERUPS[pu.type].color], 60, 270, 2, 6, 0);
        switch (pu.type) {
            case 'star': {
                const before = this.playerPower[pi];
                if (before >= MAX_POWER) { addFloater(c.x, c.y - 42, 'МАКСИМУМ ЗВЁЗД', '#8a90b8'); break; }
                this.playerPower[pi] = before + 1;
                player.maxHp = PLAYER_HP[this.playerPower[pi]];
                player.hp = player.maxHp;
                const msgs = [null, 'СКОРОСТРЕЛЬНОСТЬ ×3!', 'ТРИ ДУЛА!', 'БРОНЯ!', 'ВЕЗДЕХОД + ПРОБИТИЕ СТАЛИ!', 'ПУЛЕМЁТ + МИНЫ!'];
                addFloater(c.x, c.y - 42, msgs[this.playerPower[pi]], this.playerPower[pi] >= MAX_POWER ? '#ff7040' : '#ffd700');
                Sound.upgrade(); addRing(c.x, c.y, '#ffd700', 0);
                break;
            }
            case 'gun': {
                this.playerPower[pi] = MAX_POWER;
                player.maxHp = PLAYER_HP[MAX_POWER];
                player.hp = player.maxHp;
                addFloater(c.x, c.y - 42, 'ВСЕ 5 ЗВЁЗД!', '#7fe0ff');
                addFloater(c.x, c.y - 58, 'ПУЛЕМЁТ + МИНЫ + БРОНЯ + ВЕЗДЕХОД', '#7fe0ff');
                Sound.upgrade(); addRing(c.x, c.y, '#7fe0ff', 0); addRing(c.x, c.y, '#ffffff', 0.1);
                break;
            }
            case 'grenade':
                Sound.powerup();
                for (let i = 0; i < this.enemies.length; i++) {
                    const e = this.enemies[i];
                    if (e.dead || e.spawnTimer > 0) continue;
                    const ec = e.center();
                    if (e.type === 'boss') {
                        const dmg = Math.max(2, Math.round(e.maxHp * 0.1));
                        e.hp = Math.max(1, e.hp - dmg); e.hitFlash = 0.3;
                        explodeSmall(ec.x, ec.y);
                        addFloater(ec.x, ec.y - 20, '-' + dmg, '#ff8090');
                    } else {
                        e.dead = true;
                        const st = ENEMY_TYPES[e.type] || ENEMY_TYPES.basic;
                        this.score += st.score;
                        this.killStats[e.type] = (this.killStats[e.type] || 0) + 1;
                        explodeBig(ec.x, ec.y);
                    }
                }
                this.checkWin();
                break;
            case 'helmet': Sound.powerup(); player.shieldTimer = 10; break;
            case 'shovel':
                Sound.armorUp();
                this.baseFortified = true;
                FORT.forEach(q => { if (this.grid[q[1]][q[0]] !== T.BASE) this.grid[q[1]][q[0]] = T.STEEL; });
                addFloater(6 * TILE + 24, 11 * TILE, 'ВЕЧНАЯ СТАЛЬ', '#e6e9f4');
                burst(6 * TILE + 24, 11 * TILE + 24, 26, ['#e6e9f4', '#9aa0b4', '#ffffff'], 60, 260, 2, 6, 120);
                addRing(6 * TILE + 24, 11 * TILE + 24, '#e6e9f4', 0);
                break;
            case 'baseshield':
                Sound.armorUp();
                this.baseArmor = BASE_SHIELD_HITS;
                shieldBurst(6 * TILE + 24, 12 * TILE + 24);
                addFloater(6 * TILE + 24, 12 * TILE - 4, 'ЩИТ БАЗЫ +5', '#60e0ff');
                break;
            case 'tank':
                this.lives[pi]++; Sound.life();
                addFloater(c.x, c.y - 42, '+1 ЖИЗНЬ', '#50e050');
                break;
            case 'clock': Sound.powerup(); this.freezeTimer = 8; break;
        }
    },
    killPlayer(p) {
        if (this.state !== 'playing') return;
        if (!p || p.deathHandled) return;
        p.deathHandled = true; p.dead = true;
        p.mode = 'tank'; p.buildT = 0; p.buildTile = null;
        const pi = clamp(p.playerIndex, 0, 1);
        const c = p.center();
        explodeBig(c.x, c.y);
        this.lives[pi]--;
        this.playerPower[pi] = 0;
        if (this.lives[pi] > 0) {
            this.respawnT[pi] = 1.4; this.respawnTries[pi] = 0;
            addFloater(c.x, c.y - 26, 'ИГРОК ' + (pi + 1) + ': -1 ЖИЗНЬ', '#ff8090');
        } else {
            addFloater(c.x, c.y - 26, 'ИГРОК ' + (pi + 1) + ' ВЫБЫЛ', '#ff4040');
        }
        if (this.allPlayersOut()) this.gameOverT = 1.8;
    },
    hitBase() {
        if (this.state !== 'playing' || !this.baseAlive) return;
        const bx = 6 * TILE + 24, by = 12 * TILE + 24;
        if (this.baseArmor > 0) {
            this.baseArmor--;
            shieldBurst(bx, by); Sound.shieldHit();
            addFloater(bx, by - 24, this.baseArmor > 0 ? 'ЩИТ ' + this.baseArmor : 'ЩИТ ПРОБИТ!', this.baseArmor > 0 ? '#60e0ff' : '#ff8090');
            return;
        }
        this.baseHp--;
        burst(bx, by, 14, ['#ff5020', '#ffd040'], 70, 260, 2, 6, 200);
        addRing(bx, by, '#ff8040', 0);
        Sound.hitArmor();
        if (this.baseHp <= 0) { this.destroyBase(); return; }
        addFloater(bx, by - 24, 'БАЗА ' + this.baseHp + '/' + BASE_MAX_HP, '#ffb060');
    },
    destroyBase() {
        if (this.state !== 'playing' || !this.baseAlive) return;
        this.baseAlive = false;
        this.grid[12][6] = T.BASE_DEAD;
        explodeBig(6 * TILE + 24, 12 * TILE + 24);
        explodeBig(6 * TILE + 24, 12 * TILE + 8);
        this.gameOverT = 2.0;
    },
    checkWin() {
        if (this.state !== 'playing' || this.gameOverT > 0) return;
        let alive = false;
        for (let i = 0; i < this.enemies.length; i++) if (!this.enemies[i].dead) { alive = true; break; }
        if (alive || this.enemyQueue.length > 0) return;
        let guard = 0;
        while (this.starsDropped < this.starsNeeded && guard++ < 8) { if (!this.dropPowerUp('star')) break; }
        if (!this.levelClearPending) { this.levelClearPending = true; this.clearT = LEVEL_END_DELAY; }
    },
    saveHiScore() {
        try { if (this.score > this.hiScore) { this.hiScore = this.score; localStorage.setItem('tanks8_hi', String(this.hiScore)); } } catch (e) {}
    },
    update(dt) {
        if (UI.msgT > 0) UI.msgT -= dt;
        if (UI.active) return;
        updateParticles(dt);
        if (this.state === 'playing') {
            Music.update();
            this.updatePlaying(dt, false);
        } else if (this.state === 'levelclear') {
            this.updatePlaying(dt, true);
            this.transitionT -= dt;
            if (this.transitionT <= 0) {
                if (this.level >= MAX_LEVEL) { this.state = 'victory'; this.saveHiScore(); Music.stop(); Sound.victory(); }
                else { this.level++; this.state = 'playing'; this.startLevel(); }
            }
        } else if (this.state === 'gameover') {
            this.updatePlaying(dt, true);
        }
    },
    updatePlaying(dt, passive) {
        if (this.levelIntroT > 0) this.levelIntroT -= dt;
        if (this.freezeTimer > 0) this.freezeTimer = Math.max(0, this.freezeTimer - dt);
        if (this.bossAlertT > 0) this.bossAlertT = Math.max(0, this.bossAlertT - dt);
        if (this.levelClearPending) {
            this.clearT -= dt;
            if (this.clearT <= 0) {
                this.levelClearPending = false; this.state = 'levelclear'; this.transitionT = 5.8;
                this.score += 500; this.saveHiScore(); Music.stop(); Sound.levelClear();
            }
        }
        if (!passive) for (let i = 0; i < this.mode; i++) { const p = this.players[i]; if (p && !p.dead) p.updatePlayer(dt, this); }
        if (!passive) for (let i = 0; i < this.mode; i++) {
            if (this.players[i] && this.players[i].dead && this.respawnT[i] > 0 && this.lives[i] > 0) {
                this.respawnT[i] -= dt;
                if (this.respawnT[i] <= 0) {
                    const sp = PLAYER_SPAWNS[i];
                    this.respawnTries[i]++;
                    if (this.isTileFree(sp[0], sp[1])) this.spawnPlayer(i, false);
                    else if (this.respawnTries[i] > 14) { this.forceClearTile(sp[0], sp[1]); this.spawnPlayer(i, false); }
                    else this.respawnT[i] = 0.2;
                }
            }
        }
        if (this.gameOverT > 0) {
            this.gameOverT -= dt;
            if (this.gameOverT <= 0 && this.state !== 'gameover') {
                this.state = 'gameover'; this.saveHiScore(); Music.stop(); Sound.gameOver();
            }
        }
        if (!passive && !this.levelClearPending) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) { this.trySpawnEnemy(); this.spawnTimer = Math.max(2.4 - this.level * 0.03, 1.0); }
        }
        if (!passive) for (let i = 0; i < this.enemies.length; i++) { const e = this.enemies[i]; if (!e.dead) e.updateEnemy(dt, this); }
        for (let i = 0; i < this.bullets.length; i++) { const b = this.bullets[i]; if (!b.dead) b.update(dt, this); }
        this.resolveBulletHits();
        this.bullets = this.bullets.filter(b => !b.dead);
        this.enemies = this.enemies.filter(e => !e.dead);
        if (!passive) {
            for (let i = this.mines.length - 1; i >= 0; i--) {
                const m = this.mines[i]; m.t += dt;
                const mr = {x: m.x - 15, y: m.y - 15, w: 30, h: 30};
                let hit = null;
                for (let j = 0; j < this.enemies.length; j++) {
                    const e = this.enemies[j];
                    if (e.dead || e.spawnTimer > 0) continue;
                    if (rectsOverlap(mr, e.rect())) { hit = e; break; }
                }
                if (hit) {
                    this.mines.splice(i, 1);
                    addFloater(m.x, m.y - 24, 'МИНА!', '#ff9040');
                    Sound.boomBig();
                    this.onEnemyKilled(hit);
                }
            }
        }
        for (let i = 0; i < this.powerups.length; i++) {
            const pu = this.powerups[i];
            pu.update(dt);
            if (pu.dead || passive) continue;
            for (let k = 0; k < this.mode; k++) {
                const p = this.players[k];
                if (!p || p.dead || p.spawnTimer > 0) continue;
                if (rectsOverlap(pu.rect(), p.rect())) { pu.dead = true; this.applyPowerUp(pu, p); break; }
            }
        }
        this.powerups = this.powerups.filter(p => !p.dead);
    }
};