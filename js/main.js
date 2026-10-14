"use strict";
// Инициализация Telegram Web App API
const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
tg.ready();
try { tg.expand(); } catch(e) {}
try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch(e) {}
}
function requestFS() {
    // Проверяем устройство стандартными средствами браузера без сторонних библиотек
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // Если игра открыта на ПК — выходим, чтобы не ломать окно в Telegram Desktop
    if (!isMobile) return;

    if (!tg) return;
    try { tg.expand(); } catch(e) {}
    
    if (tg.isVersionAtLeast && tg.isVersionAtLeast('8.0') && tg.requestFullscreen) {
        if (!tg.isFullscreen) {
            try { tg.requestFullscreen(); } catch (e) {}
        }
    }
    
    if (tg.lockOrientation) {
        try { tg.lockOrientation('landscape'); } catch (e) {}
    }
}
// Fullscreen запрашивается один раз по первому user gesture (тап/клик).
const onceFS = () => {
requestFS();
document.removeEventListener('touchstart', onceFS);
document.removeEventListener('click', onceFS);
};
document.addEventListener('touchstart', onceFS, { once: true, passive: true });
document.addEventListener('click', onceFS, { once: true });
function pressStart() {
Sound.init();
Sound.resume();
requestFS();
if (UI.active) return;
if (game.state === 'gameover' || game.state === 'victory') game.toMainMenu();
}
// Обработка геймпадов
window.addEventListener('gamepadconnected', () => { pollPads(); });
window.addEventListener('gamepaddisconnected', () => { pollPads(); });
// Обработка клавиатуры
window.addEventListener('keydown', e => {
const code = e.code;
if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Escape', 'Enter', 'Tab', 'Slash', 'Period'].indexOf(code) >= 0) {
e.preventDefault();
}
Sound.init();
Sound.resume();
if (UI.active) { 
    if (!e.repeat) handleMenuKey(code); 
    return; 
}
const first = !e.repeat;
keys[code] = true;
if (!first) return;
justPressed[code] = true;
if (code === 'Escape' || code === 'KeyP') { openPauseMenu(); return; }
if (code === 'KeyM') { Sound.muted = !Sound.muted; return; }
if (code === 'Space' || code === 'Enter') pressStart();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
// Обработка мыши (для ПК)
canvas.addEventListener('mousemove', e => {
const r = canvas.getBoundingClientRect();
mouseX = (e.clientX - r.left) * (CANVAS_W / Math.max(1, r.width));
mouseY = (e.clientY - r.top) * (CANVAS_H / Math.max(1, r.height));
if (UI.active && !UI.rebinding) {
    const L = menuLayout();
    for (let i = 0; i < L.rects.length; i++) {
        if (pointInRect(mouseX, mouseY, L.rects[i])) {
            if (UI.index !== i) { UI.index = i; Sound.menuMove(); }
            break;
        }
    }
}
});
canvas.addEventListener('mousedown', e => {
Sound.init();
Sound.resume();
const r = canvas.getBoundingClientRect();
mouseX = (e.clientX - r.left) * (CANVAS_W / Math.max(1, r.width));
mouseY = (e.clientY - r.top) * (CANVAS_H / Math.max(1, r.height));
if (UI.active) {
    if (UI.rebinding) { 
        UI.rebinding = false; UI.rebindAction = null; UI.msg = 'ОТМЕНА'; UI.msgT = 1.8; Sound.menuBack(); 
        return; 
    }
    const L = menuLayout();
    for (let i = 0; i < L.rects.length; i++) {
        if (pointInRect(mouseX, mouseY, L.rects[i])) { UI.index = i; activateItem(L.items[i]); return; }
    }
    return;
}
pressStart();
});
// Обработка тачскрина (для мобильных устройств и меню)
canvas.addEventListener('touchstart', e => {
e.preventDefault();
Sound.init();
Sound.resume();
const r = canvas.getBoundingClientRect();
 const touch = e.touches[0];
 mouseX = (touch.clientX - r.left) * (CANVAS_W / Math.max(1, r.width));
 mouseY = (touch.clientY - r.top) * (CANVAS_H / Math.max(1, r.height));
 if (UI.active) {
     if (UI.rebinding) { 
         UI.rebinding = false; UI.rebindAction = null; UI.msg = 'ОТМЕНА'; UI.msgT = 1.8; Sound.menuBack(); 
         return; 
     }
     const L = menuLayout();
     for (let i = 0; i < L.rects.length; i++) {
         if (pointInRect(mouseX, mouseY, L.rects[i])) { UI.index = i; activateItem(L.items[i]); return; }
     }
     return;
 }
 pressStart();
}, {passive: false});
// Потеря фокуса окна
window.addEventListener('blur', () => {
for (const k in keys) keys[k] = false;
Input.reset();
if (game.state === 'playing' && !UI.active) openPauseMenu();
});
// Инициализация игры
loadBinds();
pollPads();
applyLevelTheme(CLASSIC_THEME, 0);
buildOverlays();
game.demoGrid = generateLevel(1);
try {
const hs = parseInt(localStorage.getItem('tanks8_hi') || '0', 10);
if (!isNaN(hs)) game.hiScore = hs;
} catch(e) {}
UI.active = true;
UI.screen = 'main';
UI.index = 0;
UI.returnTo = 'main';
let last = performance.now(), errStreak = 0;
// Главный игровой цикл
function loop(now) {
requestAnimationFrame(loop);
const dt = Math.min((now - last) / 1000, 0.05);
last = now;
fatalMsg = '';
try {
     Input.poll();
     if (UI.active && UI.rebinding) {
         if (UI.rebindWaitRelease) { 
             if (padNeutral()) UI.rebindWaitRelease = false; 
         } else {
             const padBind = scanPadInput();
             if (padBind) {
                 BINDS[UI.bindPlayer][UI.rebindAction] = padBind;
                 saveBinds();
                 UI.msg = 'НАЗНАЧЕНО: ' + bindName(padBind); UI.msgT = 2.4;
                 UI.rebinding = false; UI.rebindAction = null; UI.rebindWaitRelease = false;
                 Sound.menuSelect();
             }
         }
     }
     game.update(dt);
     render(now / 1000);
     errStreak = 0;
 } catch (err) {
     errStreak++;
     fatalMsg = (err && err.message) ? err.message : String(err);
     try { drawFatal(); } catch (e2) {}
     if (window.console && console.error) console.error(err);
     if (errStreak > 4) { UI.active = true; UI.screen = 'main'; UI.index = 0; }
 }
 for (const k in justPressed) delete justPressed[k];
 if (Input.clearJustPressed) Input.clearJustPressed();
}
// Запуск цикла
requestAnimationFrame(loop);