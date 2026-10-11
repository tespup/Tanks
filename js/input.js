"use strict";

const KEY_NAMES = {
    Space:'ПРОБЕЛ', Enter:'ENTER', NumpadEnter:'NUM ENTER', Escape:'ESC',
    ArrowUp:'СТРЕЛКА ВВЕРХ', ArrowDown:'СТРЕЛКА ВНИЗ', ArrowLeft:'СТРЕЛКА ВЛЕВО', ArrowRight:'СТРЕЛКА ВПРАВО',
    Period:'.', Comma:',', Slash:'/', Backslash:'\\', Semicolon:';', Quote:'"',
    BracketLeft:'[', BracketRight:']', Minus:'-', Equal:'=', Backquote:'`',
    Backspace:'BACKSPACE', Tab:'TAB', Delete:'DEL', Insert:'INS',
    Home:'HOME', End:'END', PageUp:'PGUP', PageDown:'PGDN', CapsLock:'CAPS',
    ShiftLeft:'L-SHIFT', ShiftRight:'R-SHIFT',
    ControlLeft:'L-CTRL', ControlRight:'R-CTRL', AltLeft:'L-ALT', AltRight:'R-ALT'
};

function keyName(code) {
    if (!code) return '—';
    if (KEY_NAMES[code]) return KEY_NAMES[code];
    if (code.indexOf('Key') === 0) return code.slice(3);
    if (code.indexOf('Digit') === 0) return code.slice(5);
    if (code.indexOf('Numpad') === 0) return 'NUM ' + code.slice(6);
    if (/^F\d{1,2}$/.test(code)) return code;
    return String(code).toUpperCase();
}

const FORBIDDEN_KEYS = ['Escape', 'Enter', 'NumpadEnter', 'Tab', 'F5', 'F11', 'F12'];

const DEFAULT_BINDS = [
    {up:'K:KeyW', down:'K:KeyS', left:'K:KeyA', right:'K:KeyD', fire:'K:Space', tele:'K:KeyX', dig:'K:KeyQ', mine:'K:KeyE'},
    {up:'K:ArrowUp', down:'K:ArrowDown', left:'K:ArrowLeft', right:'K:ArrowRight', fire:'K:Slash', tele:'K:ControlRight', dig:'K:ShiftRight', mine:'K:Period'}
];

let BINDS = [Object.assign({}, DEFAULT_BINDS[0]), Object.assign({}, DEFAULT_BINDS[1])];

const BIND_ACTIONS = [
    {key:'up', label:'ВВЕРХ'}, {key:'down', label:'ВНИЗ'},
    {key:'left', label:'ВЛЕВО'}, {key:'right', label:'ВПРАВО'},
    {key:'fire', label:'ОГОНЬ'},
    {key:'tele', label:'ТЕЛЕПОРТ (РЕСПАУН)'},
    {key:'dig', label:'ЭКСКАВАТОР'},
    {key:'mine', label:'МИНА'}
];

function saveBinds() {
    try { localStorage.setItem('tanks8_binds', JSON.stringify(BINDS)); } catch(e) {}
}

function loadBinds() {
    try {
        const s = localStorage.getItem('tanks8_binds');
        if (!s) return;
        const arr = JSON.parse(s);
        if (!Array.isArray(arr)) return;
        for (let i = 0; i < 2; i++) {
            if (!arr[i] || typeof arr[i] !== 'object') continue;
            for (let k = 0; k < BIND_ACTIONS.length; k++) {
                const a = BIND_ACTIONS[k];
                if (typeof arr[i][a.key] === 'string' && arr[i][a.key].length < 28) BINDS[i][a.key] = arr[i][a.key];
            }
        }
    } catch(e) {}
}

function resetBinds(i) {
    if (i === undefined || i === null) BINDS = [Object.assign({}, DEFAULT_BINDS[0]), Object.assign({}, DEFAULT_BINDS[1])];
    else BINDS[i] = Object.assign({}, DEFAULT_BINDS[i]);
    saveBinds();
}

function bindName(b) {
    if (!b) return '—';
    const p = String(b).split(':');
    if (p[0] === 'K') return keyName(p[1]);
    if (p[0] === 'P') {
        const g = 'ГЕЙМПАД' + ((parseInt(p[1], 10) || 0) + 1);
        if (p[2] === 'B') return g + ' КН' + p[3];
        if (p[2] === 'A') return g + ' ОСЬ' + ((parseInt(p[3], 10) || 0) + 1) + (p[4] === '-' ? ' −' : '+');
    }
    return String(b);
}

const keys = {};
const justPressed = {};
const pads = [];

// Состояние виртуального джойстика (наэкранные кнопки)
const vInput = { up: false, down: false, left: false, right: false, fire: false, dig: false, mine: false, tele: false };

