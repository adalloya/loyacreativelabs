"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AlesisPianoStudioSection from "@/components/studio/AlesisPianoStudioSection";

export default function AlesisPianoPage() {
  const router = useRouter();

  return (
    <AlesisPianoStudioSection
      isEmbedded={false}
      onClose={() => router.push("/acapella")}
    />
  );
}
