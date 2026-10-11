"use strict";

// Базовые настройки сетки и экрана
const TILE = 48, COLS = 13, ROWS = 13;
const FIELD_X = 10, FIELD_Y = 10;
const FIELD_W = COLS * TILE, FIELD_H = ROWS * TILE;
const PANEL_X = FIELD_X + FIELD_W + 8, PANEL_W = 146;
const CANVAS_W = 792, CANVAS_H = 644;
const MAX_LEVEL = 50;

// Направления (Вверх, Вправо, Вниз, Влево)
const DIRS = [{x:0,y:-1}, {x:1,y:0}, {x:0,y:1}, {x:-1,y:0}];

// Типы тайлов
const T = {EMPTY:0, BRICK:1, STEEL:2, WATER:3, TREE:4, BASE:5, BASE_DEAD:6, SAND:7, CONCRETE:8};

// Игровой баланс
const BRICK_HP = 2;
const CONCRETE_HP = 6;
const SAND_SLOW = 1/3;
const MUZZLE_DIST = 26;
const TANK_INSET = 4;
const BUILD_TIME = 4;
const BASE_SHIELD_HITS = 5;
const BASE_MAX_HP = 20;
const TURRET_MAX_HP = 30;
const BONUS_DROP_CHANCE = 0.3125;
const CLASSIC_THEME_CHANCE = 0.22;
const TELEPORT_COOLDOWN = 2.5;
const MATKA_INTERVAL = 5;
const MAX_MINES = 5;
const MINE_COOLDOWN = 0.7;
const LEVEL_END_DELAY = 5;
const BOSS_HP = 20;

const isBossLevel = l => (l % 5 === 0);

// Характеристики врагов
const ENEMY_TYPES = {
    basic:   {speed:72,  hp:1,  score:100,  cool:1.5,  bulletSpeed:159, salvo:1, barrels:[0],       name:'ОБЫЧНЫЙ',     body:'#cfd2dc', dark:'#8b8ea0', light:'#ffffff', tread:'#4a4d5c'},
    fast:    {speed:145, hp:1,  score:200,  cool:1.2,  bulletSpeed:180, salvo:1, barrels:[0],       name:'БЫСТРЫЙ',     body:'#6ec6ff', dark:'#3a7fb0', light:'#d8f4ff', tread:'#2c5a78'},
    power:   {speed:80,  hp:3,  score:300,  cool:0.95, bulletSpeed:180, salvo:2, barrels:[-5,5],    name:'СИЛЬНЫЙ',     body:'#8be06a', dark:'#4d9440', light:'#e0ffd0', tread:'#33582c'},
    armor:   {speed:56,  hp:4,  score:400,  cool:1.1,  bulletSpeed:168, salvo:2, barrels:[-5.5,5.5],name:'БРОНЯ',       body:'#f09060', dark:'#a04c28', light:'#ffe0c0', tread:'#5c3a22'},
    stealth: {speed:105, hp:1,  score:300,  cool:1.3,  bulletSpeed:168, salvo:1, barrels:[0],       name:'НЕВИДИМКА',   body:'#9a8fd0', dark:'#4a3f78', light:'#e8e0ff', tread:'#241f48'},
    matka:   {speed:45,  hp:5,  score:500,  cool:1.4,  bulletSpeed:150, salvo:2, barrels:[-5,5],    name:'МАТКА',       body:'#a8c86a', dark:'#5c7a34', light:'#e8ffc8', tread:'#3a4c20'},
    freezer: {speed:70,  hp:2,  score:300,  cool:2.2,  bulletSpeed:160, salvo:1, barrels:[0],       name:'МОРОЗ',       body:'#7fd4ff', dark:'#2a7fb0', light:'#e8ffff', tread:'#1c4c68'},
    kamikaze:{speed:120, hp:1,  score:300,  cool:9,    bulletSpeed:0,   salvo:0, barrels:[0],       name:'КАМИКАДЗЕ',   body:'#ff5040', dark:'#8a1810', light:'#ffd0a0', tread:'#4c1410'},
    breaker: {speed:42,  hp:20, score:1000, cool:3.0,  bulletSpeed:150, salvo:1, barrels:[0],       name:'РАЗРУШИТЕЛЬ', body:'#6e5a7e', dark:'#3a2c46', light:'#d8c8e8', tread:'#241a2c'},
    boss:    {speed:55,  hp:20, score:3000, cool:1.0,  bulletSpeed:200, salvo:3, barrels:[-8,0,8],  name:'БОСС',        body:'#c02040', dark:'#3a0a14', light:'#ff8090', tread:'#1c060c'}
};

