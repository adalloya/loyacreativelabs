"use client";

import React from "react";
import { VocalSessionProvider, useVocalSession } from "@/store/vocalSessionStore";
import TopStudioBar from "@/components/studio/TopStudioBar";
import LeftContextDrawer from "@/components/studio/LeftContextDrawer";
import VocalPitchCanvas from "@/components/studio/VocalPitchCanvas";
import InteractiveGrandPiano from "@/components/studio/InteractiveGrandPiano";
import GuitarTunerModal from "@/components/GuitarTunerModal";

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

        {/* ZONA 3: CENTER STAGE — LIENZO DE CURVA DE TONO & TELEPROMPTER */}
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
      </div>

      {/* ZONA 4: BOTTOM DOCK — GRAND PIANO INTERACTIVO DE ESTUDIO (165px) */}
      <InteractiveGrandPiano
        detectedVoiceMidi={detectedVoiceMidi}
        voiceCentsOff={voiceCentsOff}
        lowestVocalMidi={vocalProfile.lowestMidi}
        passaggioVocalMidi={vocalProfile.passaggioMidi}
        highestVocalMidi={vocalProfile.highestMidi}
      />

      {/* MODAL / OVERLAY DE AFINADOR DE GUITARRA PRO */}
      <GuitarTunerModal
        isOpen={guitarTunerOpen}
        onClose={toggleGuitarTuner}
        currentPitch={currentPitch}
        isListening={isListening}
        onToggleMic={toggleMic}
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
