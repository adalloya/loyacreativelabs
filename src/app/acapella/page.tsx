"use client";

import React from "react";
import { VocalSessionProvider, useVocalSession } from "@/store/vocalSessionStore";
import TopStudioBar from "@/components/studio/TopStudioBar";
import LeftContextDrawer from "@/components/studio/LeftContextDrawer";
import VocalPitchCanvas from "@/components/studio/VocalPitchCanvas";
import InteractiveGrandPiano from "@/components/studio/InteractiveGrandPiano";
import GuitarTunerModal from "@/components/GuitarTunerModal";
import TeleprompterWindow from "@/components/studio/TeleprompterWindow";
import HorizontalTeleprompterRibbon from "@/components/studio/HorizontalTeleprompterRibbon";
import AlesisPianoStudioSection from "@/components/studio/AlesisPianoStudioSection";

function StudioWorkspace() {
  const {
    guitarTunerOpen,
    toggleGuitarTuner,
    currentPitch,
    isListening,
    toggleMic,
    samplesBuffer,
    comparisonSamples,
    targetBlocks,
    activeLyricCue,
    nextLyricCue,
    vocalProfile,
    sessionElapsedMs,
    activePhoneticTip,
    teleprompterOpen,
    toggleTeleprompter,
    alesisStudioOpen,
    setAlesisStudioOpen,
    activeSong,
    isPlayingSong,
    songTime,
    songDuration,
    togglePlaySong,
    seekSong,
    updateActiveSongLyrics,
  } = useVocalSession();

  const detectedVoiceMidi = currentPitch && currentPitch.clarity >= 0.65 ? currentPitch.midi : null;
  const voiceCentsOff = currentPitch ? currentPitch.cents : 0;

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#090A0F] text-white flex flex-col font-sans select-none">
      {/* ZONA 1: TOP STUDIO BAR (56px) - Hardware, Transporte Global & Tesitura */}
      <TopStudioBar />

      {/* ÁREA CENTRAL: DRAWER LATERAL + LIENZO DE AFINACIÓN */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* ZONA 2: LEFT CONTEXT DRAWER (320px Colapsable) */}
        <LeftContextDrawer />

        {/* ZONA 3: CENTER STAGE — SECCIÓN ESPECIAL ALESIS O LIENZO VOCAL */}
        <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          {alesisStudioOpen ? (
            <AlesisPianoStudioSection
              isEmbedded={true}
              onClose={() => setAlesisStudioOpen(false)}
            />
          ) : (
            <>
              {/* CINTA HORIZONTAL DE TELEPROMPTER CON ACORDES Y PANTALLA COMPLETA (SIEMPRE VISIBLE) */}
              <HorizontalTeleprompterRibbon
                activeSong={activeSong}
                isPlaying={isPlayingSong}
                songTime={songTime}
                songDuration={songDuration}
                onTogglePlay={togglePlaySong}
                onSeek={seekSong}
                onOpenFullscreen={toggleTeleprompter}
                onLoadSongLyrics={updateActiveSongLyrics}
              />

              {/* LIENZO DE CURVA DE TONO EN TIEMPO REAL A 60 FPS */}
              <VocalPitchCanvas
                samplesBuffer={samplesBuffer}
                comparisonSamples={comparisonSamples}
                targetBlocks={targetBlocks}
                activeLyricCue={activeLyricCue}
                nextLyricCue={nextLyricCue}
                vocalProfile={{
                  lowestMidi: vocalProfile.lowestMidi,
                  passaggioMidi: vocalProfile.passaggioMidi,
                  highestMidi: vocalProfile.highestMidi,
                }}
                sessionElapsedMs={sessionElapsedMs}
                activePhoneticTip={activePhoneticTip}
              />
            </>
          )}
        </div>
      </div>

      {/* ZONA 4: BOTTOM DOCK — GRAND PIANO INTERACTIVO DE ESTUDIO (165px) */}
      {!alesisStudioOpen && (
        <InteractiveGrandPiano
          detectedVoiceMidi={detectedVoiceMidi}
          voiceCentsOff={voiceCentsOff}
          lowestVocalMidi={vocalProfile.lowestMidi}
          passaggioVocalMidi={vocalProfile.passaggioMidi}
          highestVocalMidi={vocalProfile.highestMidi}
        />
      )}

      {/* MODAL / OVERLAY DE AFINADOR DE GUITARRA PRO */}
      <GuitarTunerModal
        isOpen={guitarTunerOpen}
        onClose={toggleGuitarTuner}
        currentPitch={currentPitch}
        isListening={isListening}
        onToggleMic={toggleMic}
      />

      {/* VENTANA DE TELEPROMPTER EN VIVO (LETRA HORIZONTAL & TIEMPOS) */}
      <TeleprompterWindow
        isOpen={teleprompterOpen}
        onClose={toggleTeleprompter}
        activeSong={activeSong}
        isPlaying={isPlayingSong}
        songTime={songTime}
        songDuration={songDuration}
        onTogglePlay={togglePlaySong}
        onSeek={seekSong}
        onLoadSongLyrics={updateActiveSongLyrics}
      />
    </div>
  );
}

export default function AcapellaApp() {
  return (
    <VocalSessionProvider>
      <StudioWorkspace />
    </VocalSessionProvider>
  );
}
