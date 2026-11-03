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
  } = useVocalSession();

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#090A0F] text-white flex flex-col font-sans select-none">
      {/* ZONA 1: TOP STUDIO BAR (56px) - Hardware, Transporte Global & Tesitura */}
      <TopStudioBar />

      {/* ÁREA CENTRAL: DRAWER LATERAL + LIENZO DE AFINACIÓN */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* ZONA 2: LEFT CONTEXT DRAWER (320px Colapsable) */}
        <LeftContextDrawer />

        {/* ZONA 3: CENTER STAGE — LIENZO DE CURVA DE TONO & TELEPROMPTER */}
        <VocalPitchCanvas />
      </div>

      {/* ZONA 4: BOTTOM DOCK — GRAND PIANO INTERACTIVO DE ESTUDIO (165px) */}
      <InteractiveGrandPiano />

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
