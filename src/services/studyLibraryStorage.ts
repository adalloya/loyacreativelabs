// src/services/studyLibraryStorage.ts
import type { PhraseLineAnnotation } from '../components/studio/SongAnnotationEditor';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface SyncedLyricLine {
  timeMs: number;
  text: string;
}

export interface StudyTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  durationSec: number;
  thumbnailUrl: string;
  sourceUrl?: string;
  audioBlob: Blob;
  audioObjectUrl?: string; // Generado en memoria al cargar
  syncedLyrics: SyncedLyricLine[];
  plainLyrics?: string;
  annotations?: PhraseLineAnnotation[]; // Anotaciones compás por compás y sílaba por sílaba del profesor
  createdAt: number;
}

const DB_NAME = 'AcapellaStudioLibraryDB';
const STORE_NAME = 'tracks';
const DB_VERSION = 1;

function openLibraryDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Limpia títulos de YouTube (ej. "Enanitos Verdes - Lamento Boliviano (Video Oficial HD)" -> Artista y Título limpios)
export function parseYouTubeTitle(rawTitle: string, uploader: string): { artist: string; title: string } {
  const cleaned = rawTitle
    .replace(/\(.*?(official|oficial|video|audio|lyrics|letra|karaoke|hd|4k|remastered|live|en vivo).*?\)/gi, '')
    .replace(/\[.*?(official|oficial|video|audio|lyrics|letra|karaoke|hd|4k|remastered|live|en vivo).*?\]/gi, '')
    .trim();

  if (cleaned.includes(' - ')) {
    const [artistPart, ...titleParts] = cleaned.split(' - ');
    return {
      artist: artistPart.trim(),
      title: titleParts.join(' - ').trim(),
    };
  }

  return {
    artist: uploader.replace(/ - Topic$/i, '').replace(/VEVO$/i, '').trim(),
    title: cleaned,
  };
}

// Parsea formato estándar LRC "[00:14.20] Look at the stars" a milisegundos para el Teleprompter a 60 FPS
export function parseLrcToSyncedLines(lrcText: string): SyncedLyricLine[] {
  const lines = lrcText.split('\n');
  const result: SyncedLyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const text = line.replace(timeRegex, '').trim();
    let match: RegExpExecArray | null;
    timeRegex.lastIndex = 0;

    while ((match = timeRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const msPart = match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10);
      const totalMs = minutes * 60000 + seconds * 1000 + msPart;

      if (text) {
        result.push({ timeMs: totalMs, text });
      }
    }
  }

  return result.sort((a, b) => a.timeMs - b.timeMs);
}

// Busca automáticamente la letra sincronizada en LRCLIB al terminar de bajar el MP3 de YouTube
export async function fetchLyricsFromLrclib(
  title: string,
  artist: string,
  durationSec?: number
): Promise<{ syncedLyrics: SyncedLyricLine[]; plainLyrics?: string }> {
  try {
    const query = new URLSearchParams({ q: `${artist} ${title}`.trim() });
    const res = await fetch(`https://lrclib.net/api/search?${query.toString()}`);
    if (!res.ok) return { syncedLyrics: [] };

    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) return { syncedLyrics: [] };

    // Priorizar el resultado que tenga syncedLyrics y cuya duración coincida más
    const bestMatch =
      items.find((item: any) => item.syncedLyrics && durationSec && Math.abs(item.duration - durationSec) < 8) ||
      items.find((item: any) => item.syncedLyrics) ||
      items[0];

    const syncedLyrics = bestMatch?.syncedLyrics ? parseLrcToSyncedLines(bestMatch.syncedLyrics) : [];
    return {
      syncedLyrics,
      plainLyrics: bestMatch?.plainLyrics || undefined,
    };
  } catch (err) {
    console.warn('No se encontraron letras automáticas en LRCLIB:', err);
    return { syncedLyrics: [] };
  }
}

export const studyLibraryStorage = {
  async saveTrack(track: StudyTrack): Promise<StudyTrack> {
    const db = await openLibraryDB();
    const toStore = { ...track };
    delete toStore.audioObjectUrl; // No guardar blob URL efímero en IDB

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(toStore);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Sincronización en la nube (si la tabla 'songs' de Supabase está creada)
    if (isSupabaseConfigured) {
      try {
        await supabase.from('songs').upsert({
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album || null,
          duration: track.durationSec,
          cover_url: track.thumbnailUrl,
          audio_url: track.sourceUrl || '',
          synced_lyrics: track.syncedLyrics,
          plain_lyrics: track.plainLyrics || null,
          annotations: track.annotations || null,
          updated_at: new Date().toISOString(),
        });
      } catch {
        // Fallback offline silencioso si la tabla no está creada
      }
    }

    return {
      ...track,
      audioObjectUrl: URL.createObjectURL(track.audioBlob),
    };
  },

  async getAllTracks(): Promise<StudyTrack[]> {
    const db = await openLibraryDB();
    const tracks = await new Promise<StudyTrack[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    return tracks
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((t) => ({
        ...t,
        audioObjectUrl: URL.createObjectURL(t.audioBlob),
      }));
  },

  async deleteTrack(id: string): Promise<void> {
    const db = await openLibraryDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async saveTrackAnnotations(id: string, annotations: PhraseLineAnnotation[]): Promise<void> {
    const db = await openLibraryDB();
    const track = await new Promise<StudyTrack | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (track) {
      track.annotations = annotations;
      delete track.audioObjectUrl;
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(track);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      if (isSupabaseConfigured) {
        try {
          await supabase.from('songs').update({
            annotations: annotations,
            updated_at: new Date().toISOString(),
          }).eq('id', id);
        } catch {
          // Fallback offline
        }
      }
    }
  },
};
