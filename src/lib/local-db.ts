// ========================================================================
// APEX HYPERTROPHY OS - ZERO-LATENCY OFFLINE-FIRST DB (DEXIE.JS)
// ========================================================================

import Dexie, { type Table } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface ExerciseLog {
    id?: number;
    user_id?: string;
    exercise_id: string;
    workout_date: string;
    set_number: number;
    weight_kg: number;
    reps_completed: number;
    rir_perceived?: number;
    mean_velocity_ms?: number;
    synced: number; // 0 = pending sync, 1 = synced to cloud
    created_at?: string;
}

export type LocalExerciseLog = ExerciseLog;

export class ApexLocalDB extends Dexie {
    exercise_logs!: Table<ExerciseLog, number>;

    constructor() {
        super("ApexLocalDB");
        this.version(1).stores({
            exercise_logs: "++id, exercise_id, workout_date, set_number, synced, created_at"
        });
    }
}

// Singleton database instance
export const db = new ApexLocalDB();
export const localDb = db;

/**
 * Guarda una serie en IndexedDB de forma instantánea (< 2ms).
 * Si hay conexión activa a internet, sincroniza silenciosamente con Supabase.
 */
export async function logSetOfflineFirst(
    log: Omit<ExerciseLog, "id" | "synced" | "created_at">
): Promise<number | null> {
    const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const entry: ExerciseLog = {
        ...log,
        synced: 0,
        created_at: new Date().toISOString()
    };

    try {
        const id = await db.exercise_logs.add(entry);
        const duration = typeof performance !== "undefined" ? (performance.now() - startTime).toFixed(2) : "0";

        if (process.env.NODE_ENV === "development") {
            console.log(`[Dexie.js] Serie guardada en IndexedDB en ${duration}ms (ID: ${id})`);
        }

        // Si el cliente está online, dispara sincronización no bloqueante
        if (typeof window !== "undefined" && navigator.onLine && isSupabaseConfigured) {
            syncPendingLogsSilently().catch(() => {});
        }

        return id;
    } catch (error) {
        console.error("[Dexie.js Error] Fallo al escribir en IndexedDB:", error);
        return null;
    }
}

/**
 * Consulta el último registro de peso y reps de un ejercicio específico desde IndexedDB
 */
export async function getLocalExerciseMemory(
    exerciseId: string
): Promise<{ weight: number; reps: number } | null> {
    try {
        const logs = await db.exercise_logs
            .where("exercise_id")
            .equals(exerciseId)
            .reverse()
            .sortBy("created_at");

        if (logs && logs.length > 0) {
            return {
                weight: logs[0].weight_kg,
                reps: logs[0].reps_completed
            };
        }
    } catch (e) {
        console.warn("[Dexie.js] Error al consultar memoria local:", e);
    }
    return null;
}

/**
 * Motor de sincronización en segundo plano con Supabase.
 * Lee todos los registros con synced=0 y los inserta en la nube.
 */
export async function syncPendingLogsSilently(): Promise<number> {
    if (!isSupabaseConfigured || typeof window === "undefined" || !navigator.onLine) {
        return 0;
    }

    try {
        const pending = await db.exercise_logs.where("synced").equals(0).toArray();
        if (pending.length === 0) return 0;

        let syncedCount = 0;

        for (const item of pending) {
            const { error } = await supabase.from("exercise_logs").insert({
                exercise_id: item.exercise_id,
                workout_date: item.workout_date,
                set_number: item.set_number,
                weight_kg: item.weight_kg,
                reps_completed: item.reps_completed,
                rir_perceived: item.rir_perceived,
                mean_velocity_ms: item.mean_velocity_ms
            });

            if (!error && item.id) {
                await db.exercise_logs.update(item.id, { synced: 1 });
                syncedCount++;
            }
        }

        return syncedCount;
    } catch (err) {
        // Tolerancia a fallos de red en modo offline-first
        return 0;
    }
}

/**
 * Hook reactivo para consultar registros del día en tiempo real
 */
export function useApexExerciseLogs(workoutDate?: string) {
    return useLiveQuery(() => {
        if (workoutDate) {
            return db.exercise_logs.where("workout_date").equals(workoutDate).toArray();
        }
        return db.exercise_logs.toArray();
    }, [workoutDate]);
}

/**
 * Hook reactivo para consultar historial de un ejercicio
 */
export function useApexExerciseHistory(exerciseId: string) {
    return useLiveQuery(() => {
        return db.exercise_logs
            .where("exercise_id")
            .equals(exerciseId)
            .reverse()
            .sortBy("created_at");
    }, [exerciseId]);
}

// Listener real de red: en cuanto se detecta conexión a internet, sincroniza la cola
if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
        syncPendingLogsSilently();
    });
}
