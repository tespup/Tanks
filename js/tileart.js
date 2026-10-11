"use strict";

function bevelRect(g, x, y, w, h, base, light, dark, d) {
    g.fillStyle = base;  g.fillRect(x, y, w, h);
    g.fillStyle = light; g.fillRect(x, y, w, d); g.fillRect(x, y, d, h);
    g.fillStyle = dark;  g.fillRect(x, y + h - d, w, d); g.fillRect(x + w - d, y, d, h);
}

function tShade(g, top, bot) {
    const gr = g.createLinearGradient(0, 0, 0, 48);
    gr.addColorStop(0, 'rgba(255,255,255,' + top + ')');
    gr.addColorStop(0.42, 'rgba(255,255,255,0)');
    gr.addColorStop(1, 'rgba(0,0,0,' + bot + ')');
    g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
}

function tVig(g, a) {
    const gr = g.createRadialGradient(24, 20, 5, 24, 24, 34);
    gr.addColorStop(0, 'rgba(255,255,255,' + (a * 0.45).toFixed(3) + ')');
    gr.addColorStop(0.5, 'rgba(255,255,255,0)');
    gr.addColorStop(1, 'rgba(0,0,0,' + a.toFixed(3) + ')');
    g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
}

function tSpeck(g, R, n, color, w, h) {
    g.fillStyle = color;
    for (let i = 0; i < n; i++) g.fillRect(R() * 46, R() * 46, w || 1, h || 1);
}

function tGlow(g, x, y, r, color, alpha) {
    g.save(); g.globalAlpha = alpha;
    const gr = g.createRadialGradient(x, y, 0, x, y, Math.max(1, r));
    gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, Math.max(1, r), 0, 7); g.fill();
    g.restore();
}

function tRivet(g, x, y, r, dark, light) {
    g.fillStyle = dark; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = light; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.42, 0, 7); g.fill();
}

function tGrain(g, R, n, dark, light) {
    g.save();
    g.globalAlpha = 0.16; g.fillStyle = dark;
    for (let i = 0; i < n; i++) g.fillRect(R() * 46, R() * 46, 1 + R() * 3, 1);
    g.globalAlpha = 0.13; g.fillStyle = light;
    for (let i = 0; i < n; i++) g.fillRect(R() * 46, R() * 46, 1 + R() * 2, 1);
    g.restore();
}

