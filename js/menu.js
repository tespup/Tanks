"use strict";

const UI = {
    active: true, screen: 'main', index: 0, returnTo: 'main',
    bindPlayer: 0, rebinding: false, rebindAction: null, rebindWaitRelease: false,
    msg: '', msgT: 0
};

function mainItems() {
    return [
        {label: 'СТАРТ ИГРЫ', value: '', action: 'start1'},
        {label: 'УПРАВЛЕНИЕ', value: '', action: 'controls'}
    ];
}

function pauseItems() {
    return [
        {label: 'ВЕРНУТЬСЯ В ИГРУ', value: '', action: 'resume'},
        {label: 'РЕСТАРТ УРОВНЯ', value: '', action: 'restart'},
        {label: 'УПРАВЛЕНИЕ', value: '', action: 'controls'},
        {label: 'МУЗЫКА', value: Music.enabled ? 'ВКЛ' : 'ВЫКЛ', action: 'music'},
        {label: 'ЗВУК', value: Sound.muted ? 'ВЫКЛ' : 'ВКЛ', action: 'sound'},
        {label: 'В ГЛАВНОЕ МЕНЮ', value: '', action: 'mainmenu'}
    ];
}

function controlsItems() {
    return [
        {label: 'НАСТРОЙКИ ИГРОКА 1', value: '', action: 'binds0'},
        {label: 'СБРОСИТЬ ВСЁ', value: '', action: 'resetall'},
        {label: 'НАЗАД', value: '', action: 'back'}
    ];
}

function bindsItems(pi) {
    const arr = [];
    for (let i = 0; i < BIND_ACTIONS.length; i++) {
        const a = BIND_ACTIONS[i];
        arr.push({label: a.label, value: '[ ' + bindName(BINDS[pi][a.key]) + ' ]', action: 'rebind', bind: a.key});
    }
    arr.push({label: 'СБРОСИТЬ ИГРОКА ' + (pi + 1), value: '', action: 'resetone'});
    arr.push({label: 'НАЗАД', value: '', action: 'back'});
    return arr;
}

function menuItems() {
    if (UI.screen === 'main') return mainItems();
    if (UI.screen === 'pause') return pauseItems();
    if (UI.screen === 'controls') return controlsItems();
    return bindsItems(UI.bindPlayer);
}

function menuTitle() {
    if (UI.screen === 'main') return 'ТАНКИ 8-БИТ';
    if (UI.screen === 'pause') return 'ПАУЗА';
    if (UI.screen === 'controls') return 'УПРАВЛЕНИЕ';
    return 'ИГРОК ' + (UI.bindPlayer + 1);
}

function menuLayout() {
    const items = menuItems();
    const w = 500, rowH = (UI.screen === 'binds') ? 34 : 40;
    const extra = (UI.screen === 'controls') ? 76 : ((UI.screen === 'main') ? 62 : 0);
    const h = 78 + items.length * rowH + extra + 46;
    let y = (UI.screen === 'main') ? 284 : Math.max(14, (CANVAS_H - h) / 2);
    if (y + h > CANVAS_H - 6) y = Math.max(6, CANVAS_H - 6 - h);
    const x = (CANVAS_W - w) / 2;
    const rects = [];
    for (let i = 0; i < items.length; i++) rects.push({x: x + 26, y: y + 64 + i * rowH, w: w - 52, h: rowH - 6});
    return {x: x, y: y, w: w, h: h, rects: rects, items: items, rowH: rowH, infoY: y + 64 + items.length * rowH + 16};
}

