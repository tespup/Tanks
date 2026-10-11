"use strict";

function isPathTile(t) { return t === T.EMPTY || t === T.BRICK || t === T.TREE || t === T.SAND; }

function pickTileType(num) {
    const r = Math.random();
    const steelP = Math.min(0.07 + num * 0.0035, 0.16);
    const waterP = Math.min(0.06 + num * 0.0020, 0.11);
    const sandP = 0.10, treeP = 0.15;
    if (r < steelP) return T.STEEL;
    if (r < steelP + waterP) return T.WATER;
    if (r < steelP + waterP + sandP) return T.SAND;
    if (r < steelP + waterP + sandP + treeP) return T.TREE;
    return T.BRICK;
}

function buildGrid(num) {
    const g = [];
    for (let y = 0; y < ROWS; y++) g.push(new Array(COLS).fill(T.EMPTY));
    g[12][6] = T.BASE;
    FORT.forEach(p => { g[p[1]][p[0]] = T.BRICK; });
    
    const res = new Set();
    const reserve = (x, y) => { if (x >= 0 && x < COLS && y >= 0 && y < ROWS) res.add(y * COLS + x); };
    
    SPAWN_POINTS.forEach(p => reserve(p[0], p[1]));
    PLAYER_SPAWNS.forEach(p => { reserve(p[0], p[1]); reserve(p[0], p[1] - 1); reserve(p[0] - 1, p[1]); });
    reserve(9, 12);
    FORT.forEach(p => reserve(p[0], p[1]));
    reserve(6, 12);
    
    const clusters = 32 + Math.min(num * 2, 26);
    for (let i = 0; i < clusters; i++) {
        const type = pickTileType(num);
        const cx = randInt(0, COLS - 1), cy = randInt(0, ROWS - 1);
        const big = (type === T.TREE || type === T.SAND || type === T.BRICK);
        const size = big ? randInt(1, 3) : randInt(1, 2);
        const shape = Math.random() < 0.45 ? 'line' : 'block';
        
        for (let d = 0; d < size; d++) {
            const x = (shape === 'line') ? cx + d : cx + randInt(0, size - 1);
            const y = (shape === 'line') ? cy : cy + randInt(0, size - 1);
            if (x >= COLS || y >= ROWS) continue;
            if (res.has(y * COLS + x)) continue;
            if (g[y][x] !== T.EMPTY && Math.random() < 0.4) continue;
            g[y][x] = type;
        }
    }
    
    const extraP = Math.min(0.18 + num * 0.005, 0.30);
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (res.has(y * COLS + x)) continue;
            if (g[y][x] !== T.EMPTY) continue;
            const r = Math.random();
            if (r < extraP) g[y][x] = T.BRICK;
            else if (r < extraP + 0.05) g[y][x] = T.TREE;
            else if (r < extraP + 0.075) g[y][x] = T.SAND;
        }
    }
    
    const mustClear = [[0,0], [6,0], [12,0], [4,12], [4,11], [3,12], [8,12], [8,11], [9,12]];
    for (let i = 0; i < mustClear.length; i++) {
        const x = mustClear[i][0], y = mustClear[i][1];
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) continue;
        if (g[y][x] === T.BASE) continue;
        g[y][x] = T.EMPTY;
    }
    
    FORT.forEach(p => { g[p[1]][p[0]] = T.BRICK; });
    g[12][6] = T.BASE;
    return g;
}

function isConnected(g) {
    const seen = new Set();
    const q = [[PLAYER_SPAWNS[0][0], PLAYER_SPAWNS[0][1]]];
    seen.add(PLAYER_SPAWNS[0][1] * COLS + PLAYER_SPAWNS[0][0]);
    
    while (q.length) {
        const cur = q.pop(), x = cur[0], y = cur[1];
        for (let i = 0; i < DIRS.length; i++) {
            const nx = x + DIRS[i].x, ny = y + DIRS[i].y;
            if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
            const idx = ny * COLS + nx;
            if (seen.has(idx)) continue;
            if (!isPathTile(g[ny][nx])) continue;
            seen.add(idx); q.push([nx, ny]);
        }
    }
    return [[0,0], [6,0], [12,0], [5,12], [8,12]].every(p => seen.has(p[1] * COLS + p[0]));
}