function paintBrick(g, p, st, R) {
    if (st === 0) {
        g.fillStyle = p.brickMortar; g.fillRect(0, 0, 48, 48);
        tSpeck(g, R, 30, 'rgba(0,0,0,0.30)', 1, 1);
        tSpeck(g, R, 14, 'rgba(255,255,255,0.07)', 1, 1);
        for (let r = 0; r < 4; r++) {
            const off = (r % 2) ? 12 : 0;
            for (let c = -1; c < 4; c++) {
                const bx = off + c * 24 + 1, by = r * 12 + 1;
                bevelRect(g, bx, by, 22, 10, p.brickBase, p.brickLight, p.brickDark, 2);
                const j = (R() - 0.5);
                g.save(); g.globalAlpha = Math.abs(j) * 0.22;
                g.fillStyle = j > 0 ? '#ffffff' : '#000000';
                g.fillRect(bx + 2, by + 2, 18, 6); g.restore();
                g.save(); g.globalAlpha = 0.22; g.fillStyle = p.brickShade;
                for (let k = 0; k < 3; k++) g.fillRect(bx + 2 + R() * 17, by + 3 + R() * 5, 2 + R() * 3, 1);
                g.restore();
                g.save(); g.globalAlpha = 0.5; g.fillStyle = p.brickLight;
                g.fillRect(bx + 2, by + 2, 7, 1); g.restore();
                if (R() < 0.35) { g.fillStyle = p.brickMortar; g.fillRect(bx + (R() < 0.5 ? 0 : 19), by + (R() < 0.5 ? 0 : 7), 3, 3); }
            }
        }
        tGrain(g, R, 26, p.brickShade, p.brickLight);
        tShade(g, 0.10, 0.22); tVig(g, 0.30);
    } else if (st === 1) {
        g.fillStyle = p.brickMortar; g.fillRect(0, 0, 48, 48);
        g.save(); g.globalAlpha = 0.5; g.strokeStyle = p.brickShade; g.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            g.beginPath(); g.moveTo(i * 12, 0); g.lineTo(i * 12, 48); g.stroke();
            g.beginPath(); g.moveTo(0, i * 12); g.lineTo(48, i * 12); g.stroke();
        }
        g.restore();
        for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
            const x = tx * 24 + 2, y = ty * 24 + 2;
            bevelRect(g, x, y, 20, 20, p.brickBase, p.brickLight, p.brickDark, 3);
            g.save(); g.globalAlpha = 0.4; g.strokeStyle = p.brickShade; g.lineWidth = 1;
            g.strokeRect(x + 4.5, y + 4.5, 11, 11); g.restore();
            g.save(); g.globalAlpha = 0.25; g.fillStyle = p.brickLight;
            g.beginPath(); g.moveTo(x + 3, y + 17); g.lineTo(x + 17, y + 3); g.lineTo(x + 17, y + 6); g.lineTo(x + 6, y + 17);
            g.closePath(); g.fill(); g.restore();
            tRivet(g, x + 10, y + 10, 2.7, p.brickShade, p.brickLight);
            g.fillStyle = p.brickDark;
            g.fillRect(x + 4, y + 15, 5, 1); g.fillRect(x + 11, y + 15, 5, 1);
            g.fillStyle = p.accent; g.save(); g.globalAlpha = 0.85;
            g.fillRect(x + 15, y + 4, 2, 2); g.restore();
            tGlow(g, x + 16, y + 5, 4, p.accent, 0.35);
        }
        tRivet(g, 3, 3, 1.8, p.brickShade, p.brickLight);
        tRivet(g, 45, 3, 1.8, p.brickShade, p.brickLight);
        tRivet(g, 3, 45, 1.8, p.brickShade, p.brickLight);
        tRivet(g, 45, 45, 1.8, p.brickShade, p.brickLight);
        tShade(g, 0.12, 0.24); tVig(g, 0.30);
    } else if (st === 2) {
        g.fillStyle = p.brickMortar; g.fillRect(0, 0, 48, 48);
        tSpeck(g, R, 26, 'rgba(0,0,0,0.28)', 1, 2);
        const cells = [[2, 2, 20, 13], [24, 2, 22, 10], [2, 17, 13, 14], [17, 14, 17, 12], [36, 14, 10, 17],
        [2, 33, 22, 13], [26, 28, 9, 18], [37, 33, 9, 13]];
        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            const base = (i % 3 === 0) ? p.brickLight : p.brickBase;
            bevelRect(g, c[0], c[1], c[2], c[3], base, p.brickLight, p.brickShade, 2);
            g.save(); g.globalAlpha = 0.2; g.fillStyle = p.brickDark;
            for (let k = 0; k < 4; k++) g.fillRect(c[0] + 2 + R() * (c[2] - 5), c[1] + 2 + R() * (c[3] - 5), 2 + R() * 3, 1);
            g.restore();
            if (R() < 0.5) {
                g.save(); g.globalAlpha = 0.4; g.fillStyle = p.treeMid;
                g.beginPath(); g.arc(c[0] + R() * c[2], c[1] + c[3] - 2, 2 + R() * 2.5, 0, 7); g.fill(); g.restore();
            }
            if (R() < 0.4) {
                g.fillStyle = p.brickMortar;
                g.fillRect(c[0] + (R() < 0.5 ? 0 : c[2] - 3), c[1] + (R() < 0.5 ? 0 : c[3] - 3), 3, 3);
            }
        }
        g.save(); g.globalAlpha = 0.55; g.strokeStyle = p.brickShade; g.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const x = R() * 44, y = R() * 44;
            g.beginPath(); g.moveTo(x, y); g.lineTo(x + R() * 10 - 5, y + R() * 10 - 5); g.stroke();
        }
        g.restore();
        tShade(g, 0.09, 0.26); tVig(g, 0.34);
    } else if (st === 3) {
        const grd = g.createLinearGradient(0, 0, 48, 48);
        grd.addColorStop(0, p.brickDark); grd.addColorStop(1, p.brickShade);
        g.fillStyle = grd; g.fillRect(0, 0, 48, 48);
        for (let i = 0; i < 11; i++) {
            const cx = 2 + R() * 44, cy = 2 + R() * 44, w = 6 + R() * 12, h = 9 + R() * 15;
            const col = (i % 3 === 0) ? p.brickLight : ((i % 3 === 1) ? p.brickBase : p.brickDark);
            g.fillStyle = col;
            g.beginPath();
            g.moveTo(cx, cy - h / 2); g.lineTo(cx + w / 2, cy); g.lineTo(cx, cy + h / 2); g.lineTo(cx - w / 2, cy);
            g.closePath(); g.fill();
            g.save(); g.globalAlpha = 0.45; g.fillStyle = '#ffffff';
            g.beginPath();
            g.moveTo(cx, cy - h / 2); g.lineTo(cx + w * 0.16, cy - h * 0.1); g.lineTo(cx - w * 0.18, cy);
            g.closePath(); g.fill(); g.restore();
            g.save(); g.globalAlpha = 0.35; g.strokeStyle = p.brickLight; g.lineWidth = 1;
            g.beginPath();
            g.moveTo(cx, cy - h / 2); g.lineTo(cx + w / 2, cy); g.lineTo(cx, cy + h / 2); g.lineTo(cx - w / 2, cy);
            g.closePath(); g.stroke(); g.restore();
        }
        tSpeck(g, R, 12, 'rgba(255,255,255,0.35)', 1, 2);
        tShade(g, 0.14, 0.20); tVig(g, 0.26);
    } else if (st === 4) {
        g.fillStyle = p.brickShade; g.fillRect(0, 0, 48, 48);
        for (let i = 0; i < 6; i++) {
            const y = i * 8;
            const base = (i % 2) ? p.brickBase : p.brickLight;
            bevelRect(g, 0, y + 1, 48, 6, base, p.brickLight, p.brickShade, 1);
            g.fillStyle = p.brickMortar; g.fillRect(0, y, 48, 1);
            g.save(); g.globalAlpha = 0.3; g.fillStyle = p.brickShade;
            g.fillRect(R() * 28, y + 2, 11, 1); g.fillRect(R() * 28, y + 4, 9, 1);
            g.restore();
            if (R() < 0.45) {
                g.save(); g.globalAlpha = 0.6; g.fillStyle = p.brickShade;
                const kx = 6 + R() * 34, ky = y + 3.5;
                g.beginPath(); g.ellipse(kx, ky, 2.2, 1.4, 0, 0, 7); g.fill();
                g.globalAlpha = 0.35; g.fillStyle = p.brickLight;
                g.beginPath(); g.ellipse(kx - 0.6, ky - 0.5, 1, 0.6, 0, 0, 7); g.fill();
                g.restore();
            }
            tRivet(g, 3, y + 4, 1.3, p.brickShade, p.brickLight);
            tRivet(g, 45, y + 4, 1.3, p.brickShade, p.brickLight);
            g.fillStyle = p.brickMortar; g.fillRect((i % 2) ? 16 : 34, y + 1, 1, 6);
        }
        tGrain(g, R, 20, p.brickShade, p.brickLight);
        tShade(g, 0.10, 0.24); tVig(g, 0.30);
    } else {
        g.fillStyle = p.brickShade; g.fillRect(0, 0, 48, 48);
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
            const x = c * 16 + 1, y = r * 16 + 1;
            bevelRect(g, x, y, 14, 14, p.brickBase, p.brickLight, p.brickShade, 2);
            g.save(); g.globalAlpha = 0.22; g.fillStyle = '#000';
            g.fillRect(x + 3, y + 3, 8, 8); g.restore();
        }
        g.save();
        g.lineCap = 'round';
        g.strokeStyle = p.accent; g.globalAlpha = 0.35; g.lineWidth = 6;
        g.beginPath();
        g.moveTo(0, 16); g.lineTo(14, 20); g.lineTo(24, 14); g.lineTo(34, 22); g.lineTo(48, 18);
        g.moveTo(16, 0); g.lineTo(20, 14); g.lineTo(14, 26); g.lineTo(22, 40); g.lineTo(18, 48);
        g.stroke();
        g.globalAlpha = 0.95; g.lineWidth = 2.4; g.strokeStyle = p.accent;
        g.beginPath();
        g.moveTo(0, 16); g.lineTo(14, 20); g.lineTo(24, 14); g.lineTo(34, 22); g.lineTo(48, 18);
        g.moveTo(16, 0); g.lineTo(20, 14); g.lineTo(14, 26); g.lineTo(22, 40); g.lineTo(18, 48);
        g.stroke();
        g.globalAlpha = 0.85; g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,0.85)';
        g.beginPath();
        g.moveTo(0, 16); g.lineTo(14, 20); g.lineTo(24, 14); g.lineTo(34, 22); g.lineTo(48, 18);
        g.stroke();
        g.restore();
        tGlow(g, 24, 17, 16, p.accent, 0.22);
        tGlow(g, 18, 32, 14, p.accent, 0.18);
        tSpeck(g, R, 10, 'rgba(255,220,160,0.5)', 1, 1);
        tVig(g, 0.30);
    }
}

function paintCracks(g, p) {
    g.save();
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(8,4,2,0.9)'; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(5, 2); g.lineTo(8, 14); g.lineTo(4, 22); g.lineTo(14, 26); g.lineTo(11, 38); g.lineTo(18, 46);
    g.moveTo(22, 8); g.lineTo(26, 18); g.lineTo(34, 20); g.lineTo(38, 32); g.lineTo(46, 36);
    g.moveTo(30, 4); g.lineTo(33, 12); g.lineTo(44, 15);
    g.stroke();
    g.lineWidth = 1.4; g.strokeStyle = 'rgba(0,0,0,0.85)';
    g.beginPath();
    g.moveTo(5, 2); g.lineTo(8, 14); g.lineTo(4, 22); g.lineTo(14, 26); g.lineTo(11, 38); g.lineTo(18, 46);
    g.moveTo(22, 8); g.lineTo(26, 18); g.lineTo(34, 20); g.lineTo(38, 32); g.lineTo(46, 36);
    g.stroke();
    g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,0.22)';
    g.beginPath(); g.moveTo(6, 3); g.lineTo(9, 14); g.moveTo(23, 8); g.lineTo(27, 18); g.stroke();
    g.fillStyle = p.brickMortar;
    g.fillRect(27, 23, 10, 10); g.fillRect(6, 29, 8, 8); g.fillRect(37, 9, 7, 7); g.fillRect(19, 38, 6, 6);
    g.save(); g.globalAlpha = 0.5; g.fillStyle = 'rgba(0,0,0,0.6)';
    g.fillRect(27, 23, 10, 2); g.fillRect(6, 29, 8, 2); g.fillRect(37, 9, 7, 2);
    g.restore();
    g.restore();
}

