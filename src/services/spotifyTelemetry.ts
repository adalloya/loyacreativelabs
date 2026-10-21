// src/services/spotifyTelemetry.ts
"use client";

export type VisualizerMode = 'OFF' | 'CANVAS' | 'ORB' | 'WAVE' | 'APEX' | 'AURA' | 'TUNNEL' | 'VORTEX' | 'SPECTRUM';

// Caché en memoria de colores dominantes extraídos por URL para evitar reprocesamiento
const colorCache = new Map<string, string>();

/**
 * Convierte valores RGB a formato HEX estándar (#RRGGBB).
 */
export function rgbToHex(r: number, g: number, b: number): string {
    const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
    const toHex = (c: number) => clamp(c).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convierte un color HEX (#RRGGBB o #RGB) a objeto RGB numérico.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
        clean = clean.split("").map(c => c + c).join("");
    }
    const num = parseInt(clean, 16);
    if (isNaN(num)) return { r: 16, g: 185, b: 129 }; // Fallback verde APEX
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

// Extrae el color RGB dominante de la portada del álbum de Spotify sin bloquear el hilo principal
export async function extractAlbumAccentColor(imageUrl: string): Promise<string> {
  if (!imageUrl || typeof window === 'undefined') return '255, 42, 42'; // Fallback Rojo APEX
  if (colorCache.has(imageUrl)) {
    const hex = colorCache.get(imageUrl)!;
    const rgb = hexToRgb(hex);
    return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 16;
        canvas.height = 16;
        if (!ctx) return resolve('255, 42, 42');
        ctx.drawImage(img, 0, 0, 16, 16);
        const data = ctx.getImageData(0, 0, 16, 16).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          // Ignorar píxeles casi negros o casi blancos para obtener un color vibrante real
          if (brightness > 35 && brightness < 235) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }
        if (count > 0) {
          const avgR = Math.round(r / count);
          const avgG = Math.round(g / count);
          const avgB = Math.round(b / count);
          colorCache.set(imageUrl, rgbToHex(avgR, avgG, avgB));
          resolve(`${avgR}, ${avgG}, ${avgB}`);
        } else {
          colorCache.set(imageUrl, '#10B981');
          resolve('16, 185, 129'); // Esmeralda fallback
        }
      } catch {
        resolve('255, 42, 42');
      }
    };
    img.onerror = () => resolve('255, 42, 42');
  });
}

// Emite eventos globales desde las tarjetas de ejercicios (ej. al marcar Check en una serie o activar Tempo 3-1-1)
export function triggerWorkoutVisualizerEvent(
  type: 'SET_COMPLETED' | 'TEMPO_TOGGLE' | 'REST_END',
  payload?: { active?: boolean; restSeconds?: number }
) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('apex:visualizer-event', { detail: { type, ...payload } }));
  }
}

export async function extractDominantColor(
    imageUrl: string,
    fallbackHex: string = "#10B981"
): Promise<string> {
    if (!imageUrl || typeof window === "undefined") {
        return fallbackHex;
    }

    if (colorCache.has(imageUrl)) {
        return colorCache.get(imageUrl)!;
    }

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";

        const timeoutId = setTimeout(() => {
            resolve(fallbackHex);
        }, 1200);

        img.onload = () => {
            clearTimeout(timeoutId);
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (!ctx) {
                    resolve(fallbackHex);
                    return;
                }

                // Muestreamos a baja resolución (32x32) para rendimiento ultra rápido (<1ms)
                const sampleSize = 32;
                canvas.width = sampleSize;
                canvas.height = sampleSize;
                ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

                const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
                const data = imgData.data;

                let rSum = 0;
                let gSum = 0;
                let bSum = 0;
                let validPixels = 0;

                // Buscamos píxeles con saturación y brillo moderado para evitar negros puros o blancos quemados
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];

                    if (a < 128) continue;

                    // Descartar negros extremos y blancos puros
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    if (brightness > 20 && brightness < 235) {
                        // Priorizar píxeles con saturación de color
                        const max = Math.max(r, g, b);
                        const min = Math.min(r, g, b);
                        const delta = max - min;
                        const weight = delta > 30 ? 2 : 1;

                        rSum += r * weight;
                        gSum += g * weight;
                        bSum += b * weight;
                        validPixels += weight;
                    }
                }

                if (validPixels === 0) {
                    colorCache.set(imageUrl, fallbackHex);
                    resolve(fallbackHex);
                    return;
                }

                const avgR = rSum / validPixels;
                const avgG = gSum / validPixels;
                const avgB = bSum / validPixels;

                const dominant = rgbToHex(avgR, avgG, avgB);
                colorCache.set(imageUrl, dominant);
                resolve(dominant);
            } catch {
                resolve(fallbackHex);
            }
        };

        img.onerror = () => {
            clearTimeout(timeoutId);
            resolve(fallbackHex);
        };

        img.src = imageUrl;
    });
}

export interface BeatTelemetry {
    bpm: number;
    beatDurationMs: number;
    phase: number; // 0.0 a 1.0 dentro del beat actual
    pulse: number; // Valor normalizado 0.0 a 1.0 (pico de impacto en 1.0)
    isOnBeat: boolean; // Si está dentro de la ventana de impacto del compás
    intensity: number; // Modulación de escala para efectos visuales (1.0 a 1.35)
}

/**
 * Calcula la telemetría matemática y pulso de ritmo sincronizado con los BPM de la canción.
 * Permite que los shaders, partículas y luces oscilen matemáticamente al compás exacto de la música.
 */
export function calculateBeatTelemetry(
    progressMs: number,
    bpm: number = 135,
    isPlaying: boolean = false
): BeatTelemetry {
    const validBpm = Math.max(60, Math.min(220, bpm || 135));
    const beatDurationMs = (60 / validBpm) * 1000; // Ej: 120 BPM = 500ms por beat

    if (!isPlaying) {
        return {
            bpm: validBpm,
            beatDurationMs,
            phase: 0,
            pulse: 0.15,
            isOnBeat: false,
            intensity: 1.0
        };
    }

    const currentOffset = Math.max(0, progressMs);
    const phase = (currentOffset % beatDurationMs) / beatDurationMs;

    // Caída exponencial tipo decay de sintetizador / bombo de percusión
    const pulse = Math.exp(-phase * 3.8);
    const isOnBeat = phase < 0.18;
    const intensity = 1.0 + pulse * 0.35; // Escala entre 1.0x y 1.35x

    return {
        bpm: validBpm,
        beatDurationMs,
        phase,
        pulse,
        isOnBeat,
        intensity
    };
}
