// src/components/studio/YouTubeLibraryImporter.tsx
import React, { useState, useRef } from 'react';
import {
  Youtube,
  Download,
  Loader2,
  CheckCircle2,
  Upload,
  Music2,
  Sparkles,
  Trash2,
  Play,
  Pause,
  Timer,
} from 'lucide-react';
import {
  StudyTrack,
  studyLibraryStorage,
  parseYouTubeTitle,
  fetchLyricsFromLrclib,
} from '../../services/studyLibraryStorage';

interface YouTubeLibraryImporterProps {
  tracks: StudyTrack[];
  activeTrackId?: string;
  isPlayingSong?: boolean;
  onTogglePlay?: () => void;
  onSelectTrack: (track: StudyTrack) => void;
  onTrackAdded: (track: StudyTrack) => void;
  onTrackDeleted: (id: string) => void;
  onOpenTapToSync?: (track: StudyTrack) => void;
}

type ImportStep = 'idle' | 'fetching-meta' | 'downloading-audio' | 'syncing-lyrics' | 'done' | 'error';

export const YouTubeLibraryImporter: React.FC<YouTubeLibraryImporterProps> = ({
  tracks,
  activeTrackId,
  isPlayingSong = false,
  onTogglePlay,
  onSelectTrack,
  onTrackAdded,
  onTrackDeleted,
  onOpenTapToSync,
}) => {
  const [ytUrl, setYtUrl] = useState('');
  const [step, setStep] = useState<ImportStep>('idle');
  const [statusText, setStatusText] = useState('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleYouTubeImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytUrl.trim()) return;

    try {
      setStep('fetching-meta');
      setDownloadProgress(15);
      setStatusText('Analizando enlace de YouTube...');

      // 1. Obtener metadatos del video
      const metaRes = await fetch(`/api/youtube-mp3?mode=meta&url=${encodeURIComponent(ytUrl.trim())}`);
      if (!metaRes.ok) throw new Error('No se pudo leer el video de YouTube');
      const meta = await metaRes.json();

      const { artist, title } = parseYouTubeTitle(meta.title, meta.uploader);

      // 2. Descargar el stream de audio MP3 con barra de progreso
      setStep('downloading-audio');
      setDownloadProgress(40);
      setStatusText(`Extrayendo MP3: "${title}"...`);

      const streamRes = await fetch(`/api/youtube-mp3?mode=stream&url=${encodeURIComponent(ytUrl.trim())}`);
      if (!streamRes.ok || !streamRes.body) throw new Error('Error al descargar el stream MP3');

      const reader = streamRes.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedBytes += value.length;
          // Progreso estimado basado en ~4MB promedio por canción
          const pct = Math.min(82, 40 + Math.round((receivedBytes / (4 * 1024 * 1024)) * 42));
          setDownloadProgress(pct);
        }
      }

      const audioBlob = new Blob(chunks as unknown as BlobPart[], { type: 'audio/mpeg' });
      if (audioBlob.size < 1024) {
        throw new Error('El archivo de audio descargado está vacío o incompleto. Intenta con otro enlace o sube un MP3 directo.');
      }

      // 3. Buscar y sincronizar letras automáticamente en LRCLIB para el Teleprompter
      setStep('syncing-lyrics');
      setDownloadProgress(90);
      setStatusText(`Sincronizando letras en LRCLIB para ${artist} - ${title}...`);

      const { syncedLyrics, plainLyrics } = await fetchLyricsFromLrclib(title, artist, meta.duration);

      // 4. Guardar en IndexedDB (Librería de Estudio) y activar en el Teleprompter
      const newTrack: StudyTrack = {
        id: `yt-${meta.id}-${Date.now()}`,
        title,
        artist,
        durationSec: meta.duration || 0,
        thumbnailUrl: meta.thumbnail,
        sourceUrl: ytUrl.trim(),
        audioBlob,
        syncedLyrics,
        plainLyrics,
        createdAt: Date.now(),
      };

      const savedTrack = await studyLibraryStorage.saveTrack(newTrack);
      onTrackAdded(savedTrack);
      onSelectTrack(savedTrack);

      setDownloadProgress(100);
      setStep('done');
      setStatusText(
        syncedLyrics.length > 0
          ? `¡Listo! Guardado con ${syncedLyrics.length} líneas sincronizadas`
          : '¡MP3 guardado en la librería! (Puedes usar Tap-to-Sync para la letra)'
      );
      setYtUrl('');

      setTimeout(() => {
        setStep('idle');
        setDownloadProgress(0);
      }, 3000);
    } catch (err: unknown) {
      setStep('error');
      const msg = err instanceof Error ? err.message : 'Error al importar desde YouTube';
      setStatusText(msg);
    }
  };

  // Subida manual de archivo MP3 local como alternativa rápida
  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('syncing-lyrics');
    setStatusText('Importando MP3 local y buscando letra en LRCLIB...');
    const rawName = file.name.replace(/\.[^/.]+$/, '');
    const { artist, title } = parseYouTubeTitle(rawName, 'Local Track');

    const { syncedLyrics, plainLyrics } = await fetchLyricsFromLrclib(title, artist);

    const newTrack: StudyTrack = {
      id: `local-${Date.now()}`,
      title,
      artist,
      durationSec: 0,
      thumbnailUrl: '',
      audioBlob: file,
      syncedLyrics,
      plainLyrics,
      createdAt: Date.now(),
    };

    const saved = await studyLibraryStorage.saveTrack(newTrack);
    onTrackAdded(saved);
    onSelectTrack(saved);
    setStep('idle');
  };

  return (
    <div className="flex flex-col h-full bg-[#11131A] text-slate-100 select-none">
      {/* CAJA DE IMPORTACIÓN DESDE YOUTUBE O MP3 LOCAL */}
      <div className="p-3.5 border-b border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Youtube className="w-4 h-4 text-rose-500" />
            Importador YouTube → Teleprompter
          </span>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
          >
            <Upload className="w-3 h-3" /> Subir MP3
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/m4a"
            onChange={handleLocalFileUpload}
            className="hidden"
          />
        </div>

        <form onSubmit={handleYouTubeImport} className="flex gap-1.5">
          <input
            type="url"
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            placeholder="Pega link de YouTube (Canción o Karaoke)..."
            disabled={step !== 'idle' && step !== 'error' && step !== 'done'}
            className="flex-1 bg-[#090A0F] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            type="submit"
            disabled={!ytUrl.trim() || (step !== 'idle' && step !== 'error' && step !== 'done')}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
          >
            {step === 'fetching-meta' || step === 'downloading-audio' || step === 'syncing-lyrics' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Guardar MP3</span>
          </button>
        </form>

        {/* Barra de estado de descarga y sincronización LRCLIB */}
        {step !== 'idle' && (
          <div className="bg-[#090A0F] border border-white/10 rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span
                className={
                  step === 'error'
                    ? 'text-rose-400'
                    : step === 'done'
                    ? 'text-emerald-400 flex items-center gap-1'
                    : 'text-blue-300'
                }
              >
                {step === 'done' && <CheckCircle2 className="w-3.5 h-3.5 inline" />}
                {statusText}
              </span>
              {downloadProgress > 0 && step !== 'error' && (
                <span className="text-slate-400">{downloadProgress}%</span>
              )}
            </div>
            {step !== 'error' && (
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* LISTA UNIFICADA: MI LIBRERÍA DE ESTUDIO & TELEPROMPTER */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Music2 className="w-3.5 h-3.5 text-blue-400" />
            Mi Librería de Estudio
          </span>
          <span className="text-[11px] font-mono text-slate-500">{tracks.length} pistas</span>
        </div>

        {tracks.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-white/10 rounded-xl text-xs text-slate-500">
            Pega cualquier enlace de YouTube arriba para descargar el MP3 y sincronizar su letra automáticamente en el Teleprompter.
          </div>
        ) : (
          tracks.map((track) => {
            const isSelected = track.id === activeTrackId;
            const isThisPlaying = isSelected && isPlayingSong;

            return (
              <div
                key={track.id}
                onClick={() => {
                  if (isSelected && onTogglePlay) {
                    onTogglePlay();
                  } else {
                    onSelectTrack(track);
                  }
                }}
                className={`group flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/50 shadow-sm'
                    : 'bg-[#090A0F]/60 border-white/5 hover:border-white/15 hover:bg-white/5'
                }`}
              >
                {/* Portada / Thumbnail con Play/Pause interactivo */}
                <div
                  className="relative w-11 h-11 rounded-lg bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSelected && onTogglePlay) {
                      onTogglePlay();
                    } else {
                      onSelectTrack(track);
                      setTimeout(() => {
                        onTogglePlay?.();
                      }, 50);
                    }
                  }}
                  title={isThisPlaying ? 'Pausar pista' : 'Reproducir pista'}
                >
                  {track.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <Music2 className="w-5 h-5 text-slate-500" />
                  )}
                  <div
                    className={`absolute inset-0 bg-black/50 flex items-center justify-center transition ${
                      isThisPlaying ? 'opacity-100 bg-emerald-950/70' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    ) : (
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    )}
                  </div>
                </div>

                {/* Metadatos y estado de Sincronización con Teleprompter */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{track.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {track.syncedLyrics.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <Sparkles className="w-2.5 h-2.5" /> Sincronizada ({track.syncedLyrics.length} líneas)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTrack(track);
                          onOpenTapToSync?.(track);
                        }}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition"
                        title="Abrir sincronizador de letra"
                      >
                        <Timer className="w-2.5 h-2.5" /> Sincronizar (Tap-to-Sync)
                      </button>
                    )}
                  </div>
                </div>

                {/* Botón eliminar de la librería */}
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await studyLibraryStorage.deleteTrack(track.id);
                    onTrackDeleted(track.id);
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                  title="Eliminar pista de la librería"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default YouTubeLibraryImporter;