function paintSteel(g, p, st, R) {
    if (st === 0) {
        const grd = g.createLinearGradient(0, 0, 48, 48);
        grd.addColorStop(0, p.steelLight); grd.addColorStop(0.45, p.steelBase); grd.addColorStop(1, p.steelDark);
        g.fillStyle = grd; g.fillRect(0, 0, 48, 48);
        for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
            const x = tx * 24, y = ty * 24;
            bevelRect(g, x + 3, y + 3, 18, 18, p.steelBase, p.steelLight, p.steelDark, 3);
            g.save(); g.globalAlpha = 0.28; g.fillStyle = '#ffffff';
            g.beginPath(); g.moveTo(x + 4, y + 20); g.lineTo(x + 20, y + 4); g.lineTo(x + 20, y + 8); g.lineTo(x + 8, y + 20);
            g.closePath(); g.fill(); g.restore();
            g.save(); g.globalAlpha = 0.22; g.strokeStyle = p.steelShade; g.lineWidth = 1;
            g.beginPath(); g.moveTo(x + 6, y + 16); g.lineTo(x + 16, y + 6); g.stroke(); g.restore();
            tRivet(g, x + 12, y + 12, 2.8, p.steelRivet, p.steelLight);
        }
        g.fillStyle = p.steelShade;
        g.fillRect(0, 0, 48, 2); g.fillRect(0, 46, 48, 2); g.fillRect(0, 0, 2, 48); g.fillRect(46, 0, 2, 48);
        g.save(); g.globalAlpha = 0.5; g.fillStyle = p.steelLight;
        g.fillRect(2, 2, 44, 1); g.fillRect(2, 2, 1, 44); g.restore();
        tSpeck(g, R, 16, 'rgba(255,255,255,0.16)', 1, 1);
        tShade(g, 0.14, 0.20); tVig(g, 0.24);
    } else if (st === 1) {
        g.fillStyle = p.steelShade; g.fillRect(0, 0, 48, 48);
        g.save(); g.globalAlpha = 0.35; g.strokeStyle = p.steelDark; g.lineWidth = 1;
        for (let i = -48; i < 48; i += 6) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 48, 48); g.stroke(); }
        g.restore();
        g.fillStyle = p.steelBase; poly(g, 24, 24, 21, 6, 0);
        g.fillStyle = p.steelLight; poly(g, 24, 21, 13, 6, 0);
        g.save(); g.globalAlpha = 0.35; g.fillStyle = p.steelDark; poly(g, 24, 28, 13, 6, 0); g.restore();
        g.save(); g.globalAlpha = 0.8; g.strokeStyle = p.steelLight; g.lineWidth = 1.4;
        g.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = i * Math.PI / 3, x = 24 + Math.cos(a) * 21, y = 24 + Math.sin(a) * 21;
            if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.closePath(); g.stroke(); g.restore();
        for (let i = 0; i < 6; i++) {
            const a = i * Math.PI / 3;
            tRivet(g, 24 + Math.cos(a) * 16.5, 24 + Math.sin(a) * 16.5, 2.1, p.steelRivet, p.steelLight);
        }
        g.save(); g.globalAlpha = 0.55; g.strokeStyle = p.accent; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(7, 41); g.lineTo(41, 7); g.stroke(); g.restore();
        tGlow(g, 24, 24, 12, p.accent, 0.18);
        tShade(g, 0.12, 0.22); tVig(g, 0.26);
    } else if (st === 2) {
        bevelRect(g, 1, 1, 46, 46, p.steelBase, p.steelLight, p.steelDark, 4);
        g.save(); g.globalAlpha = 0.5; g.strokeStyle = p.steelShade; g.lineWidth = 5;
        g.beginPath(); g.moveTo(9, 9); g.lineTo(39, 39); g.moveTo(39, 9); g.lineTo(9, 39); g.stroke();
        g.globalAlpha = 0.55; g.strokeStyle = p.steelLight; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(9, 9); g.lineTo(39, 39); g.stroke();
        g.globalAlpha = 0.35; g.strokeStyle = p.steelDark; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(39, 9); g.lineTo(9, 39); g.stroke();
        g.restore();
        [[6, 6], [42, 6], [6, 42], [42, 42], [24, 24]].forEach(q => tRivet(g, q[0], q[1], 2.6, p.steelRivet, p.steelLight));
        g.save(); g.globalAlpha = 0.35; g.fillStyle = p.brickShade;
        for (let i = 0; i < 7; i++) { const x = R() * 42, y = R() * 42; g.beginPath(); g.arc(x + 3, y + 3, 1.4 + R() * 2.4, 0, 7); g.fill(); }
        g.restore();
        g.save(); g.globalAlpha = 0.4; g.strokeStyle = p.steelShade; g.lineWidth = 1;
        g.beginPath(); g.moveTo(2, 14); g.lineTo(10, 10); g.moveTo(38, 44); g.lineTo(46, 38); g.stroke(); g.restore();
        tShade(g, 0.12, 0.26); tVig(g, 0.30);
    } else if (st === 3) {
        g.fillStyle = p.steelShade; g.fillRect(0, 0, 48, 48);
        tSpeck(g, R, 20, 'rgba(255,255,255,0.10)', 1, 1);
        g.fillStyle = p.steelBase;
        g.beginPath(); g.moveTo(24, 2); g.lineTo(46, 24); g.lineTo(24, 46); g.lineTo(2, 24); g.closePath(); g.fill();
        g.fillStyle = p.steelLight;
        g.beginPath(); g.moveTo(24, 2); g.lineTo(46, 24); g.lineTo(24, 24); g.closePath(); g.fill();
        g.fillStyle = p.steelDark;
        g.beginPath(); g.moveTo(24, 24); g.lineTo(46, 24); g.lineTo(24, 46); g.closePath(); g.fill();
        g.save(); g.globalAlpha = 0.55; g.fillStyle = p.steelBase;
        g.beginPath(); g.moveTo(2, 24); g.lineTo(24, 24); g.lineTo(24, 46); g.closePath(); g.fill(); g.restore();
        g.save(); g.globalAlpha = 0.75; g.strokeStyle = '#ffffff'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(24, 2); g.lineTo(46, 24); g.stroke();
        g.beginPath(); g.moveTo(24, 2); g.lineTo(2, 24); g.stroke(); g.restore();
        g.save(); g.globalAlpha = 0.5; g.strokeStyle = p.steelShade; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(46, 24); g.lineTo(24, 46); g.lineTo(2, 24); g.stroke(); g.restore();
        tGlow(g, 24, 24, 10, p.accent, 0.4);
        g.fillStyle = p.accent; g.save(); g.globalAlpha = 0.85;
        poly(g, 24, 24, 4, 4, Math.PI / 4); g.restore();
        tVig(g, 0.26);
    } else if (st === 4) {
        g.fillStyle = p.steelShade; g.fillRect(0, 0, 48, 48);
        bevelRect(g, 2, 2, 44, 44, p.steelBase, p.steelLight, p.steelDark, 3);
        g.save(); g.globalAlpha = 0.22; g.fillStyle = p.steelShade;
        for (let i = 0; i < 5; i++) g.fillRect(4 + R() * 38, 4 + R() * 38, 8 + R() * 8, 1);
        g.restore();
        for (let b = 0; b < 2; b++) {
            const y = 10 + b * 21;
            bevelRect(g, 0, y, 48, 8, p.steelDark, p.steelLight, p.steelShade, 2);
            g.save(); g.globalAlpha = 0.35; g.fillStyle = '#ffffff'; g.fillRect(0, y + 2, 48, 1); g.restore();
            for (let k = 0; k < 4; k++) tRivet(g, 7 + k * 11, y + 4, 2.1, p.steelRivet, p.steelLight);
        }
        g.save(); g.globalAlpha = 0.3; g.fillStyle = p.brickShade;
        for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(R() * 44 + 2, R() * 44 + 2, 1.2 + R() * 2, 0, 7); g.fill(); }
        g.restore();
        tShade(g, 0.10, 0.24); tVig(g, 0.28);
    } else {
        g.fillStyle = p.steelShade; g.fillRect(0, 0, 48, 48);
        for (let i = 0; i < 4; i++) {
            const x = (i % 2) * 24 + 2, y = Math.floor(i / 2) * 24 + 2;
            bevelRect(g, x, y, 20, 20, p.steelDark, p.steelBase, p.steelShade, 2);
            g.save(); g.globalAlpha = 0.3; g.fillStyle = p.steelLight;
            g.beginPath(); g.moveTo(x + 2, y + 18); g.lineTo(x + 18, y + 2); g.lineTo(x + 18, y + 6); g.lineTo(x + 6, y + 18);
            g.closePath(); g.fill(); g.restore();
        }
        g.save();
        g.strokeStyle = p.accent; g.lineWidth = 1.6; g.globalAlpha = 0.95;
        for (let i = 0; i < 4; i++) {
            const x = (i % 2) * 24 + 2, y = Math.floor(i / 2) * 24 + 2;
            g.strokeRect(x + 0.5, y + 0.5, 19, 19);
        }
        g.globalAlpha = 0.3; g.lineWidth = 5;
        for (let i = 0; i < 4; i++) {
            const x = (i % 2) * 24 + 2, y = Math.floor(i / 2) * 24 + 2;
            g.strokeRect(x + 0.5, y + 0.5, 19, 19);
        }
        g.restore();
        g.save(); g.globalAlpha = 0.55; g.fillStyle = p.steelLight; g.fillRect(22, 2, 4, 44); g.restore();
        tGlow(g, 24, 24, 12, p.accent, 0.2);
        tSpeck(g, R, 10, 'rgba(255,255,255,0.25)', 1, 1);
        tVig(g, 0.28);
    }
}