function forcePaths(g) {
    const clearCell = (x, y, keepBrick) => {
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
        const t = g[y][x];
        if (t === T.BASE || t === T.BASE_DEAD) return;
        if (t === T.STEEL || t === T.WATER) g[y][x] = T.EMPTY;
        else if (!keepBrick && t === T.BRICK) g[y][x] = T.EMPTY;
    };
    
    for (let x = 0; x < COLS; x++) { clearCell(x, 0, true); clearCell(x, 6, true); }
    for (let y = 0; y < ROWS; y++) { clearCell(0, y, true); clearCell(4, y, true); clearCell(6, y, true); clearCell(8, y, true); clearCell(12, y, true); }
    
    clearCell(3, 12, false); clearCell(4, 11, false); clearCell(4, 12, false);
    clearCell(9, 12, false); clearCell(8, 11, false); clearCell(8, 12, false);
    SPAWN_POINTS.forEach(p => clearCell(p[0], p[1], false));
    
    FORT.forEach(p => { g[p[1]][p[0]] = T.BRICK; });
    g[12][6] = T.BASE;
}

function generateLevel(num) {
    for (let a = 0; a < 90; a++) {
        const g = buildGrid(num);
        if (isConnected(g)) return g;
    }
    const g = buildGrid(num);
    forcePaths(g);
    return g;
}

function buildBrickHp(grid) {
    const hp = [];
    for (let y = 0; y < ROWS; y++) {
        hp.push(new Array(COLS).fill(0));
        for (let x = 0; x < COLS; x++) if (grid[y][x] === T.BRICK) hp[y][x] = BRICK_HP;
    }
    return hp;
}

function buildEnemyQueue(num, starsNeeded) {
    const total = Math.min(12 + Math.floor(num * 0.5), 24);
    const q = [];
    const extraChance = (BONUS_DROP_CHANCE - 0.25) / 0.75;
    
    for (let i = 0; i < total; i++) {
        const pArmor = Math.min(0.04 + num * 0.006, 0.22);
        const pPower = Math.min(0.08 + num * 0.006, 0.22);
        const pFast  = Math.min(0.14 + num * 0.004, 0.24);
        const pStealth = Math.min(0.04 + num * 0.005, 0.16);
        const pFreezer = Math.min(0.03 + num * 0.004, 0.13);
        const pKami  = Math.min(0.05 + num * 0.005, 0.18);
        const pMatka = Math.min(0.02 + num * 0.002, 0.08);
        const pBreak = Math.min(0.02 + num * 0.004, 0.14);
        
        const r = Math.random();
        let type = 'basic';
        if (r < pArmor) type = 'armor';
        else if (r < pArmor + pPower) type = 'power';
        else if (r < pArmor + pPower + pFast) type = 'fast';
        else if (r < pArmor + pPower + pFast + pStealth) type = 'stealth';
        else if (r < pArmor + pPower + pFast + pStealth + pFreezer) type = 'freezer';
        else if (r < pArmor + pPower + pFast + pStealth + pFreezer + pKami) type = 'kamikaze';
        else if (r < pArmor + pPower + pFast + pStealth + pFreezer + pKami + pMatka) type = 'matka';
        else if (r < pArmor + pPower + pFast + pStealth + pFreezer + pKami + pMatka + pBreak) type = 'breaker';
        
        q.push({type: type, flash: (i % 4 === 3) || Math.random() < extraChance, forceStar: false});
    }
    
    for (let k = 0; k < starsNeeded; k++) {
        const idx = clamp(Math.floor(total * (k + 1) / (starsNeeded + 1)), 1, total - 1);
        if (q[idx]) { q[idx].forceStar = true; q[idx].flash = true; }
    }
    return q;
}