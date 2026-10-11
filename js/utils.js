"use strict";

// Математические функции
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);

// Проверка столкновений (AABB)
function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function pointInRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Работа с цветом
function hsl(h, s, l) {
    return 'hsl(' + ((((h % 360) + 360) % 360).toFixed(1)) + ',' + clamp(s, 0, 100).toFixed(1) + '%,' + clamp(l, 0, 100).toFixed(1) + '%)';
}

function hueFrom(r) {
    if (r[1] >= r[0]) return rand(r[0], r[1]);
    const span = (360 - r[0]) + r[1];
    return (r[0] + Math.random() * span) % 360;
}

// Отрисовка полигонов
function poly(g, cx, cy, r, sides, rot) {
    g.beginPath();
    for (let i = 0; i < sides; i++) {
        const a = rot + i * Math.PI * 2 / sides;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath();
    g.fill();
}

// Генератор псевдослучайных чисел на основе сида (Seed)
function rngFrom(seed) {
    let s = (seed >>> 0) || 1;
    return function() {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}