function paintTree(g, p, st, R) {
    const grd = g.createLinearGradient(0, 0, 0, 48);
    grd.addColorStop(0, p.treeDark); grd.addColorStop(1, p.treeDeep);
    g.fillStyle = grd; g.fillRect(0, 0, 48, 48);
    if (st === 0) {
        for (let layer = 0; layer < 3; layer++) {
            const col = [p.treeDark, p.treeMid, p.treeLight][layer];
            const n = [9, 8, 6][layer], rr = [9, 7, 5][layer];
            g.fillStyle = col;
            for (let i = 0; i < n; i++) {
                const x = 4 + R() * 40, y = 4 + R() * 40, r = rr * 0.6 + R() * rr * 0.7;
                g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
            }
        }
        g.save(); g.globalAlpha = 0.5; g.fillStyle = p.treeSpark;
        for (let i = 0; i < 10; i++) { g.beginPath(); g.arc(5 + R() * 36, 5 + R() * 30, 1.2 + R() * 1.8, 0, 7); g.fill(); }
        g.restore();
        g.save(); g.globalAlpha = 0.22; g.fillStyle = '#000';
        for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(6 + R() * 38, 14 + R() * 32, 2 + R() * 3, 0, 7); g.fill(); }
        g.restore();
        tShade(g, 0.12, 0.22); tVig(g, 0.28);
    } else if (st === 1) {
        const pts = [[12, 38], [36, 34], [24, 20]];
        for (let i = 0; i < pts.length; i++) {
            const s = 8 + i * 2.4, x = pts[i][0], y = pts[i][1];
            g.save(); g.globalAlpha = 0.35; g.fillStyle = '#000';
            g.beginPath(); g.ellipse(x, y + 3, s * 1.05, 3, 0, 0, 7); g.fill(); g.restore();
            g.fillStyle = p.treeDark; g.fillRect(x - 2, y, 4, 7);
            for (let t = 0; t < 3; t++) {
                const k = 1 - t * 0.26, yy = y - t * s * 0.5;
                g.fillStyle = [p.treeMid, p.treeLight, p.treeSpark][t];
                g.beginPath();
                g.moveTo(x, yy - s * 1.5 * k); g.lineTo(x + s * k, yy); g.lineTo(x - s * k, yy);
                g.closePath(); g.fill();
                g.save(); g.globalAlpha = 0.35; g.fillStyle = '#ffffff';
                g.beginPath();
                g.moveTo(x, yy - s * 1.5 * k); g.lineTo(x + s * 0.3 * k, yy - s * 0.4 * k); g.lineTo(x - s * 0.28 * k, yy - s * 0.4 * k);
                g.closePath(); g.fill(); g.restore();
            }
        }
        tSpeck(g, R, 12, 'rgba(255,255,255,0.20)', 1, 1);
        tShade(g, 0.10, 0.24); tVig(g, 0.30);
    } else if (st === 2) {
        g.save(); g.globalAlpha = 0.3; g.fillStyle = '#000';
        for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(6 + R() * 36, 10 + R() * 34, 4 + R() * 5, 2 + R() * 3, 0, 0, 7); g.fill(); }
        g.restore();
        g.lineCap = 'round';
        for (let i = 0; i < 9; i++) {
            const x = 5 + R() * 38, y = 9 + R() * 33;
            g.strokeStyle = (i % 3 === 0) ? p.treeLight : ((i % 3 === 1) ? p.treeMid : p.treeSpark);
            g.lineWidth = 1.4 + R() * 1.4;
            g.beginPath();
            g.moveTo(x, y + 9); g.lineTo(x + R() * 3 - 1.5, y - 2); g.lineTo(x + R() * 4 - 2, y - 9);
            g.moveTo(x, y + 1); g.lineTo(x - 4 - R() * 3, y - 4);
            g.moveTo(x, y + 3); g.lineTo(x + 4 + R() * 3, y - 3);
            g.stroke();
            if (R() < 0.5) { g.fillStyle = p.treeDark; g.beginPath(); g.arc(x, y + 4, 1.4, 0, 7); g.fill(); }
        }
        g.save(); g.globalAlpha = 0.3; g.fillStyle = p.treeSpark;
        for (let i = 0; i < 7; i++) g.fillRect(R() * 44, R() * 44, 2, 1);
        g.restore();
        tShade(g, 0.08, 0.26); tVig(g, 0.32);
    } else if (st === 3) {
        for (let i = 0; i < 8; i++) {
            const x = 4 + R() * 40, y = 13 + R() * 31, h = 10 + R() * 15, w = 2.6 + R() * 4;
            g.fillStyle = (i % 2) ? p.treeLight : p.treeMid;
            g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + w, y); g.lineTo(x - w, y); g.closePath(); g.fill();
            g.save(); g.globalAlpha = 0.5; g.fillStyle = '#ffffff';
            g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + w * 0.35, y - h * 0.3); g.lineTo(x - w * 0.25, y); g.closePath(); g.fill();
            g.restore();
            g.save(); g.globalAlpha = 0.35; g.fillStyle = p.treeDeep;
            g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + w, y); g.lineTo(x + w * 0.4, y); g.closePath(); g.fill();
            g.restore();
            tGlow(g, x, y - h * 0.5, 5, p.treeSpark, 0.18);
        }
        tSpeck(g, R, 14, 'rgba(255,255,255,0.35)', 1, 2);
        tShade(g, 0.12, 0.20); tVig(g, 0.26);
    } else if (st === 4) {
        const blobs = [[16, 18, 13], [33, 16, 11], [24, 32, 14], [10, 35, 9], [39, 35, 9], [24, 10, 8]];
        g.save(); g.globalAlpha = 0.35; g.fillStyle = '#000';
        for (let i = 0; i < blobs.length; i++) { g.beginPath(); g.arc(blobs[i][0] + 2, blobs[i][1] + 3, blobs[i][2], 0, 7); g.fill(); }
        g.restore();
        for (let i = 0; i < blobs.length; i++) {
            g.fillStyle = (i % 2) ? p.treeMid : p.treeLight;
            g.beginPath(); g.arc(blobs[i][0], blobs[i][1], blobs[i][2], 0, 7); g.fill();
        }
        g.save(); g.strokeStyle = p.treeSpark; g.lineWidth = 1.6; g.globalAlpha = 0.8;
        for (let i = 0; i < blobs.length; i++) {
            g.beginPath(); g.arc(blobs[i][0] - 3, blobs[i][1] - 3, blobs[i][2] * 0.62, Math.PI * 1.05, Math.PI * 1.8); g.stroke();
        }
        g.restore();
        g.save(); g.globalAlpha = 0.4; g.fillStyle = p.treeDeep;
        for (let i = 0; i < blobs.length; i++) {
            g.beginPath(); g.arc(blobs[i][0] + 3, blobs[i][1] + 4, blobs[i][2] * 0.55, 0, Math.PI); g.fill();
        }
        g.restore();
        tSpeck(g, R, 16, 'rgba(255,255,255,0.20)', 1, 1);
        tShade(g, 0.12, 0.22); tVig(g, 0.26);
    } else {
        for (let i = 0; i < 7; i++) {
            const x = 7 + R() * 34, y = 13 + R() * 27, r = 4.5 + R() * 5.5;
            g.save(); g.globalAlpha = 0.35; g.fillStyle = '#000';
            g.beginPath(); g.ellipse(x + 1, y + 11, 2.4, 1.6, 0, 0, 7); g.fill(); g.restore();
            g.fillStyle = p.treeMid; g.fillRect(x - 1.6, y, 3.2, 11);
            g.save(); g.globalAlpha = 0.4; g.fillStyle = p.treeLight; g.fillRect(x - 1.6, y, 1.2, 11); g.restore();
            g.fillStyle = (i % 2) ? p.treeLight : p.treeSpark;
            g.beginPath(); g.ellipse(x, y, r, r * 0.72, 0, 0, 7); g.fill();
            g.save(); g.globalAlpha = 0.45; g.fillStyle = '#ffffff';
            g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.26, r * 0.36, r * 0.22, 0, 0, 7); g.fill(); g.restore();
            g.save(); g.globalAlpha = 0.35; g.fillStyle = p.treeDeep;
            g.beginPath(); g.ellipse(x + r * 0.25, y + r * 0.3, r * 0.4, r * 0.2, 0, 0, 7); g.fill(); g.restore();
            g.fillStyle = 'rgba(255,255,255,0.55)';
            g.beginPath(); g.arc(x - r * 0.35, y - r * 0.1, 1.1, 0, 7); g.fill();
            g.beginPath(); g.arc(x + r * 0.3, y + r * 0.05, 0.9, 0, 7); g.fill();
            tGlow(g, x, y, r * 1.7, p.treeSpark, 0.16);
        }
        tShade(g, 0.10, 0.24); tVig(g, 0.28);
    }
}

