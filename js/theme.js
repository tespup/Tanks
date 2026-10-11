"use strict";

const THEMES = [
    {name:'ТЁПЛЫЕ',    brick:[18,32],   steel:[32,46],   water:[196,212], tree:[62,92],   sand:[38,48],   bg:[24,34],   sat:0.40},
    {name:'ХОЛОДНЫЕ',  brick:[198,216], steel:[212,228], water:[214,232], tree:[162,186], sand:[192,206], bg:[216,230], sat:0.34},
    {name:'ГОРЯЧИЕ',   brick:[2,14],    steel:[348,6],   water:[276,296], tree:[38,54],   sand:[12,24],   bg:[354,6],   sat:0.48},
    {name:'ЛЕСНЫЕ',    brick:[78,98],   steel:[96,116],  water:[172,192], tree:[100,132], sand:[68,84],   bg:[96,112],  sat:0.32},
    {name:'ЗАКАТ',     brick:[316,336], steel:[276,296], water:[232,252], tree:[18,38],   sand:[330,346], bg:[286,302], sat:0.40},
    {name:'НЕОН',      brick:[176,196], steel:[290,312], water:[200,220], tree:[128,150], sand:[48,64],   bg:[250,266], sat:0.50},
    {name:'ПУСТЫННЫЕ', brick:[34,46],   steel:[40,54],   water:[186,202], tree:[64,80],   sand:[40,52],   bg:[36,46],   sat:0.36},
    {name:'СЕПИЯ',     brick:[28,38],   steel:[32,44],   water:[190,206], tree:[48,64],   sand:[32,42],   bg:[28,36],   sat:0.22},
    {name:'ЛАВАНДА',   brick:[266,282], steel:[250,266], water:[220,236], tree:[288,306], sand:[274,290], bg:[258,274], sat:0.30},
    {name:'МЯТНЫЕ',    brick:[154,172], steel:[170,186], water:[186,202], tree:[128,150], sand:[158,174], bg:[166,182], sat:0.28}
];

const CLASSIC_THEME = -1;

function makePalette(themeIdx) {
    const th = THEMES[((themeIdx % THEMES.length) + THEMES.length) % THEMES.length];
    const hb = hueFrom(th.brick), hs = hueFrom(th.steel), hw = hueFrom(th.water);
    const ht = hueFrom(th.tree),  hd = hueFrom(th.sand),  hg = hueFrom(th.bg);
    const sBase = clamp(th.sat + rand(-0.05, 0.05), 0.16, 0.56);
    const S = k => sBase * 100 * k;
    const accentH = hw + rand(-14, 14);
    
    return {
        name: th.name, themeIdx: themeIdx, classic: false,
        bg: hsl(hg, S(0.7), 7), bg2: hsl(hg, S(0.8), 11),
        frame: hsl(hg, S(0.5), 28), frameDark: hsl(hg, S(0.6), 15),
        panel: hsl(hs, S(0.55), 34), panelDark: hsl(hs, S(0.65), 21),
        brickMortar: hsl(hb, S(1.0), 13), brickDark: hsl(hb, S(1.15), 26),
        brickBase: hsl(hb, S(1.10), 42),  brickLight: hsl(hb, S(1.0), 58),
        brickShade: hsl(hb, S(1.2), 18),
        steelDark: hsl(hs, 12, 31), steelBase: hsl(hs, 14, 57),
        steelLight: hsl(hs, 17, 82), steelRivet: hsl(hs, 12, 22), steelShade: hsl(hs, 12, 19),
        waterDeep: hsl(hw, S(1.35), 21), waterMid: hsl(hw, S(1.4), 37),
        waterFoam: hsl(hw, S(1.2), 68), waterDark: hsl(hw, S(1.45), 13),
        treeDark: hsl(ht, S(1.0), 14), treeMid: hsl(ht, S(1.1), 26),
        treeLight: hsl(ht, S(1.15), 39), treeSpark: hsl(ht, S(1.2), 63), treeDeep: hsl(ht, S(1.0), 9),
        sandBase: hsl(hd, S(1.0), 56), sandDark: hsl(hd, S(1.0), 41),
        sandLight: hsl(hd, S(1.0), 74), sandSwirl: hsl(hd, S(0.9), 29), sandShade: hsl(hd, S(1.0), 31),
        baseG: hsl(hb + 18, S(1.2), 56), baseW: hsl(hb + 18, S(1.1), 83),
        baseD: hsl(hb + 18, S(1.2), 31), basePlate: hsl(hg, S(0.8), 17),
        accent: hsl(accentH, S(1.25), 60),
        brickDebris: [hsl(hb, S(1.1), 52), hsl(hb, S(1.15), 36), hsl(hb, S(1.05), 26), hsl(hb, S(1.0), 62), hsl(hb, S(1.2), 18)],
        steelDebris: [hsl(hs, 15, 74), hsl(hs, 14, 52), hsl(hs, 17, 86), hsl(hs, 12, 34)],
        dustCol: 'hsla(' + hb.toFixed(0) + ',' + Math.round(S(0.7)) + '%,46%,0.55)',
        sandCol: 'hsla(' + hd.toFixed(0) + ',' + Math.round(S(0.9)) + '%,66%,0.6)'
    };
}

function makeClassicPalette() {
    return {
        name: 'КЛАССИКА', themeIdx: CLASSIC_THEME, classic: true,
        bg: '#0c0c10', bg2: '#14141b',
        frame: '#3a3f5c', frameDark: '#22263a',
        panel: '#565a6e', panelDark: '#3c3f50',
        brickMortar: '#5e2410', brickDark: '#7a2e12', brickBase: '#a8401f',
        brickLight: '#c85a30', brickShade: '#3d1709',
        steelDark: '#565c70', steelBase: '#9aa0b4', steelLight: '#e6e9f4',
        steelRivet: '#525870', steelShade: '#33384a',
        waterDeep: '#143a8c', waterMid: '#1e56c0', waterFoam: '#4f8cff', waterDark: '#0c2458',
        treeDark: '#0f320f', treeMid: '#277a27', treeLight: '#369636', treeSpark: '#8cff8c', treeDeep: '#071a07',
        sandBase: '#c9a24c', sandDark: '#b78f3c', sandLight: '#e3c478', sandSwirl: '#6e5a1e', sandShade: '#8f7130',
        baseG: '#f8c820', baseW: '#fff2a0', baseD: '#b08010', basePlate: '#3a3620',
        accent: '#ffd700',
        brickDebris: ['#c85a30', '#a8401f', '#8a3312', '#d96b3f', '#7a2e12', '#e07a48'],
        steelDebris: ['#c3c8d8', '#9aa0b4', '#e6e9f4', '#767c92'],
        dustCol: 'rgba(160,116,84,0.55)',
        sandCol: 'rgba(226,196,120,0.6)'
    };
}

let PAL = null, TILE_STYLE = 0;
let BRICK_DEBRIS = ['#c85a30', '#a8401f', '#8a3312'];
let STEEL_DEBRIS = ['#c3c8d8', '#9aa0b4', '#767c92'];
let DUST_COL = 'rgba(160,116,84,0.55)', SAND_COL = 'rgba(226,196,120,0.6)';