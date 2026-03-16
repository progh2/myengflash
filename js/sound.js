/**
 * SoundEngine — Web Audio API 기반 효과음 엔진
 * 외부 파일 없이 순수 오실레이터로 효과음 생성
 */
class SoundEngine {
    constructor() {
        this._ctx = null;
        this.enabled = this._loadPref();
    }

    // AudioContext 지연 초기화 (최초 사용자 제스처 후 생성)
    _getCtx() {
        if (!this._ctx) {
            try {
                this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio API를 지원하지 않는 브라우저입니다.');
                return null;
            }
        }
        // suspended 상태면 resume
        if (this._ctx.state === 'suspended') this._ctx.resume();
        return this._ctx;
    }

    _loadPref() {
        try { return localStorage.getItem('sound_enabled') !== 'false'; }
        catch { return true; }
    }

    toggle() {
        this.enabled = !this.enabled;
        try { localStorage.setItem('sound_enabled', this.enabled); } catch {}
        return this.enabled;
    }

    // ─── 저수준 헬퍼 ─────────────────────────────────────────
    /**
     * @param {Array<{freq,dur,type,gain,delay}>} notes
     */
    _play(notes) {
        if (!this.enabled) return;
        const ctx = this._getCtx();
        if (!ctx) return;

        const now = ctx.currentTime;
        notes.forEach(({ freq, dur, type = 'sine', gain = 0.4, delay = 0 }) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now + delay);

            gainNode.gain.setValueAtTime(0, now + delay);
            gainNode.gain.linearRampToValueAtTime(gain, now + delay + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

            osc.start(now + delay);
            osc.stop(now + delay + dur + 0.05);
        });
    }

    // ─── 공개 효과음 API ─────────────────────────────────────

    /** 정답 — 밝고 경쾌한 상승 멜로디 */
    correct() {
        this._play([
            { freq: 523, dur: 0.12, gain: 0.35, delay: 0.00 },   // C5
            { freq: 659, dur: 0.12, gain: 0.35, delay: 0.10 },   // E5
            { freq: 784, dur: 0.20, gain: 0.40, delay: 0.20 },   // G5
        ]);
    }

    /** 오답 — 낮고 둔탁한 하강음 */
    wrong() {
        this._play([
            { freq: 330, dur: 0.15, type: 'sawtooth', gain: 0.25, delay: 0.00 },
            { freq: 247, dur: 0.25, type: 'sawtooth', gain: 0.20, delay: 0.12 },
        ]);
    }

    /** 별표 ON — 반짝이는 짧은 트릴 */
    starOn() {
        this._play([
            { freq: 1047, dur: 0.08, gain: 0.30, delay: 0.00 },
            { freq: 1319, dur: 0.10, gain: 0.30, delay: 0.07 },
        ]);
    }

    /** 별표 OFF — 살짝 내려가는 음 */
    starOff() {
        this._play([
            { freq: 880, dur: 0.08, gain: 0.20, delay: 0.00 },
            { freq: 698, dur: 0.12, gain: 0.15, delay: 0.07 },
        ]);
    }

    /** 학습 시작 — 활기찬 3연음 팡파레 */
    start() {
        this._play([
            { freq: 392, dur: 0.10, gain: 0.35, delay: 0.00 },   // G4
            { freq: 523, dur: 0.10, gain: 0.35, delay: 0.10 },   // C5
            { freq: 659, dur: 0.10, gain: 0.35, delay: 0.20 },   // E5
            { freq: 784, dur: 0.25, gain: 0.40, delay: 0.30 },   // G5
        ]);
    }

    /** 학습 완료 — 승리 팡파레 */
    finish() {
        this._play([
            { freq: 523, dur: 0.10, gain: 0.35, delay: 0.00 },
            { freq: 659, dur: 0.10, gain: 0.35, delay: 0.10 },
            { freq: 784, dur: 0.10, gain: 0.35, delay: 0.20 },
            { freq: 1047, dur: 0.35, gain: 0.45, delay: 0.30 },
            { freq: 784, dur: 0.12, gain: 0.30, delay: 0.65 },
            { freq: 1047, dur: 0.45, gain: 0.45, delay: 0.80 },
        ]);
    }

    /** 다음 단어 넘기기 — 부드러운 클릭 */
    next() {
        this._play([
            { freq: 660, dur: 0.08, type: 'triangle', gain: 0.25, delay: 0 },
        ]);
    }

    /** 별표 연습 시작 — 별 반짝이는 느낌 */
    starStudyStart() {
        this._play([
            { freq: 880,  dur: 0.10, gain: 0.30, delay: 0.00 },
            { freq: 1047, dur: 0.10, gain: 0.30, delay: 0.08 },
            { freq: 1319, dur: 0.10, gain: 0.30, delay: 0.16 },
            { freq: 1568, dur: 0.25, gain: 0.40, delay: 0.24 },
        ]);
    }
}

window.SoundEngine = SoundEngine;