function paintWater(g, p, st, phase, R) {
    const grd = g.createLinearGradient(0, 0, 0, 48);
    grd.addColorStop(0, p.waterDark); grd.addColorStop(0.5, p.waterDeep); grd.addColorStop(1, p.waterDark);
    g.fillStyle = grd; g.fillRect(0, 0, 48, 48);
    if (st === 0) {
        g.fillStyle = p.waterMid;
        for (let i = 0; i < 4; i++) {
            const y = (i * 12 + (phase ? 6 : 0)) % 48;
            g.fillRect(0, y, 48, 5);
            g.save(); g.globalAlpha = 0.55; g.fillStyle = p.waterFoam; g.fillRect(0, y, 48, 1.6); g.restore();
            g.save(); g.globalAlpha = 0.4; g.fillStyle = p.waterDark; g.fillRect(0, y + 4, 48, 1.4); g.restore();
        }
        g.fillStyle = p.waterFoam;
        for (let i = 0; i < 7; i++) {
            const x = (i * 17 + (phase ? 9 : 0)) % 44, y = (i * 7 + (phase ? 3 : 0)) % 46;
            g.fillRect(x, y, 9, 2);
            g.save(); g.globalAlpha = 0.5; g.fillRect(x + 2, y - 1, 5, 1); g.restore();
        }
        g.fillStyle = 'rgba(255,255,255,0.65)';
        for (let i = 0; i < 5; i++) {
            const x = (i * 23 + (phase ? 4 : 12)) % 44, y = (i * 13 + (phase ? 8 : 2)) % 46;
            g.fillRect(x, y, 5, 1);
        }
        tVig(g, 0.26);
    } else if (st === 1) {
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
            const on = ((x + y + phase) % 2) === 0;
            g.fillStyle = on ? p.waterMid : p.waterDeep;
            g.fillRect(x * 12 + 1, y * 12 + 1, 10, 10);
            if (on) {
                g.save(); g.globalAlpha = 0.6; g.fillStyle = p.waterFoam;
                g.fillRect(x * 12 + 4, y * 12 + 4, 4, 4); g.restore();
                tGlow(g, x * 12 + 6, y * 12 + 6, 6, p.waterFoam, 0.3);
            } else {
                g.save(); g.globalAlpha = 0.4; g.fillStyle = p.waterDark;
                g.fillRect(x * 12 + 3, y * 12 + 3, 6, 6); g.restore();
            }
        }
        g.save(); g.globalAlpha = 0.4; g.strokeStyle = p.waterFoam; g.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            g.beginPath(); g.moveTo(i * 12, 0); g.lineTo(i * 12, 48); g.stroke();
            g.beginPath(); g.moveTo(0, i * 12); g.lineTo(48, i * 12); g.stroke();
        }
        g.restore();
        tVig(g, 0.24);
    } else if (st === 2) {
        g.save(); g.globalAlpha = 0.35; g.fillStyle = p.waterDark;
        g.beginPath(); g.arc(24, 24, 22, 0, 7); g.fill(); g.restore();
        g.strokeStyle = p.waterMid; g.lineWidth = 3;
        for (let i = 0; i < 3; i++) { const r = 6 + i * 8 + phase * 3; g.beginPath(); g.arc(26, 22, r, 0, 7); g.stroke(); }
        g.save(); g.globalAlpha = 0.75; g.strokeStyle = p.waterFoam; g.lineWidth = 1.6;
        for (let i = 0; i < 3; i++) { const r = 9 + i * 8 + phase * 4; g.beginPath(); g.arc(13, 37, r, 0.5, 2.5); g.stroke(); }
        g.restore();
        g.save(); g.globalAlpha = 0.5; g.fillStyle = '#ffffff';
        for (let i = 0; i < 4; i++) { const x = (i * 13 + (phase ? 7 : 0)) % 42; g.fillRect(x + 3, (i * 11 + (phase ? 5 : 0)) % 42, 4, 1); }
        g.restore();
        tVig(g, 0.28);
    } else if (st === 3) {
        for (let i = 0; i < 8; i++) {
            const x = R() * 44, y = R() * 44, w = 8 + R() * 11, h = 5 + R() * 8;
            g.fillStyle = (i % 2) ? p.waterMid : p.waterFoam;
            g.globalAlpha = 0.42 + (((i + phase) % 2) ? 0.36 : 0);
            g.beginPath();
            g.moveTo(x, y); g.lineTo(x + w, y + h * 0.3); g.lineTo(x + w * 0.6, y + h); g.lineTo(x - w * 0.2, y + h * 0.7);
            g.closePath(); g.fill();
            g.globalAlpha = 0.6;
            g.strokeStyle = '#ffffff'; g.lineWidth = 1;
            g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h * 0.3); g.stroke();
        }
        g.globalAlpha = 0.28 + phase * 0.22;
        g.fillStyle = '#ffffff';
        for (let i = 0; i < 6; i++) g.fillRect(R() * 44, R() * 44, 3, 1);
        g.globalAlpha = 1;
        tVig(g, 0.22);
    } else if (st === 4) {
        g.fillStyle = p.waterMid;
        for (let i = 0; i < 4; i++) {
            const y = (i * 12 + phase * 5) % 48;
            g.fillRect(0, y, 48, 6);
            g.save(); g.globalAlpha = 0.4; g.fillStyle = p.waterFoam; g.fillRect(0, y, 48, 1.4); g.restore();
        }
        const lp = [[13, 14], [34, 33]];
        for (let i = 0; i < lp.length; i++) {
            const yy = lp[i][1] + (phase ? 1.6 : 0);
            g.save(); g.globalAlpha = 0.35; g.fillStyle = '#000';
            g.beginPath(); g.ellipse(lp[i][0] + 1, yy + 2, 8, 4, 0, 0, 7); g.fill(); g.restore();
            g.fillStyle = p.treeMid;
            g.beginPath(); g.arc(lp[i][0], yy, 7.5, 0.38, Math.PI * 2 - 0.12); g.closePath(); g.fill();
            g.save(); g.globalAlpha = 0.5; g.strokeStyle = p.treeLight; g.lineWidth = 1;
            g.beginPath(); g.arc(lp[i][0], yy, 7.5, 0.38, Math.PI * 2 - 0.12); g.stroke(); g.restore();
            g.fillStyle = p.treeLight;
            g.beginPath(); g.arc(lp[i][0] - 2, yy - 2, 2.4, 0, 7); g.fill();
            g.save(); g.globalAlpha = 0.4; g.strokeStyle = p.treeDark; g.lineWidth = 0.8;
            for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(lp[i][0], yy); g.lineTo(lp[i][0] + Math.cos(k * 1.6) * 7, yy + Math.sin(k * 1.6) * 7); g.stroke(); }
            g.restore();
        }
        g.save(); g.globalAlpha = 0.55; g.strokeStyle = p.waterFoam; g.lineWidth = 1;
        for (let i = 0; i < 3; i++) { const y = (i * 16 + phase * 8) % 48; g.beginPath(); g.moveTo(3, y); g.lineTo(19, y); g.stroke(); }
        g.restore();
        tVig(g, 0.24);
    } else {
        for (let i = 0; i < 7; i++) {
            const a = (i / 7) * Math.PI * 2 + phase * Math.PI;
            const x = 24 + Math.cos(a) * 13, y = 24 + Math.sin(a) * 13, r = 5 + ((i + phase) % 3) * 3.4;
            g.fillStyle = (i % 2) ? p.waterMid : p.waterFoam;
            g.globalAlpha = 0.42 + 0.32 * (((i + phase) % 2) ? 1 : 0);
            g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
            g.globalAlpha = 0.5;
            g.strokeStyle = '#ffffff'; g.lineWidth = 1;
            g.beginPath(); g.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.8); g.stroke();
            tGlow(g, x, y, r * 2.1, p.waterFoam, 0.16);
        }
        g.globalAlpha = 1;
        g.fillStyle = '#ffffff'; g.globalAlpha = 0.3 + phase * 0.24;
        g.beginPath(); g.arc(24, 24, 5, 0, 7); g.fill();
        g.globalAlpha = 1;
        tGlow(g, 24, 24, 18, p.waterFoam, 0.2);
        tVig(g, 0.24);
    }
    g.globalAlpha = 1;
}

