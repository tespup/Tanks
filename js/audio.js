"use strict";

const Sound = {
    ctx: null, master: null, noiseBuf: null, muted: false,
    
    init() {
        if (this.ctx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try {
            this.ctx = new AC();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.40;
            this.master.connect(this.ctx.destination);
            
            const len = Math.floor(this.ctx.sampleRate);
            this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
            const d = this.noiseBuf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        } catch (e) { this.ctx = null; }
    },
    
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            try { this.ctx.resume(); } catch (e) {}
        }
    },
    
    tone(f0, f1, dur, type, vol, delay) {
        if (!this.ctx || this.muted) return;
        this.toneAtSweep(f0, f1, dur, type || 'square', vol || 0.2, this.ctx.currentTime + (delay || 0));
    },
    
    toneAt(f, dur, type, vol, when) {
        if (!this.ctx || this.muted) return;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type || 'square'; o.frequency.value = Math.max(f, 1);
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), when + 0.012);
        g.gain.exponentialRampToValueAtTime(0.001, when + dur);
        o.connect(g); g.connect(this.master); o.start(when); o.stop(when + dur + 0.03);
    },
    
    toneAtSweep(f0, f1, dur, type, vol, when) {
        if (!this.ctx || this.muted) return;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type || 'square';
        o.frequency.setValueAtTime(Math.max(f0, 1), when);
        o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), when + dur);
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), when + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, when + dur);
        o.connect(g); g.connect(this.master); o.start(when); o.stop(when + dur + 0.03);
    },
    
    noise(dur, freq, vol, delay, type) {
        if (!this.ctx || this.muted || !this.noiseBuf) return;
        this.noiseAt(dur, freq, vol, this.ctx.currentTime + (delay || 0), type);
    },
    
    noiseAt(dur, freq, vol, when, type) {
        if (!this.ctx || this.muted || !this.noiseBuf) return;
        const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
        const f = this.ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(Math.max(vol, 0.0002), when);
        g.gain.exponentialRampToValueAtTime(0.001, when + dur);
        s.connect(f); f.connect(g); g.connect(this.master);
        s.start(when); s.stop(when + dur + 0.03);
    },
    
    kickAt(w) { this.toneAtSweep(150, 44, 0.13, 'sine', 0.13, w); this.noiseAt(0.05, 320, 0.05, w); },
    snareAt(w) { this.noiseAt(0.10, 1800, 0.055, w, 'highpass'); this.toneAt(210, 0.05, 'triangle', 0.028, w); },
    hatAt(w) { this.noiseAt(0.028, 7200, 0.017, w, 'highpass'); },
    
    shoot() { this.tone(880, 200, 0.09, 'square', 0.045); },
    enemyShoot() { this.tone(460, 150, 0.09, 'square', 0.06); },
    bossShoot() { this.tone(300, 80, 0.18, 'sawtooth', 0.13); this.noise(0.07, 700, 0.1); },
    turretShoot() { this.tone(170, 60, 0.3, 'square', 0.12); this.noise(0.12, 500, 0.1); },
    brick() { this.noise(0.16, 1400, 0.24); this.tone(300, 110, 0.08, 'square', 0.07); },
    crack() { this.noise(0.08, 900, 0.18); this.tone(200, 100, 0.06, 'square', 0.06); },
    steel() { this.tone(1700, 900, 0.05, 'triangle', 0.1); this.noise(0.04, 3500, 0.07); },
    shieldHit() { this.tone(1200, 500, 0.12, 'triangle', 0.15); this.tone(1800, 900, 0.1, 'sine', 0.09, 0.04); },
    pop() { this.noise(0.1, 2400, 0.18); this.tone(1250, 320, 0.07, 'square', 0.09); },
    sand() { this.noise(0.14, 420, 0.11); },
    digStart() { this.tone(180, 90, 0.5, 'sawtooth', 0.1); this.noise(0.55, 320, 0.09); },
    buildDone() { [440, 660, 880].forEach((f, i) => this.tone(f, f, 0.09, 'square', 0.12, i * 0.07)); this.noise(0.16, 1200, 0.14, 0.2); },
    buildFail() { this.tone(230, 110, 0.18, 'square', 0.1); },
    modeSwitch() { this.tone(600, 1200, 0.1, 'square', 0.1); this.tone(1200, 620, 0.1, 'square', 0.08, 0.1); },
    menuMove() { this.tone(720, 720, 0.04, 'square', 0.06); },
    menuSelect() { this.tone(880, 1320, 0.09, 'square', 0.1); },
    menuBack() { this.tone(620, 300, 0.09, 'square', 0.08); },
    boomSmall() { this.noise(0.25, 900, 0.28); this.tone(220, 55, 0.2, 'square', 0.12); },
    boomBig() { this.noise(0.55, 480, 0.45); this.tone(150, 28, 0.5, 'square', 0.2); },
    hitArmor() { this.tone(1300, 420, 0.06, 'square', 0.09); },
    stun() { this.tone(300, 150, 0.25, 'sawtooth', 0.11); this.tone(240, 120, 0.25, 'square', 0.07, 0.06); },
    powerup() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.09, 'square', 0.11, i * 0.07)); },
    upgrade() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, f, 0.1, 'square', 0.12, i * 0.06)); },
    commander() { [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, f, 0.12, 'square', 0.13, i * 0.07)); this.noise(0.5, 1200, 0.12, 0.2); },
    armorUp() { [330, 440, 550, 660].forEach((f, i) => this.tone(f, f, 0.12, 'triangle', 0.14, i * 0.08)); this.noise(0.2, 400, 0.1, 0.1); },
    spawn() { this.tone(280, 920, 0.2, 'sine', 0.08); },
    respawn() { [440, 660, 880].forEach((f, i) => this.tone(f, f, 0.08, 'triangle', 0.1, i * 0.06)); },
    teleport() { this.tone(150, 1400, 0.22, 'triangle', 0.12); this.tone(1400, 300, 0.22, 'triangle', 0.08, 0.08); this.noise(0.18, 1600, 0.08, 0.04); },
    bossDeath() { this.noise(1.1, 600, 0.45); [220, 180, 140, 110, 80].forEach((f, i) => this.tone(f, f * 0.6, 0.3, 'square', 0.18, i * 0.16)); },
    bossSiren() { for (let i = 0; i < 5; i++) { this.tone(180, 640, 0.48, 'sawtooth', 0.15, i * 1.0); this.tone(640, 180, 0.48, 'sawtooth', 0.13, i * 1.0 + 0.5); } },
    levelClear() { [523, 587, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.13, 'square', 0.11, i * 0.09)); },
    victory() { [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, f, 0.2, 'square', 0.14, i * 0.14)); },
    gameOver() { [392, 330, 262, 196, 147].forEach((f, i) => this.tone(f, f * 0.92, 0.28, 'triangle', 0.16, i * 0.22)); },
    life() { [660, 880, 1100].forEach((f, i) => this.tone(f, f, 0.1, 'square', 0.1, i * 0.08)); }
};

