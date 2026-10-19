"use strict";

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Прямая отправка команд в клиент Telegram.
function sendTgEvent(eventType, eventData) {
    const dataStr = eventData ? JSON.stringify(eventData) : '';

    try {
        if (window.TelegramWebviewProxy && window.TelegramWebviewProxy.postEvent) {
            // iOS и Android клиенты Telegram.
            window.TelegramWebviewProxy.postEvent(eventType, dataStr);
        } else if (window.external && window.external.invoke) {
            // Старые клиенты / отдельные мосты.
            window.external.invoke(JSON.stringify({ eventType: eventType, eventData: eventData }));
        } else if (window.parent !== window) {
            // Telegram Web / Desktop iframe.
            window.parent.postMessage(JSON.stringify({ eventType: eventType, eventData: eventData }), '*');
        }
    } catch (e) {
        // Ошибки моста не должны ломать игру.
    }
}

// Определяем десктопную среду.
// В текущей логике десктопом считается любое устройство, не определённое как мобильное.
// Это включает десктопное приложение Telegram на компьютере.
function detectDesktopTelegram() {
    if (isMobile) return false;

    try {
        const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

        if (tg) {
            const platform = String(tg.platform || '').toLowerCase();

            if (
                platform === 'windows' ||
                platform === 'macos' ||
                platform === 'linux' ||
                platform === 'desktop' ||
                platform === 'web' ||
                platform === 'webk' ||
                platform === 'webz'
            ) {
                return true;
            }
        }

        if (window.TelegramWebviewProxy) return true;
        if (window.external && window.external.invoke) return true;

        if (/Telegram/i.test(navigator.userAgent || '')) return true;
    } catch (e) {
        // Если не удалось определить платформу, используем запасной вариант ниже.
    }

    // Запасной вариант: если устройство не мобильное, считаем его десктопом.
    return true;
}

// Глобальный флаг для меню и других систем.
window.IS_DESKTOP_TELEGRAM = detectDesktopTelegram();

// Инициализация Telegram-событий.
sendTgEvent('web_app_ready', null);
sendTgEvent('web_app_expand', null);
sendTgEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: false });

// Блокировка и контроль горизонтального режима.
function enforceLandscape() {
    if (!isMobile) return;

    // Стандартный браузерный API, если доступен.
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
    }

    const isLandscape = window.innerWidth > window.innerHeight;

    if (isLandscape) {
        // Экран уже горизонтальный — фиксируем ориентацию.
        sendTgEvent('web_app_toggle_orientation_lock', { locked: true });
    } else {
        // Экран вертикальный — разрешаем поворот устройства.
        sendTgEvent('web_app_toggle_orientation_lock', { locked: false });
    }
}

window.addEventListener('resize', enforceLandscape);
window.addEventListener('orientationchange', () => {
    setTimeout(enforceLandscape, 50);
    setTimeout(enforceLandscape, 250);
});

enforceLandscape();

// На ПК принудительно выходим из сломанного fullscreen при старте.
if (!isMobile) {
    sendTgEvent('web_app_exit_fullscreen', null);
    setTimeout(() => {
        sendTgEvent('web_app_exit_fullscreen', null);
    }, 150);
}

// Запрос fullscreen и фиксации на мобильных устройствах.
function requestFS() {
    if (!isMobile) return;

    sendTgEvent('web_app_expand', null);
    sendTgEvent('web_app_request_fullscreen', null);

    enforceLandscape();
}

if (isMobile) {
    requestFS();
    setTimeout(requestFS, 200);
}

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

    if (game.state === 'gameover' || game.state === 'victory') {
        game.toMainMenu();
    }
}

// Геймпады.
window.addEventListener('gamepadconnected', () => {
    pollPads();
});

window.addEventListener('gamepaddisconnected', () => {
    pollPads();
});

// Клавиатура.
window.addEventListener('keydown', e => {
    const code = e.code;

    if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Escape', 'Enter', 'Tab', 'Slash', 'Period']
            .indexOf(code) >= 0
    ) {
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

    if (code === 'Escape' || code === 'KeyP') {
        openPauseMenu();
        return;
    }

    if (code === 'KeyM') {
        Sound.muted = !Sound.muted;
        return;
    }

    if (code === 'Space' || code === 'Enter') {
        pressStart();
    }
});

window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

// Мышь.
canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();

    mouseX = (e.clientX - r.left) * (CANVAS_W / Math.max(1, r.width));
    mouseY = (e.clientY - r.top) * (CANVAS_H / Math.max(1, r.height));

    if (UI.active && !UI.rebinding) {
        const L = menuLayout();

        for (let i = 0; i < L.rects.length; i++) {
            if (pointInRect(mouseX, mouseY, L.rects[i])) {
                if (UI.index !== i) {
                    UI.index = i;
                    Sound.menuMove();
                }
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
            UI.rebinding = false;
            UI.rebindAction = null;
            UI.msg = 'ОТМЕНА';
            UI.msgT = 1.8;
            Sound.menuBack();
            return;
        }

        const L = menuLayout();

        for (let i = 0; i < L.rects.length; i++) {
            if (pointInRect(mouseX, mouseY, L.rects[i])) {
                UI.index = i;
                activateItem(L.items[i]);
                return;
            }
        }

        return;
    }

    pressStart();
});

// Тачскрин.
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
            UI.rebinding = false;
            UI.rebindAction = null;
            UI.msg = 'ОТМЕНА';
            UI.msgT = 1.8;
            Sound.menuBack();
            return;
        }

        const L = menuLayout();

        for (let i = 0; i < L.rects.length; i++) {
            if (pointInRect(mouseX, mouseY, L.rects[i])) {
                UI.index = i;
                activateItem(L.items[i]);
                return;
            }
        }

        return;
    }

    pressStart();
}, { passive: false });

// Потеря фокуса окна.
window.addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
    Input.reset();

    if (game.state === 'playing' && !UI.active) {
        openPauseMenu();
    }
});

// Инициализация игры.
loadBinds();
pollPads();
applyLevelTheme(CLASSIC_THEME, 0);
buildOverlays();

game.demoGrid = generateLevel(1);

try {
    const hs = parseInt(localStorage.getItem('tanks8_hi') || '0', 10);
    if (!isNaN(hs)) game.hiScore = hs;
} catch (e) {
    // localStorage может быть недоступен в некоторых окружениях.
}

UI.active = true;
UI.screen = 'main';
UI.index = 0;
UI.returnTo = 'main';

let last = performance.now();
let errStreak = 0;

// Главный игровой цикл.
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

                    UI.msg = 'НАЗНАЧЕНО: ' + bindName(padBind);
                    UI.msgT = 2.4;

                    UI.rebinding = false;
                    UI.rebindAction = null;
                    UI.rebindWaitRelease = false;

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

        try {
            drawFatal();
        } catch (e2) {
            // Если даже экран ошибки не может быть нарисован, ничего не делаем.
        }

        if (window.console && console.error) {
            console.error(err);
        }

        if (errStreak > 4) {
            UI.active = true;
            UI.screen = 'main';
            UI.index = 0;
        }
    }

    for (const k in justPressed) delete justPressed[k];

    if (Input.clearJustPressed) {
        Input.clearJustPressed();
    }
}

// Запуск цикла.
requestAnimationFrame(loop);