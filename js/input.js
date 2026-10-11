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
    if (p[0] === 'V') {
        const names = {UP:'ЭКРАН ВВЕРХ', DOWN:'ЭКРАН ВНИЗ', LEFT:'ЭКРАН ВЛЕВО', RIGHT:'ЭКРАН ВПРАВО', FIRE:'ЭКРАН КН 1', DIG:'ЭКРАН КН 2', MINE:'ЭКРАН КН 3', TELE:'ЭКРАН КН 4'};
        return names[p[1]] || ('ЭКРАН ' + p[1]);
    }
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
const vInputState = { UP: false, DOWN: false, LEFT: false, RIGHT: false, FIRE: false, DIG: false, MINE: false, TELE: false };
const vInputJustPressed = { UP: false, DOWN: false, LEFT: false, RIGHT: false, FIRE: false, DIG: false, MINE: false, TELE: false };

function setVInput(key, val) {
    if (val && !vInputState[key]) vInputJustPressed[key] = true;
    vInputState[key] = val;
}

// Инициализация сенсорных кнопок с поддержкой скольжения (свайпов)
window.addEventListener('DOMContentLoaded', () => {
    const dpad = document.getElementById('dpad-container');
    const actBtns = document.querySelectorAll('.act-btn');

    if (dpad) {
        const handleDpad = (e) => {
            e.preventDefault();
            const rect = dpad.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            
            let up = false, down = false, left = false, right = false;
            
            for (let i = 0; i < e.touches.length; i++) {
                const t = e.touches[i];
                // Проверяем, находится ли палец в зоне крестовины (с небольшим запасом)
                if (t.clientX >= rect.left - 30 && t.clientX <= rect.right + 30 &&
                    t.clientY >= rect.top - 30 && t.clientY <= rect.bottom + 30) {
                    
                    const dx = t.clientX - cx;
                    const dy = t.clientY - cy;
                    const dist = Math.hypot(dx, dy);
                    
                    if (dist > 15) { // Мертвая зона в центре
                        const angle = Math.atan2(dy, dx);
                        // Определяем направление по углу (8 направлений)
                        if (angle > -Math.PI/8 && angle <= Math.PI/8) right = true;
                        else if (angle > Math.PI/8 && angle <= 3*Math.PI/8) { right = true; down = true; }
                        else if (angle > 3*Math.PI/8 && angle <= 5*Math.PI/8) down = true;
                        else if (angle > 5*Math.PI/8 && angle <= 7*Math.PI/8) { left = true; down = true; }
                        else if (angle > 7*Math.PI/8 || angle <= -7*Math.PI/8) left = true;
                        else if (angle > -7*Math.PI/8 && angle <= -5*Math.PI/8) { left = true; up = true; }
                        else if (angle > -5*Math.PI/8 && angle <= -3*Math.PI/8) up = true;
                        else if (angle > -3*Math.PI/8 && angle <= -Math.PI/8) { right = true; up = true; }
                    }
                }
            }
            
            setVInput('UP', up);
            setVInput('DOWN', down);
            setVInput('LEFT', left);
            setVInput('RIGHT', right);
            
            document.querySelector('.dpad-up').classList.toggle('active', up);
            document.querySelector('.dpad-down').classList.toggle('active', down);
            document.querySelector('.dpad-left').classList.toggle('active', left);
            document.querySelector('.dpad-right').classList.toggle('active', right);
        };
        
        dpad.addEventListener('touchstart', handleDpad, {passive: false});
        dpad.addEventListener('touchmove', handleDpad, {passive: false});
        dpad.addEventListener('touchend', handleDpad, {passive: false});
        dpad.addEventListener('touchcancel', handleDpad, {passive: false});
    }

    const keyMap = { fire: 'FIRE', dig: 'DIG', mine: 'MINE', tele: 'TELE' };
    actBtns.forEach(btn => {
        const key = keyMap[btn.getAttribute('data-key')];
        const press = e => {
            e.preventDefault();
            if (key) setVInput(key, true);
            btn.classList.add('active');
        };
        const release = e => {
            e.preventDefault();
            if (key) setVInput(key, false);
            btn.classList.remove('active');
        };
        btn.addEventListener('touchstart', press, {passive: false});
        btn.addEventListener('touchend', release, {passive: false});
        btn.addEventListener('touchcancel', release, {passive: false});
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
    if (p[0] === 'V') return !!vInputState[p[1]];
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
            
            // Если бинд совпадает с дефолтным (клавиатура), мы также разрешаем использовать виртуальные кнопки для Игрока 1.
            // Если игрок переназначил кнопку на что-то другое, виртуальная кнопка будет работать только если он назначил именно её.
            const up = bindingHeld(b.up) || (pi === 0 && vInputState.UP && b.up === DEFAULT_BINDS[0].up);
            const down = bindingHeld(b.down) || (pi === 0 && vInputState.DOWN && b.down === DEFAULT_BINDS[0].down);
            const left = bindingHeld(b.left) || (pi === 0 && vInputState.LEFT && b.left === DEFAULT_BINDS[0].left);
            const right = bindingHeld(b.right) || (pi === 0 && vInputState.RIGHT && b.right === DEFAULT_BINDS[0].right);
            
            if (up) d = 0;
            else if (right) d = 1;
            else if (down) d = 2;
            else if (left) d = 3;
            s.dir = d;
            
            s.fire = bindingHeld(b.fire) || (pi === 0 && vInputState.FIRE && b.fire === DEFAULT_BINDS[0].fire);
            
            const dg = bindingHeld(b.dig) || (pi === 0 && vInputState.DIG && b.dig === DEFAULT_BINDS[0].dig);
            s.dig = dg; s.digEdge = dg && !s.digPrev; s.digPrev = dg;
            
            const mn = bindingHeld(b.mine) || (pi === 0 && vInputState.MINE && b.mine === DEFAULT_BINDS[0].mine);
            s.mine = mn; s.mineEdge = mn && !s.minePrev; s.minePrev = mn;
            
            const tp = bindingHeld(b.tele) || (pi === 0 && vInputState.TELE && b.tele === DEFAULT_BINDS[0].tele);
            s.tele = tp; s.teleEdge = tp && !s.telePrev; s.telePrev = tp;
        }
    },
    reset() {
        for (let pi = 0; pi < 2; pi++) {
            const s = this.st[pi];
            s.dir = -1; s.fire = false; s.digEdge = false; s.mineEdge = false; s.teleEdge = false;
        }
    },
    clearJustPressed() {
        for (const k in vInputJustPressed) vInputJustPressed[k] = false;
    }
};

function scanPadInput() {
    // Сначала проверяем виртуальные кнопки
    for (const k in vInputJustPressed) {
        if (vInputJustPressed[k]) {
            vInputJustPressed[k] = false;
            return 'V:' + k;
        }
    }
    // Затем физические геймпады
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
    // Проверяем, что виртуальные кнопки отпущены
    for (const k in vInputState) if (vInputState[k]) return false;
    // Проверяем физические геймпады
    for (let i = 0; i < pads.length; i++) {
        const gp = pads[i];
        if (!gp) continue;
        for (let b = 0; b < gp.buttons.length; b++) if (gp.buttons[b]) return false;
        for (let a = 0; a < gp.axes.length; a++) if (Math.abs(gp.axes[a] || 0) > 0.4) return false;
    }
    return true;
}