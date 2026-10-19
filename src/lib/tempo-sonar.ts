// ========================================================================
// APEX HYPERTROPHY OS - ACOUSTIC TEMPO SONAR ENGINE (TONE.JS)
// ========================================================================

import * as Tone from "tone";

let synth: Tone.Synth | null = null;

// Registry of active interval timers by exercise ID
const activeTempoIntervals: Map<string, NodeJS.Timeout> = new Map();

/**
 * Inicializa y obtiene la instancia de Tone.Synth bajo demanda en el cliente
 */
async function getOrInitSynth(): Promise<Tone.Synth | null> {
    if (typeof window === "undefined") return null;

    try {
        // En los navegadores modernos, AudioContext requiere gesto del usuario
        if (Tone.context.state !== "running") {
            await Tone.start();
        }

        if (!synth) {
            synth = new Tone.Synth({
                oscillator: {
                    type: "sine"
                },
                envelope: {
                    attack: 0.005,
                    decay: 0.12,
                    sustain: 0.0,
                    release: 0.1
                }
            }).toDestination();

            // Atenuación suave (-8dB) para no saturar con música de fondo o AirPods
            synth.volume.value = -8;
        }

        return synth;
    } catch (e) {
        console.warn("[Tone.js] Error initializing synth:", e);
        return null;
    }
}

export type TempoPhase = "eccentric_tick" | "stretch_pause" | "concentric_blast";

/**
 * Emite los tonos exactos mediante Tone.Synth según la fase biomecánica:
 * - eccentric_tick: Tono descendente sutil (G3 -> D3)
 * - stretch_pause: Clic seco percusivo en estiramiento máximo (C6 seco)
 * - concentric_blast: Pulso ascendente explosivo (C4 -> G4)
 */
export async function playTempoPulse(phase: TempoPhase): Promise<void> {
    const s = await getOrInitSynth();
    if (!s) return;

    try {
        const now = Tone.now();

        if (phase === "eccentric_tick") {
            // Fase Excéntrica: Descenso controlado de tono (G3 -> D3)
            s.triggerAttack("G3", now);
            s.frequency.rampTo("D3", 0.15, now);
            s.triggerRelease(now + 0.15);
        } else if (phase === "stretch_pause") {
            // Pausa isométrica en estiramiento: Clic seco ultra corto
            s.triggerAttackRelease("C6", "32n", now);
        } else if (phase === "concentric_blast") {
            // Fase Concéntrica: Aceleración ascendente de tono (C4 -> G4)
            s.triggerAttack("C4", now);
            s.frequency.rampTo("G4", 0.18, now);
            s.triggerRelease(now + 0.18);
        }
    } catch (e) {
        console.warn("[Tone.js] Error triggering tempo pulse:", e);
    }
}

/**
 * Inicia el loop del metrónomo acústico biomecánico (3 segundos excéntrica, 1 pausa, 1 concéntrica)
 */
export function startTempoLoop(
    exerciseId: string,
    cadence = { eccentric: 3, pause: 1, concentric: 1 },
    onTick?: (phase: TempoPhase, count: number) => void
): void {
    stopTempoLoop(exerciseId);

    const totalSeconds = cadence.eccentric + cadence.pause + cadence.concentric;
    let currentSecond = 0;

    // Primer pulso inmediato
    playTempoPulse("eccentric_tick");
    if (onTick) onTick("eccentric_tick", 1);

    const interval = setInterval(() => {
        currentSecond = (currentSecond + 1) % totalSeconds;

        if (currentSecond < cadence.eccentric) {
            // Segundos de la excéntrica (1, 2, 3...)
            playTempoPulse("eccentric_tick");
            if (onTick) onTick("eccentric_tick", currentSecond + 1);
        } else if (currentSecond < cadence.eccentric + cadence.pause) {
            // Segundo de la pausa isométrica
            playTempoPulse("stretch_pause");
            if (onTick) onTick("stretch_pause", 1);
        } else {
            // Segundo de la concéntrica explosiva
            playTempoPulse("concentric_blast");
            if (onTick) onTick("concentric_blast", 1);
        }
    }, 1000);

    activeTempoIntervals.set(exerciseId, interval);
}

/**
 * Detiene el loop del metrónomo acústico para un ejercicio o para todos
 */
export function stopTempoLoop(exerciseId?: string): void {
    if (exerciseId) {
        const interval = activeTempoIntervals.get(exerciseId);
        if (interval) {
            clearInterval(interval);
            activeTempoIntervals.delete(exerciseId);
        }
    } else {
        activeTempoIntervals.forEach((interval) => clearInterval(interval));
        activeTempoIntervals.clear();
    }
}

/**
 * Comprueba si el sonar está activo para un ejercicio
 */
export function isTempoLoopActive(exerciseId: string): boolean {
    return activeTempoIntervals.has(exerciseId);
}