// Музыкальные паттерны
const CHORD_TYPES = {
    maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], sus: [0, 5, 7],
    maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], dom7: [0, 4, 7, 10]
};
const BASS_PAT = {
    A: [0, -1, -1, 0, -1, 7, -1, 0], B: [0, -1, 7, -1, 0, -1, 12, -1],
    C: [0, 0, -1, 7, -1, 0, -1, 5], D: [0, -1, -1, 12, -1, 7, -1, 0]
};
const ARP_PAT = [[0, 1, 2, 1, 0, 1, 2, 3], [0, 2, 1, 2, 3, 2, 1, 0], [0, 1, 2, 3, 2, 3, 1, 2]];
const DRUM_PAT = [
    {kick: [0, 4], snare: [2, 6], hat: [1, 3, 5, 7]},
    {kick: [0, 3, 4], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7]},
    {kick: [0, 4, 6], snare: [2, 6], hat: [1, 3, 5, 7]}
];

const MELODIES = [
    {name: 'МАРШ ГЕРОЯ', bpm: 152, bass: 'A', arp: 0, drum: 0, chords: [[48, 'min'], [44, 'maj'], [46, 'maj'], [48, 'min']], lead: [72, 0, 75, 72, 0, 70, 72, 0, 68, 0, 72, 68, 0, 65, 67, 0, 70, 0, 74, 70, 0, 68, 70, 0, 72, 0, 75, 79, 77, 75, 72, 0]},
    {name: 'НОЧНОЙ РЕЙД', bpm: 140, bass: 'B', arp: 1, drum: 1, chords: [[45, 'min'], [41, 'maj'], [43, 'maj'], [45, 'min']], lead: [69, 72, 76, 72, 69, 0, 64, 0, 65, 69, 72, 69, 65, 0, 62, 0, 67, 71, 74, 71, 67, 0, 64, 0, 69, 72, 76, 79, 76, 72, 69, 0]},
    {name: 'СТАЛЬНОЙ ПОТОК', bpm: 160, bass: 'C', arp: 2, drum: 2, chords: [[50, 'min'], [48, 'maj'], [50, 'min'], [46, 'maj']], lead: [74, 0, 77, 79, 0, 77, 74, 72, 74, 0, 77, 79, 81, 0, 79, 0, 72, 0, 74, 76, 0, 74, 72, 69, 70, 72, 74, 77, 79, 77, 74, 0]},
    {name: 'ТРЕВОГА', bpm: 148, bass: 'D', arp: 1, drum: 0, chords: [[52, 'min'], [48, 'maj'], [45, 'min'], [47, 'dom7']], lead: [76, 0, 75, 76, 79, 0, 76, 0, 74, 0, 72, 74, 76, 0, 0, 0, 71, 0, 72, 71, 69, 0, 71, 0, 76, 79, 83, 79, 76, 0, 74, 0]},
    {name: 'ВЕСЁЛЫЙ БОЙ', bpm: 168, bass: 'A', arp: 2, drum: 1, chords: [[55, 'maj'], [53, 'maj'], [48, 'maj'], [55, 'maj']], lead: [79, 0, 81, 83, 0, 81, 79, 78, 79, 0, 83, 86, 84, 83, 79, 0, 77, 0, 79, 81, 0, 79, 77, 76, 79, 81, 83, 86, 88, 86, 83, 0]},
    {name: 'СВЕТЛЫЙ ПУТЬ', bpm: 144, bass: 'B', arp: 0, drum: 0, chords: [[53, 'maj'], [50, 'min'], [46, 'maj'], [48, 'maj']], lead: [77, 0, 79, 81, 84, 0, 81, 0, 79, 0, 77, 79, 81, 0, 0, 0, 74, 0, 77, 79, 81, 0, 77, 0, 79, 81, 84, 86, 84, 81, 77, 0]},
    {name: 'ТЁМНАЯ КРЕПОСТЬ', bpm: 136, bass: 'C', arp: 1, drum: 2, chords: [[47, 'min'], [43, 'maj'], [40, 'min'], [42, 'maj']], lead: [71, 0, 74, 73, 71, 0, 69, 0, 67, 0, 71, 74, 76, 0, 74, 0, 71, 0, 69, 67, 66, 0, 67, 0, 71, 74, 78, 74, 71, 0, 0, 0]},
    {name: 'ПОБЕДНЫЙ МАРШ', bpm: 156, bass: 'A', arp: 2, drum: 1, chords: [[48, 'maj'], [45, 'min'], [41, 'maj'], [43, 'maj']], lead: [72, 76, 79, 76, 72, 0, 76, 0, 79, 84, 83, 79, 76, 0, 72, 0, 69, 72, 76, 72, 69, 0, 65, 0, 77, 81, 79, 77, 79, 76, 72, 0]},
    {name: 'ПОГОНЯ', bpm: 172, bass: 'D', arp: 0, drum: 2, chords: [[50, 'min'], [46, 'maj'], [48, 'maj'], [50, 'min']], lead: [74, 0, 77, 0, 79, 77, 74, 72, 74, 0, 77, 0, 81, 0, 79, 0, 70, 0, 74, 0, 77, 74, 70, 68, 72, 0, 74, 0, 77, 79, 77, 74]},
    {name: 'ФИНАЛ', bpm: 150, bass: 'B', arp: 1, drum: 0, chords: [[52, 'maj'], [49, 'min'], [45, 'maj'], [47, 'maj']], lead: [76, 0, 80, 83, 0, 80, 76, 0, 78, 0, 80, 83, 85, 0, 83, 0, 80, 0, 83, 87, 0, 83, 80, 0, 83, 85, 88, 87, 83, 80, 76, 0]}
];

