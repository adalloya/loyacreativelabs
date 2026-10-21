'use client';

import React, { useState } from 'react';
import { Music, X, Disc3 } from 'lucide-react';

const WELDING_PLAYLISTS = [
  {
    id: 'tucanes',
    title: 'Los Tucanes de Tijuana · Éxitos de Taller',
    spotifyUri: 'https://open.spotify.com/embed/artist/6LuN9WXuMMjgyNN38ia5Nn?utm_source=generator&theme=0',
    genre: 'Norteñas / Regional',
  },
  {
    id: 'regional-pesado',
    title: 'Rolas Pesadas para Soldar (Corridos & Banda)',
    spotifyUri: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX8SZGwvEkPXh?utm_source=generator&theme=0',
    genre: 'Regional Mexicano',
  },
  {
    id: 'rock-industrial',
    title: 'Rock Pesado & Industrial (Concentración)',
    spotifyUri: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0',
    genre: 'Rock / Metal',
  },
];

export default function SpotifyWeldingPlayer() {
  const [activePlaylist, setActivePlaylist] = useState(WELDING_PLAYLISTS[0]);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2.5 rounded-full border border-yellow-400/40 bg-black/90 px-4 py-2.5 text-xs font-bold text-white shadow-2xl backdrop-blur-2xl transition hover:border-yellow-400 hover:scale-105"
        >
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <Disc3 size={15} className="text-yellow-400 animate-spin" />
          <span>Música para Soldar (Spotify)</span>
        </button>
      ) : (
        <div className="w-80 rounded-3xl border border-white/20 bg-black/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.95)] backdrop-blur-3xl text-zinc-100 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Taller Audio Stream
              </h4>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-zinc-400 hover:text-white transition"
              title="Minimizar"
            >
              <X size={15} />
            </button>
          </div>

          {/* Selector de Playlists */}
          <div className="space-y-1">
            {WELDING_PLAYLISTS.map((pl) => (
              <button
                key={pl.id}
                onClick={() => setActivePlaylist(pl)}
                className={`w-full text-left rounded-xl px-3 py-2 text-xs transition ${
                  activePlaylist.id === pl.id
                    ? 'bg-yellow-400 text-zinc-950 font-bold'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <div className="truncate">{pl.title}</div>
                <div className="text-[10px] opacity-75 font-mono">{pl.genre}</div>
              </button>
            ))}
          </div>

          {/* Widget Embebido */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50">
            <iframe
              src={activePlaylist.spotifyUri}
              width="100%"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Player"
            />
          </div>
        </div>
      )}
    </div>
  );
}