// Инициализация сенсорных кнопок
window.addEventListener('DOMContentLoaded', () => {
    const dpad = document.getElementById('dpad-container');
    const actBtns = document.querySelectorAll('.act-btn');
    
    const resetDpad = () => {
        vInput.up = vInput.down = vInput.left = vInput.right = false;
        document.querySelectorAll('.dpad-btn').forEach(el => el.classList.remove('active'));
    };

    if (dpad) {
        const handleDpad = (e) => {
            e.preventDefault();
            resetDpad();
            // Поддержка скольжения пальцем по крестовине
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                if (el && el.classList.contains('dpad-btn')) {
                    const key = el.getAttribute('data-key');
                    if (key) {
                        vInput[key] = true;
                        el.classList.add('active');
                    }
                }
            }
        };
        dpad.addEventListener('touchstart', handleDpad, {passive: false});
        dpad.addEventListener('touchmove', handleDpad, {passive: false});
        dpad.addEventListener('touchend', resetDpad, {passive: false});
        dpad.addEventListener('touchcancel', resetDpad, {passive: false});
    }

    actBtns.forEach(btn => {
        btn.addEventListener('touchstart', e => {
            e.preventDefault();
            const key = btn.getAttribute('data-key');
            if (key) vInput[key] = true;
            btn.classList.add('active');
        }, {passive: false});
        
        const releaseBtn = e => {
            e.preventDefault();
            const key = btn.getAttribute('data-key');
            if (key) vInput[key] = false;
            btn.classList.remove('active');
        };
        
        btn.addEventListener('touchend', releaseBtn, {passive: false});
        btn.addEventListener('touchcancel', releaseBtn, {passive: false});
    });
});

function pollPads() {
    pads.length = 0;
    let list = null;
    try { if (navigator.getGamepads) list = navigator.getGamepads(); } catch(e) { list = null; }
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
        const gp = list[i];
        if (!gp || !gp.connected) { pads.push(null); continue; }
        const buttons = [];
        for (let b = 0; b < gp.buttons.length; b++) buttons.push(!!(gp.buttons[b].pressed || gp.buttons[b].value > 0.5));
        const axes = [];
        for (let a = 0; a < gp.axes.length; a++) axes.push(gp.axes[a] || 0);
        pads.push({buttons: buttons, axes: axes, id: gp.id || ''});
    }
}

function connectedPads() {
    let n = 0;
    for (let i = 0; i < pads.length; i++) if (pads[i]) n++;
    return n;
}

function bindingHeld(b) {
    if (!b) return false;
    const p = String(b).split(':');
    if (p[0] === 'K') return !!keys[p[1]];
    if (p[0] === 'P') {
        const gp = pads[parseInt(p[1], 10)];
        if (!gp) return false;
        if (p[2] === 'B') return !!gp.buttons[parseInt(p[3], 10)];
        if (p[2] === 'A') { const v = gp.axes[parseInt(p[3], 10)] || 0; return p[4] === '-' ? v < -0.45 : v > 0.45; }
    }
    return false;
}

function mkInputState() {
    return {
        dir: -1, fire: false, dig: false, digPrev: false, digEdge: false,
        mine: false, minePrev: false, mineEdge: false,
        tele: false, telePrev: false, teleEdge: false
    };
}

const Input = {
    st: [mkInputState(), mkInputState()],
    poll() {
        pollPads();
        for (let pi = 0; pi < 2; pi++) {
            const b = BINDS[pi] || DEFAULT_BINDS[pi], s = this.st[pi];
            let d = -1;
            // Добавляем проверку виртуального джойстика (vInput) для Игрока 1 (pi === 0)
            if (bindingHeld(b.up) || (pi === 0 && vInput.up)) d = 0;
            else if (bindingHeld(b.right) || (pi === 0 && vInput.right)) d = 1;
            else if (bindingHeld(b.down) || (pi === 0 && vInput.down)) d = 2;
            else if (bindingHeld(b.left) || (pi === 0 && vInput.left)) d = 3;
            s.dir = d;
            
            s.fire = bindingHeld(b.fire) || (pi === 0 && vInput.fire);
            
            const dg = bindingHeld(b.dig) || (pi === 0 && vInput.dig);
            s.dig = dg; s.digEdge = dg && !s.digPrev; s.digPrev = dg;
            
            const mn = bindingHeld(b.mine) || (pi === 0 && vInput.mine);
            s.mine = mn; s.mineEdge = mn && !s.minePrev; s.minePrev = mn;
            
            const tp = bindingHeld(b.tele) || (pi === 0 && vInput.tele);
            s.tele = tp; s.teleEdge = tp && !s.telePrev; s.telePrev = tp;
        }
    },
    reset() {
        for (let pi = 0; pi < 2; pi++) {
            const s = this.st[pi];
            s.dir = -1; s.fire = false; s.digEdge = false; s.mineEdge = false; s.teleEdge = false;
        }
    }
};

function scanPadInput() {
    for (let i = 0; i < pads.length; i++) {
        const gp = pads[i];
        if (!gp) continue;
        for (let b = 0; b < gp.buttons.length; b++) if (gp.buttons[b]) return 'P:' + i + ':B:' + b;
        for (let a = 0; a < gp.axes.length; a++) {
            const v = gp.axes[a] || 0;
            if (v > 0.65) return 'P:' + i + ':A:' + a + ':+';
            if (v < -0.65) return 'P:' + i + ':A:' + a + ':-';
        }
    }
    return null;
}

function padNeutral() {
    for (let i = 0; i < pads.length; i++) {
        const gp = pads[i];
        if (!gp) continue;
        for (let b = 0; b < gp.buttons.length; b++) if (gp.buttons[b]) return false;
        for (let a = 0; a < gp.axes.length; a++) if (Math.abs(gp.axes[a] || 0) > 0.4) return false;
    }
    return true;
}