const MUSIC_STEPS = 32;

const Music = {
    idx: 0, step: 0, nextTime: 0, stepDur: 0.2, active: false, enabled: true,
    
    midi(m) { return 440 * Math.pow(2, (m - 69) / 12); },
    
    start(idx) {
        if (!Sound.ctx) return;
        this.idx = ((idx % MELODIES.length) + MELODIES.length) % MELODIES.length;
        this.step = 0;
        this.stepDur = 60 / MELODIES[this.idx].bpm / 2;
        this.nextTime = Sound.ctx.currentTime + 0.12;
        this.active = true;
    },
    
    stop() { this.active = false; },
    
    update() {
        if (!this.active || !this.enabled || !Sound.ctx || Sound.muted) return;
        const now = Sound.ctx.currentTime;
        if (this.nextTime < now - 0.4) this.nextTime = now + 0.06;
        
        const M = MELODIES[this.idx];
        const bp = BASS_PAT[M.bass] || BASS_PAT.A;
        const ap = ARP_PAT[M.arp % ARP_PAT.length];
        const dp = DRUM_PAT[M.drum % DRUM_PAT.length];
        
        let guard = 0;
        while (this.nextTime < now + 0.32 && guard++ < 80) {
            const s = this.step % MUSIC_STEPS;
            const bar = Math.floor(s / 8), sb = s % 8;
            const ch = M.chords[bar % M.chords.length];
            const tones = CHORD_TYPES[ch[1]] || CHORD_TYPES.min;
            const w = this.nextTime, sd = this.stepDur;
            const ln = M.lead[s];
            
            if (ln > 0) {
                Sound.toneAt(this.midi(ln), sd * 0.88, 'square', 0.042, w);
                Sound.toneAt(this.midi(ln - 12), sd * 0.8, 'triangle', 0.026, w);
            }
            
            const bo = bp[sb];
            if (bo >= 0) Sound.toneAt(this.midi(ch[0] + bo), sd * 1.05, 'triangle', 0.075, w);
            
            const ai = ap[sb] % tones.length;
            Sound.toneAt(this.midi(ch[0] + 12 + tones[ai]), sd * 0.42, 'square', 0.017, w);
            
            if (dp.kick.indexOf(sb) >= 0) Sound.kickAt(w);
            if (dp.snare.indexOf(sb) >= 0) Sound.snareAt(w);
            if (dp.hat.indexOf(sb) >= 0) Sound.hatAt(w);
            
            this.step++;
            this.nextTime += sd;
        }
    }
};