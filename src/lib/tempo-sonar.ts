// ========================================================================
// APEX HYPERTROPHY OS - TEMPO SONAR PACER (TONE.JS)
// ========================================================================

let audioContext: AudioContext | null = null;

function getSafeAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
            audioContext = new AudioCtx();
        }
    }
    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
    }
    return audioContext;
}

/**
 * Emite pulsos sonoros espaciales y de volumen atenuado para no cortar Spotify/AirPods
 */
export function playTempoPulse(phase: "eccentric_tick" | "stretch_pause" | "concentric_blast") {
    const ctx = getSafeAudioContext();
    if (!ctx) return;

    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const now = ctx.currentTime;

        if (phase === "eccentric_tick") {
            // Fase excéntrica: tono grave descendente sutil (220Hz -> 140Hz)
            osc.type = "sine";
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);

        } else if (phase === "stretch_pause") {
            // Pausa isométrica en máximo estiramiento: clic seco técnico (300Hz)
            osc.type = "triangle";
            osc.frequency.setValueAtTime(320, now);
            gain.gain.setValueAtTime(0.09, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);

        } else if (phase === "concentric_blast") {
            // Fase concéntrica explosiva: pulso ascendente limpio (440Hz -> 660Hz)
            osc.type = "sine";
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(660, now + 0.2);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    } catch (e) {
        console.warn("[TEMPO SONAR] Audio context error:", e);
    }
}