function paintSand(g, p, st, phase, R) {
    const grd = g.createLinearGradient(0, 0, 0, 48);
    grd.addColorStop(0, p.sandLight); grd.addColorStop(0.5, p.sandBase); grd.addColorStop(1, p.sandShade);
    g.fillStyle = grd; g.fillRect(0, 0, 48, 48);
    if (st === 0) {
        g.fillStyle = p.sandDark;
        for (let i = 0; i < 6; i++) {
            const x = (i * 13 + (phase ? 7 : 0)) % 44, y = (i * 11 + (phase ? 5 : 0)) % 44;
            g.beginPath(); g.arc(x + 2, y + 2, 5 + ((i * 3) % 4), 0, 7); g.fill();
        }
        g.save(); g.globalAlpha = 0.5; g.fillStyle = p.sandLight;
        for (let i = 0; i < 6; i++) {
            const x = (i * 13 + (phase ? 7 : 0)) % 44, y = (i * 11 + (phase ? 5 : 0)) % 44;
            g.beginPath(); g.arc(x + 1, y + 1, 3 + ((i * 2) % 3), Math.PI, Math.PI * 1.9); g.fill();
        }
        g.restore();
        g.fillStyle = p.sandLight;
        for (let i = 0; i < 5; i++) { const y = (i * 10 + (phase ? 5 : 0)) % 46; g.fillRect((i * 9 + (phase ? 6 : 0)) % 40, y, 12, 2); }
        g.strokeStyle = p.sandSwirl; g.lineWidth = 2;
        g.beginPath(); g.arc(24 + (phase ? 3 : -3), 24, 10 + (phase ? 2 : 0), 0.4, 4.4); g.stroke();
        g.beginPath(); g.arc(24 + (phase ? 3 : -3), 24, 5 + (phase ? 1 : 0), 0.9, 5.2); g.stroke();
        g.save(); g.globalAlpha = 0.5; g.strokeStyle = p.sandLight; g.lineWidth = 1;
        g.beginPath(); g.arc(24 + (phase ? 3 : -3), 24, 11 + (phase ? 2 : 0), 0.5, 3.2); g.stroke(); g.restore();
        g.fillStyle = 'rgba(255,255,255,0.45)';
        for (let i = 0; i < 11; i++) g.fillRect((i * 17 + (phase ? 11 : 3)) % 46, (i * 23 + (phase ? 7 : 13)) % 46, 2, 2);
        tVig(g, 0.22);
    } else if (st === 1) {
        g.strokeStyle = p.sandDark; g.lineWidth = 1.6;
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
            const cx = x * 12 + 6 + ((y % 2) ? 6 : 0), cy = y * 12 + 6;
            g.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = i * Math.PI / 3 + (phase ? 0.12 : 0);
                const px = cx + Math.cos(a) * 6.3, py = cy + Math.sin(a) * 6.3;
                if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
            }
            g.closePath(); g.stroke();
            g.save(); g.globalAlpha = 0.35; g.fillStyle = p.sandLight;
            g.beginPath(); g.arc(cx - 1.5, cy - 1.5, 2.6, 0, 7); g.fill(); g.restore();
        }
        tSpeck(g, R, 14, p.sandLight, 2, 2);
        tSpeck(g, R, 10, p.sandShade, 1, 1);
        tShade(g, 0.08, 0.18); tVig(g, 0.24);
    } else if (st === 2) {
        const cracks = [[0, 10, 20, 2], [18, 10, 2, 14], [20, 22, 28, 2], [10, 24, 2, 24], [30, 2, 2, 20], [32, 34, 16, 2], [6, 40, 26, 2], [40, 20, 8, 2]];
        g.save(); g.globalAlpha = 0.45; g.fillStyle = p.sandLight;
        for (let i = 0; i < cracks.length; i++) { const c = cracks[i]; g.fillRect(c[0] + (phase ? 1 : 0), c[1] - 1, c[2], c[3]); }
        g.restore();
        g.fillStyle = p.sandShade;
        for (let i = 0; i < cracks.length; i++) { const c = cracks[i]; g.fillRect(c[0] + (phase ? 1 : 0), c[1], c[2], c[3]); }
        g.save(); g.globalAlpha = 0.35; g.strokeStyle = p.sandDark; g.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const x = R() * 44, y = R() * 44;
            g.beginPath(); g.moveTo(x, y); g.lineTo(x + R() * 12 - 6, y + R() * 12 - 6); g.stroke();
        }
        g.restore();
        for (let i = 0; i < 5; i++) {
            const x = 4 + R() * 38, y = 4 + R() * 38, r = 1.4 + R() * 2;
            g.fillStyle = p.sandShade; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
            g.save(); g.globalAlpha = 0.5; g.fillStyle = p.sandLight;
            g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, 7); g.fill(); g.restore();
        }
        tShade(g, 0.08, 0.20); tVig(g, 0.26);
    } else if (st === 3) {
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
            g.fillStyle = ((x + y + phase) % 2) ? p.sandLight : p.sandDark;
            g.fillRect(x * 6 + 2, y * 6 + 2, 2, 2);
        }
        g.save(); g.globalAlpha = 0.55; g.strokeStyle = p.sandLight; g.lineWidth = 1;
        for (let i = 0; i < 4; i++) { const y = (i * 12 + phase * 4) % 48; g.beginPath(); g.moveTo(0, y); g.lineTo(48, y + 6); g.stroke(); }
        g.globalAlpha = 0.3; g.strokeStyle = p.sandShade;
        for (let i = 0; i < 4; i++) { const y = (i * 12 + phase * 4 + 3) % 48; g.beginPath(); g.moveTo(0, y); g.lineTo(48, y - 5); g.stroke(); }
        g.restore();
        tSpeck(g, R, 12, 'rgba(255,255,255,0.55)', 1, 1);
        tShade(g, 0.10, 0.18); tVig(g, 0.22);
    } else if (st === 4) {
        g.save(); g.globalAlpha = 0.35; g.fillStyle = p.sandShade;
        for (let i = 0; i < 5; i++) { const x = R() * 36, y = R() * 36; g.beginPath(); g.ellipse(x + 6, y + 6, 7 + R() * 4, 4 + R() * 3, 0, 0, 7); g.fill(); }
        g.restore();
        for (let i = 0; i < 7; i++) {
            const x = R() * 40, y = R() * 40, r = 1.6 + R() * 2.4;
            g.fillStyle = p.sandDark; g.beginPath(); g.arc(x + 4, y + 4, r, 0, 7); g.fill();
            g.fillStyle = p.sandBase; g.beginPath(); g.arc(x + 4, y + 3.4, r * 0.9, 0, 7); g.fill();
            g.save(); g.globalAlpha = 0.6; g.fillStyle = p.sandLight;
            g.beginPath(); g.arc(x + 3.4, y + 3, r * 0.4, 0, 7); g.fill(); g.restore();
        }
        g.save(); g.globalAlpha = 0.5; g.strokeStyle = p.treeMid; g.lineWidth = 1.2;
        for (let i = 0; i < 6; i++) {
            const x = R() * 44, y = R() * 44;
            g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y - 5); g.moveTo(x, y); g.lineTo(x + 2, y - 4); g.stroke();
        }
        g.restore();
        g.fillStyle = p.sandSwirl; g.globalAlpha = 0.4 + phase * 0.2;
        g.fillRect(0, 22, 48, 2); g.globalAlpha = 1;
        tShade(g, 0.08, 0.22); tVig(g, 0.26);
    } else {
        g.fillStyle = p.sandDark;
        for (let i = 0; i < 4; i++) { const y = (i * 12 + phase * 4) % 48; g.fillRect(0, y, 48, 7); }
        g.save(); g.globalAlpha = 0.35; g.fillStyle = p.sandShade;
        for (let i = 0; i < 4; i++) { const y = (i * 12 + phase * 4) % 48; g.fillRect(0, y + 6, 48, 2); }
        g.restore();
        for (let i = 0; i < 10; i++) {
            const x = R() * 44, y = R() * 44;
            g.fillStyle = p.accent;
            g.globalAlpha = 0.3 + 0.55 * (((i + phase) % 2) ? 1 : 0);
            g.fillRect(x, y, 3, 3);
            tGlow(g, x + 1.5, y + 1.5, 6, p.accent, 0.2);
        }
        g.globalAlpha = 1;
        tSpeck(g, R, 12, 'rgba(255,255,255,0.22)', 1, 1);
        tShade(g, 0.06, 0.24); tVig(g, 0.30);
    }
    g.globalAlpha = 1;
}