function activateItem(item) {
    if (!item) return;
    switch (item.action) {
        case 'start1': Sound.menuSelect(); UI.active = false; Input.reset(); game.startGame(1); break;
        case 'start2': Sound.menuSelect(); UI.active = false; Input.reset(); game.startGame(2); break;
        case 'resume': Sound.menuBack(); UI.active = false; Input.reset(); break;
        case 'restart': Sound.menuSelect(); UI.active = false; Input.reset(); game.restartLevel(); break;
        case 'controls': Sound.menuSelect(); UI.returnTo = UI.screen; UI.screen = 'controls'; UI.index = 0; break;
        case 'binds0': Sound.menuSelect(); UI.screen = 'binds'; UI.bindPlayer = 0; UI.index = 0; break;
        case 'binds1': Sound.menuSelect(); UI.screen = 'binds'; UI.bindPlayer = 1; UI.index = 0; break;
        case 'rebind':
            Sound.menuSelect();
            UI.rebinding = true; UI.rebindAction = item.bind; UI.rebindWaitRelease = true;
            UI.msg = ''; UI.msgT = 0;
            break;
        case 'resetone':
            resetBinds(UI.bindPlayer);
            UI.msg = 'СБРОШЕНО ДЛЯ ИГРОКА ' + (UI.bindPlayer + 1); UI.msgT = 2.2;
            Sound.menuSelect();
            break;
        case 'resetall':
            resetBinds();
            UI.msg = 'ВСЁ УПРАВЛЕНИЕ СБРОШЕНО'; UI.msgT = 2.2;
            Sound.menuSelect();
            break;
        case 'music':
            Music.enabled = !Music.enabled;
            if (!Music.enabled) Music.stop();
            else if (game.state === 'playing') Music.start((game.level - 1) % MELODIES.length);
            Sound.menuSelect();
            break;
        case 'sound':
            Sound.muted = !Sound.muted;
            if (!Sound.muted) Sound.menuSelect();
            break;
        case 'mainmenu': Sound.menuSelect(); game.toMainMenu(); break;
        case 'back':
            Sound.menuBack();
            if (UI.screen === 'binds') UI.screen = 'controls';
            else if (UI.screen === 'controls') UI.screen = (UI.returnTo === 'main') ? 'main' : 'pause';
            else if (UI.screen === 'pause') { UI.active = false; Input.reset(); }
            UI.index = 0;
            break;
    }
}

function menuBack() {
    if (UI.rebinding) {
        UI.rebinding = false; UI.rebindAction = null;
        UI.msg = 'ОТМЕНА'; UI.msgT = 1.8;
        Sound.menuBack();
        return;
    }
    if (UI.screen === 'binds') { UI.screen = 'controls'; UI.index = 0; Sound.menuBack(); return; }
    if (UI.screen === 'controls') {
        UI.screen = (UI.returnTo === 'main') ? 'main' : 'pause';
        UI.index = 0; Sound.menuBack(); return;
    }
    if (UI.screen === 'pause') { UI.active = false; Input.reset(); Sound.menuBack(); return; }
}

function handleMenuKey(code) {
    if (UI.rebinding) {
        if (code === 'Escape' || code === 'Backspace') { menuBack(); return; }
        if (FORBIDDEN_KEYS.indexOf(code) >= 0) {
            UI.msg = 'ЭТА КЛАВИША ЗАНЯТА МЕНЮ — ВЫБЕРИТЕ ДРУГУЮ'; UI.msgT = 2.6;
            Sound.buildFail(); return;
        }
        BINDS[UI.bindPlayer][UI.rebindAction] = 'K:' + code;
        saveBinds();
        UI.msg = 'НАЗНАЧЕНО: ' + keyName(code); UI.msgT = 2.4;
        UI.rebinding = false; UI.rebindAction = null;
        Sound.menuSelect();
        return;
    }
    const items = menuItems();
    if (code === 'Escape') { menuBack(); return; }
    if (code === 'ArrowUp' || code === 'KeyW') { UI.index = (UI.index - 1 + items.length) % items.length; Sound.menuMove(); return; }
    if (code === 'ArrowDown' || code === 'KeyS') { UI.index = (UI.index + 1) % items.length; Sound.menuMove(); return; }
    if (code === 'Enter' || code === 'Space' || code === 'NumpadEnter') { activateItem(items[UI.index]); return; }
}

function openPauseMenu() {
    if (game.state !== 'playing' || UI.active) return;
    UI.active = true; UI.screen = 'pause'; UI.index = 0;
    UI.returnTo = 'pause'; UI.rebinding = false; UI.msg = ''; UI.msgT = 0;
    for (const k in keys) keys[k] = false;
    Input.reset();
    Sound.menuSelect();
}