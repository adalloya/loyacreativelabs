// ========================================================================
// APEX HYPERTROPHY OS - ZERO-LATENCY OFFLINE-FIRST DB (DEXIE.JS)
// ========================================================================

import Dexie, { Table } from "dexie";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface LocalExerciseLog {
    id?: number;
    user_id?: string;
    exercise_id: string;
    workout_date: string;
    set_number: number;
    weight_kg: number;
    reps_completed: number;
    rir_perceived?: number;
    mean_velocity_ms?: number;
    synced: number; // 0 = pending, 1 = synced
    created_at?: string;
}

class ApexDatabase extends Dexie {
    exercise_logs!: Table<LocalExerciseLog, number>;

    constructor() {
        super("ApexLocalDB");
        this.version(1).stores({
            exercise_logs: "++id, exercise_id, workout_date, set_number, synced, created_at"
        });
    }
}

export const localDb = new ApexDatabase();

/**
 * Guarda una serie en IndexedDB de forma ultra rápida (< 2ms).
 * Luego dispara sincronización silenciosa en segundo plano si hay red.
 */
export async function logSetOfflineFirst(log: Omit<LocalExerciseLog, "id" | "synced" | "created_at">) {
    const entry: LocalExerciseLog = {
        ...log,
        synced: 0,
        created_at: new Date().toISOString()
    };

    try {
        const id = await localDb.exercise_logs.add(entry);

        // Background sync non-blocking
        if (typeof window !== "undefined" && navigator.onLine && isSupabaseConfigured) {
            syncPendingLogsSilently().catch(() => {});
        }

        return id;
    } catch (e) {
        console.warn("[APEX DB] Error saving to IndexedDB:", e);
        return null;
    }
}

/**
 * Consulta el historial reciente de un ejercicio en memoria local
 */
export async function getLocalExerciseMemory(exerciseId: string): Promise<{ weight: number; reps: number } | null> {
    try {
        const lastLog = await localDb.exercise_logs
            .where("exercise_id")
            .equals(exerciseId)
            .reverse()
            .sortBy("created_at");

        if (lastLog && lastLog.length > 0) {
            return {
                weight: lastLog[0].weight_kg,
                reps: lastLog[0].reps_completed
            };
        }
    } catch (e) {
        console.warn("[APEX DB] Error reading local memory:", e);
    }
    return null;
}

/**
 * Sincronizador en segundo plano sin botones ni alertas para el usuario
 */
export async function syncPendingLogsSilently() {
    if (!isSupabaseConfigured || typeof window === "undefined" || !navigator.onLine) return;

    try {
        const pending = await localDb.exercise_logs.where("synced").equals(0).toArray();
        if (pending.length === 0) return;

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
                await localDb.exercise_logs.update(item.id, { synced: 1 });
            }
        }
    } catch (e) {
        // Silencio intencional (offline-first resilience)
    }
}

// Listener automático para reconexión de red
if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
        syncPendingLogsSilently();
    });
}