function paintConcrete(g, R) {
    g.fillStyle = '#565c62'; g.fillRect(0, 0, 48, 48);
    bevelRect(g, 1, 1, 46, 46, '#8a9298', '#c0c8ce', '#3a4046', 3);
    g.fillStyle = '#9aa2a8';
    g.fillRect(6, 6, 16, 16); g.fillRect(26, 6, 16, 16); g.fillRect(6, 26, 16, 16); g.fillRect(26, 26, 16, 16);
    g.fillStyle = '#7d858c';
    g.fillRect(6, 18, 16, 4); g.fillRect(26, 18, 16, 4); g.fillRect(6, 38, 16, 4); g.fillRect(26, 38, 16, 4);
    g.strokeStyle = '#4a5056'; g.lineWidth = 2;
    g.strokeRect(5.5, 5.5, 17, 17); g.strokeRect(25.5, 5.5, 17, 17);
    g.strokeRect(5.5, 25.5, 17, 17); g.strokeRect(25.5, 25.5, 17, 17);
    tSpeck(g, R, 36, 'rgba(0,0,0,0.22)', 1, 1);
    tSpeck(g, R, 18, 'rgba(255,255,255,0.18)', 1, 1);
    tVig(g, 0.22);
}

function paintConcreteCracked(g, R) {
    paintConcrete(g, R);
    g.save(); g.lineCap = 'round';
    g.strokeStyle = 'rgba(20,24,28,0.9)'; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(8, 4); g.lineTo(14, 16); g.lineTo(10, 26); g.lineTo(20, 34); g.lineTo(16, 44);
    g.moveTo(30, 6); g.lineTo(26, 18); g.lineTo(36, 24); g.lineTo(32, 36); g.lineTo(42, 42);
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(9, 4); g.lineTo(15, 16); g.moveTo(31, 6); g.lineTo(27, 18); g.stroke();
    g.restore();
}