const ENEMY_CAP = {basic:1, fast:1, power:2, armor:2, stealth:1, matka:2, freezer:1, kamikaze:0, breaker:1, boss:3};

// Характеристики игрока в зависимости от уровня прокачки (звезд)
const PLAYER_SPEEDS       = [150, 168, 184, 198, 202, 206];
const PLAYER_BULLET_SPEED = [276, 296, 316, 336, 340, 348];
const PLAYER_SALVO        = [1, 1, 3, 3, 3, 5];
const PLAYER_BARRELS      = {1:[0], 2:[-5,5], 3:[-8,0,8], 5:[-10,-5,0,5,10]};
const PLAYER_COOLDOWN     = [0.30, 0.10, 0.10, 0.10, 0.10, 0.10];
const PLAYER_HP           = [1, 1, 1, 3, 3, 4];
const MAX_POWER = 5;

// Палитры игроков
const P1_PALETTES = [
    {body:'#f0d030', dark:'#a89020', light:'#fff8b0', tread:'#6a6020'},
    {body:'#ff9a30', dark:'#b05c14', light:'#ffe0b0', tread:'#704010'},
    {body:'#ff5a4a', dark:'#a02820', light:'#ffc8b8', tread:'#6a1a14'},
    {body:'#60e8ff', dark:'#1e8ec0', light:'#e8ffff', tread:'#145a78', aura:'#60e8ff'},
    {body:'#7fa8ff', dark:'#2f4fa8', light:'#dce8ff', tread:'#22345c', aura:'#7fa8ff'},
    {body:'#c88cff', dark:'#6c34b0', light:'#f0dcff', tread:'#3c2260', aura:'#c88cff'},
    {body:'#ffe070', dark:'#c89020', light:'#fffbe0', tread:'#7a5a14', aura:'#fff0a0'},
    {body:'#e8f4ff', dark:'#6a86a8', light:'#ffffff', tread:'#3c4c60', aura:'#a8ffd8'}
];

const P2_PALETTES = [
    {body:'#60d060', dark:'#2a8a2a', light:'#d8ffd8', tread:'#1c5c1c'},
    {body:'#40c8c8', dark:'#1a8080', light:'#c8ffff', tread:'#125858'},
    {body:'#a0e040', dark:'#5c9020', light:'#e8ffc8', tread:'#345c14'},
    {body:'#ff70c0', dark:'#b03080', light:'#ffd8f0', tread:'#701c50', aura:'#ff70c0'},
    {body:'#60f0a0', dark:'#209858', light:'#d8fff0', tread:'#145c34', aura:'#60f0a0'},
    {body:'#a0c0ff', dark:'#4060c0', light:'#e8f0ff', tread:'#283c78', aura:'#a0c0ff'},
    {body:'#f4f4ff', dark:'#9098b0', light:'#ffffff', tread:'#5a6070', aura:'#ffffff'},
    {body:'#ffeef4', dark:'#a86a80', light:'#ffffff', tread:'#604050', aura:'#ffa8d8'}
];

const PLAYER_TAG = ['#f0d030', '#60d060'];
const EXCAVATOR_PAL = {body:'#e8a020', dark:'#8c5a10', light:'#ffd870', tread:'#4a3a18'};

// Бонусы
const POWERUPS = {
    star:       {name:'ЗВЕЗДА',       color:'#ffd700'},
    grenade:    {name:'ГРАНАТА',      color:'#ff5050'},
    helmet:     {name:'ЩИТ ТАНКА',    color:'#60c0ff'},
    shovel:     {name:'ВЕЧНАЯ СТАЛЬ', color:'#c0c0c0'},
    baseshield: {name:'ЩИТ БАЗЫ x5',  color:'#60e0ff'},
    tank:       {name:'ЖИЗНЬ',        color:'#50e050'},
    clock:      {name:'ЗАМОРОЗКА',    color:'#a0f0ff'},
    gun:        {name:'ВСЕ 5 ЗВЁЗД',  color:'#ff6ec7'}
};

// Координаты спавна и базы
const FORT = [[5,11], [6,11], [7,11], [5,12], [7,12]];
const SPAWN_POINTS = [[0,0], [6,0], [12,0]];
const PLAYER_SPAWNS = [[4,12], [8,12]];

// Стили уровней
const STYLE_NAMES = ['КЛАССИКА', 'ТЕХНО', 'РУИНЫ', 'КРИСТАЛЛ', 'ДЕРЕВНЯ', 'ПЛАЗМА'];
const TILE_STYLE_COUNT = 6;