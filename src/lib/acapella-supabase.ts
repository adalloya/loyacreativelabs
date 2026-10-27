import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface AcapellaTakeRecord {
  id: string;
  title: string;
  timestamp: string;
  durationSec: number;
  avgAccuracy: number;
  dominantNote: string;
  audioUrl?: string;
  audioBase64?: string;
  aiDiagnosis?: string;
  created_at?: string;
}

const LOCAL_STORAGE_KEY = "acapella_vocal_takes_v1";

/**
 * Cargar tomas guardadas con estrategia offline-first (LocalStorage + Supabase sync)
 */
export async function loadSavedTakes(): Promise<AcapellaTakeRecord[]> {
  let localTakes: AcapellaTakeRecord[] = [];
  
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        localTakes = JSON.parse(raw);
      }
    } catch (e) {
      console.warn("[Acapella] Error reading local takes:", e);
    }
  }

  // Si Supabase está disponible, intentar traer del cloud
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("acapella_takes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data && data.length > 0) {
        // Unir datos de Supabase con los locales (evitando duplicados)
        const cloudIds = new Set(data.map((d: any) => d.id));
        const merged = [
          ...data.map((d: any) => ({
            id: d.id,
            title: d.title,
            timestamp: d.timestamp || new Date(d.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            durationSec: d.duration_sec || d.durationSec || 0,
            avgAccuracy: d.avg_accuracy || d.avgAccuracy || 0,
            dominantNote: d.dominant_note || d.dominantNote || "C3",
            aiDiagnosis: d.ai_diagnosis || d.aiDiagnosis,
            audioUrl: d.audio_url || d.audioUrl,
          })),
          ...localTakes.filter((lt) => !cloudIds.has(lt.id)),
        ];
        return merged;
      }
    } catch (err) {
      console.warn("[Acapella] Supabase table query fallback to local:", err);
    }
  }

  return localTakes;
}

/**
 * Guardar una nueva toma en LocalStorage y sincronizar con Supabase
 */
export async function persistTake(take: AcapellaTakeRecord): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const existing: AcapellaTakeRecord[] = raw ? JSON.parse(raw) : [];
      const updated = [take, ...existing.filter((t) => t.id !== take.id)];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
    } catch (e) {
      console.warn("[Acapella] Local storage save error:", e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from("acapella_takes").insert({
        id: take.id,
        title: take.title,
        timestamp: take.timestamp,
        duration_sec: take.durationSec,
        avg_accuracy: take.avgAccuracy,
        dominant_note: take.dominantNote,
        ai_diagnosis: take.aiDiagnosis || null,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("[Acapella] Supabase silent insert fallback:", err);
    }
  }
}

/**
 * Eliminar una toma
 */
export async function removeTake(takeId: string): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const existing: AcapellaTakeRecord[] = JSON.parse(raw);
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(existing.filter((t) => t.id !== takeId))
        );
      }
    } catch (e) {
      console.warn("[Acapella] Local storage delete error:", e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from("acapella_takes").delete().eq("id", takeId);
    } catch (err) {
      console.warn("[Acapella] Supabase delete fallback:", err);
    }
  }
}