const EAGLE = [
    '....WWWW....', '....WGGW....', 'WW..WGGW..WW', 'WWW.WGGW.WWW', 'WWWWWWWWWWWW',
    '.WWGGGGGGWW.', '..WGGGGGGW..', '..GGDGGDGG..', '...GGGGGG...', '....GGGG....', '....G..G....', '...DDDDDD...'
];

function paintBase(g, p, st, dead) {
    g.fillStyle = dead ? p.frameDark : p.basePlate; g.fillRect(0, 0, 48, 48);
    g.save(); g.globalAlpha = 0.35; g.fillStyle = '#000';
    for (let i = 0; i < 10; i++) g.fillRect((i * 13) % 46, (i * 17) % 46, 2, 2);
    g.restore();
    if (st === 0) {
        g.fillStyle = dead ? '#2a2a30' : p.brickDark; g.fillRect(4, 40, 40, 8);
        g.save(); g.globalAlpha = 0.4; g.fillStyle = p.brickLight; g.fillRect(4, 40, 40, 2); g.restore();
    } else if (st === 1) {
        g.fillStyle = p.steelDark; g.fillRect(2, 38, 44, 10);
        g.fillStyle = p.steelLight; g.fillRect(2, 38, 44, 2);
        tRivet(g, 8, 43, 1.8, p.steelRivet, p.steelLight); tRivet(g, 40, 43, 1.8, p.steelRivet, p.steelLight);
    } else if (st === 2) {
        g.fillStyle = p.brickDark; g.fillRect(3, 39, 18, 9); g.fillRect(25, 39, 20, 9);
        g.save(); g.globalAlpha = 0.35; g.fillStyle = p.brickLight; g.fillRect(3, 39, 18, 2); g.fillRect(25, 39, 20, 2); g.restore();
    } else if (st === 3) {
        g.fillStyle = p.steelBase; g.beginPath(); g.moveTo(4, 48); g.lineTo(24, 33); g.lineTo(44, 48); g.closePath(); g.fill();
        g.save(); g.globalAlpha = 0.5; g.fillStyle = p.steelLight;
        g.beginPath(); g.moveTo(4, 48); g.lineTo(24, 33); g.lineTo(24, 38); g.lineTo(11, 48); g.closePath(); g.fill(); g.restore();
    } else if (st === 4) {
        g.fillStyle = p.brickBase; g.fillRect(3, 40, 42, 8);
        g.fillStyle = p.brickDark; g.fillRect(3, 43, 42, 1); g.fillRect(3, 46, 42, 1);
        tRivet(g, 7, 44, 1.2, p.brickShade, p.brickLight); tRivet(g, 41, 44, 1.2, p.brickShade, p.brickLight);
    } else {
        g.fillStyle = p.steelDark; g.fillRect(4, 40, 40, 8);
        g.strokeStyle = p.accent; g.lineWidth = 1.5; g.strokeRect(4.5, 40.5, 39, 7);
        tGlow(g, 24, 44, 14, p.accent, 0.25);
    }
    const cols = dead ? {W: '#7a7a80', G: '#5a5a60', D: '#3a3a40'} : {W: p.baseW, G: p.baseG, D: p.baseD};
    if (!dead) tGlow(g, 24, 20, 22, p.baseG, 0.22);
    for (let r = 0; r < EAGLE.length; r++) for (let cc = 0; cc < EAGLE[r].length; cc++) {
        const ch = EAGLE[r][cc];
        if (ch === '.') continue;
        g.fillStyle = cols[ch];
        g.fillRect(cc * 4, r * 3.5, 4, 4);
    }
    if (!dead) {
        g.save(); g.globalAlpha = 0.28; g.fillStyle = '#ffffff';
        g.fillRect(6, 4, 36, 3); g.fillRect(6, 4, 3, 20); g.restore();
    } else {
        g.strokeStyle = '#000'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(10, 8); g.lineTo(24, 24); g.lineTo(18, 40); g.stroke();
        g.beginPath(); g.moveTo(38, 6); g.lineTo(28, 20); g.lineTo(36, 36); g.stroke();
        g.save(); g.globalAlpha = 0.4; g.fillStyle = '#000'; g.fillRect(0, 0, 48, 48); g.restore();
    }
    tVig(g, dead ? 0.35 : 0.22);
}

const tileSprites = {};

function makeCanvas(fn) {
    const cv = document.createElement('canvas');
    cv.width = TILE; cv.height = TILE;
    const g = cv.getContext('2d');
    g.beginPath(); g.rect(0, 0, TILE, TILE); g.clip();
    fn(g);
    return cv;
}

function buildTileSprites(style, pal) {
    const st = ((style % TILE_STYLE_COUNT) + TILE_STYLE_COUNT) % TILE_STYLE_COUNT;
    const seed = randInt(1, 1000000);
    tileSprites.brick        = makeCanvas(g => { const R = rngFrom(seed); paintBrick(g, pal, st, R); });
    tileSprites.brickCracked = makeCanvas(g => { const R = rngFrom(seed); paintBrick(g, pal, st, R); paintCracks(g, pal); });
    tileSprites.steel        = makeCanvas(g => { const R = rngFrom(seed + 11); paintSteel(g, pal, st, R); });
    tileSprites.tree         = makeCanvas(g => { const R = rngFrom(seed + 23); paintTree(g, pal, st, R); });
    tileSprites.water0       = makeCanvas(g => { const R = rngFrom(seed + 37); paintWater(g, pal, st, 0, R); });
    tileSprites.water1       = makeCanvas(g => { const R = rngFrom(seed + 37); paintWater(g, pal, st, 1, R); });
    tileSprites.sand0        = makeCanvas(g => { const R = rngFrom(seed + 51); paintSand(g, pal, st, 0, R); });
    tileSprites.sand1        = makeCanvas(g => { const R = rngFrom(seed + 51); paintSand(g, pal, st, 1, R); });
    tileSprites.concrete     = makeCanvas(g => { const R = rngFrom(seed + 71); paintConcrete(g, R); });
    tileSprites.concreteCracked = makeCanvas(g => { const R = rngFrom(seed + 71); paintConcreteCracked(g, R); });
    tileSprites.base         = makeCanvas(g => paintBase(g, pal, st, false));
    tileSprites.baseDead     = makeCanvas(g => paintBase(g, pal, st, true));
    
    PAL = pal; TILE_STYLE = st;
    BRICK_DEBRIS = pal.brickDebris;
    STEEL_DEBRIS = pal.steelDebris;
    DUST_COL = pal.dustCol;
    SAND_COL = pal.sandCol;
}

function pickLevelTheme(level) {
    if (level <= 1) return {theme: CLASSIC_THEME, style: 0};
    if (Math.random() < CLASSIC_THEME_CHANCE) return {theme: CLASSIC_THEME, style: randInt(0, TILE_STYLE_COUNT - 1)};
    return {theme: randInt(0, THEMES.length - 1), style: randInt(0, TILE_STYLE_COUNT - 1)};
}

function applyLevelTheme(themeIdx, styleIdx) {
    const pal = (themeIdx === CLASSIC_THEME) ? makeClassicPalette() : makePalette(themeIdx);
    game.pal = pal;
    game.themeName = pal.name;
    game.styleIdx = ((styleIdx % TILE_STYLE_COUNT) + TILE_STYLE_COUNT) % TILE_STYLE_COUNT;
    game.styleName = STYLE_NAMES[game.styleIdx];
    buildTileSprites(game.styleIdx, pal);
}