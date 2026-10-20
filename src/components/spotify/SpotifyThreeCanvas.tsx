'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VisualizerMode } from '@/services/spotifyTelemetry';

export interface SpotifyThreeCanvasProps {
  mode: VisualizerMode;
  isPlaying: boolean;
  bpm?: number;
  accentRgb?: string; // Formato "255, 42, 42"
  tempoActive?: boolean;
  restModeActive?: boolean;
  restRemainingSeconds?: number;
  burstTrigger?: number;
  className?: string;
}

export function SpotifyThreeCanvas({
  mode,
  isPlaying,
  bpm = 135,
  accentRgb = '255, 42, 42',
  tempoActive = false,
  restModeActive = false,
  restRemainingSeconds = 0,
  burstTrigger = 0,
  className = '',
}: SpotifyThreeCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Referencias mutables para reactividad inmediata sin necesidad de reinstanciar WebGL
  const isPlayingRef = useRef(isPlaying);
  const bpmRef = useRef(bpm);
  const tempoActiveRef = useRef(tempoActive);
  const restModeActiveRef = useRef(restModeActive);
  const burstTriggerRef = useRef(burstTrigger);
  const accentRgbRef = useRef(accentRgb);

  isPlayingRef.current = isPlaying;
  bpmRef.current = bpm;
  tempoActiveRef.current = tempoActive;
  restModeActiveRef.current = restModeActive;
  accentRgbRef.current = accentRgb;

  useEffect(() => {
    // Si está en OFF o solo AURA, no instanciar WebGL (0% uso de GPU)
    if (mode === 'OFF' || mode === 'AURA' || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 110;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.z = mode === 'ORB' ? 3.2 : 4.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Parsear color RGB dominante de la portada o estado
    const parseRgb = (rgbStr: string) => {
      const [r, g, b] = rgbStr.split(',').map((n) => parseInt(n.trim(), 10) / 255);
      return new THREE.Color(r || 1, g || 0.16, b || 0.16);
    };

    const primaryColor = parseRgb(accentRgb);

    const meshGroup = new THREE.Group();
    scene.add(meshGroup);

    let geometry: THREE.BufferGeometry;
    let originalPositions: Float32Array;

    const wireMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: mode === 'ORB' ? 0.35 : 0.45,
    });

    const pointsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: mode === 'ORB' ? 0.035 : 0.03,
      transparent: true,
      opacity: 0.85,
    });

    if (mode === 'ORB') {
      geometry = new THREE.IcosahedronGeometry(1.15, 3);
      originalPositions = Float32Array.from(geometry.attributes.position.array);

      meshGroup.add(new THREE.Mesh(geometry, wireMat));
      meshGroup.add(new THREE.Points(geometry, pointsMat));
    } else {
      // MODO WAVE (Terreno de ondas limpio estilo consola Tesla)
      geometry = new THREE.PlaneGeometry(7, 2.2, 42, 14);
      geometry.rotateX(-Math.PI / 3.4);
      originalPositions = Float32Array.from(geometry.attributes.position.array);

      meshGroup.add(new THREE.Mesh(geometry, wireMat));
      meshGroup.add(new THREE.Points(geometry, pointsMat));
    }

    // Estado reactivo dinámico de ráfaga y eventos APEX
    let burstIntensity = 0;
    let time = 0;
    let animationFrameId: number;

    const handleVisualizerEvent = (e: any) => {
      const type = e?.detail?.type;
      if (type === 'SET_COMPLETED') {
        burstIntensity = 1.0;
      } else if (type === 'TEMPO_TOGGLE') {
        burstIntensity = 0.65;
      } else if (type === 'REST_END') {
        burstIntensity = 0.85;
      }
    };

    window.addEventListener('apex:visualizer-event', handleVisualizerEvent);

    // Bucle de animación optimizado a 60 FPS / bajo consumo
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const activePlayback = isPlayingRef.current;
      const currentBpm = Math.max(60, Math.min(220, bpmRef.current || 135));
      const tempoActiveVal = tempoActiveRef.current;
      const restActiveVal = restModeActiveRef.current;

      // Actualizar color si cambió dinámicamente
      const currentColor = parseRgb(accentRgbRef.current);
      if (restActiveVal) {
        // En modo descanso, tinte esmeralda relajante
        wireMat.color.lerp(new THREE.Color(0.06, 0.72, 0.5), 0.05);
      } else {
        wireMat.color.lerp(currentColor, 0.05);
      }

      // Velocidad y cadencia de onda
      const bps = currentBpm / 60;
      let speedMultiplier = activePlayback ? bps * 1.8 : 0.5;
      if (tempoActiveVal) speedMultiplier *= 1.4;
      if (restActiveVal) speedMultiplier *= 0.45;

      time += 0.016 * speedMultiplier;
      burstIntensity = Math.max(0, burstIntensity - 0.022);

      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      if (mode === 'ORB') {
        // Deformación esférica radial
        const count = originalPositions.length / 3;
        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          const x0 = originalPositions[idx];
          const y0 = originalPositions[idx + 1];
          const z0 = originalPositions[idx + 2];

          const len = Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0) || 1;
          const nx = x0 / len;
          const ny = y0 / len;
          const nz = z0 / len;

          const wave = Math.sin(time * 3 + x0 * 2.2 + y0 * 2.2) * Math.cos(time * 2 + z0 * 2.6);
          const amp = activePlayback ? (tempoActiveVal ? 0.22 : 0.14) : 0.05;
          const disp = (wave * amp + burstIntensity * 0.38);

          posArray[idx] = x0 + nx * disp;
          posArray[idx + 1] = y0 + ny * disp;
          posArray[idx + 2] = z0 + nz * disp;
        }

        meshGroup.rotation.y += 0.007 * (activePlayback ? 1 : 0.3);
        meshGroup.rotation.x += 0.004 * (activePlayback ? 1 : 0.3);
      } else {
        // Deformación de ondas estilo Tesla Cybernetic
        const count = originalPositions.length / 3;
        const ampBase = activePlayback ? (tempoActiveVal ? 0.35 : 0.22) : 0.08;

        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          const x0 = originalPositions[idx];
          const y0 = originalPositions[idx + 1];
          const z0 = originalPositions[idx + 2];

          const wave1 = Math.sin(x0 * 1.5 + time * 3.2) * ampBase;
          const wave2 = Math.cos(y0 * 2.0 + time * 2.4) * (ampBase * 0.7);
          const burstWave = burstIntensity * 0.42 * Math.sin(x0 * 3.5 + time * 6);

          posArray[idx + 2] = z0 + wave1 + wave2 + burstWave;
        }

        meshGroup.rotation.z = Math.sin(time * 0.6) * 0.03;
      }

      posAttr.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    // Redimensionamiento elástico reactivo
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 110;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(handleResize)
      : null;

    if (resizeObserver) {
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // LIMPIEZA COMPLETA: Liberación total de memoria GPU / CPU (0% overhead)
    return () => {
      window.removeEventListener('apex:visualizer-event', handleVisualizerEvent);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }

      cancelAnimationFrame(animationFrameId);

      geometry.dispose();
      wireMat.dispose();
      pointsMat.dispose();

      meshGroup.traverse((child) => {
        if ((child as any).geometry) {
          (child as any).geometry.dispose();
        }
        if ((child as any).material) {
          const m = (child as any).material;
          if (Array.isArray(m)) {
            m.forEach((mat) => mat.dispose());
          } else {
            m.dispose();
          }
        }
      });

      renderer.dispose();
      renderer.forceContextLoss();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      container.innerHTML = '';
    };
  }, [mode, accentRgb]);

  // Si burstTrigger cambia por prop, disparar ráfaga
  useEffect(() => {
    if (burstTrigger > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('apex:visualizer-event', { detail: { type: 'SET_COMPLETED' } })
      );
    }
  }, [burstTrigger]);

  // 1. MODO OFF: Sin WebGL, sin canvas, 0% CPU y GPU
  if (mode === 'OFF') {
    return null;
  }

  // 2. MODO AURA: Resplandor sutil con CSS puro (Cero instancias WebGL)
  if (mode === 'AURA') {
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center overflow-hidden pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        <div
          className="w-48 h-20 rounded-full blur-2xl transition-all duration-700"
          style={{
            backgroundColor: `rgba(${accentRgb}, ${isPlaying ? 0.35 : 0.15})`,
            transform: isPlaying ? 'scale(1.18)' : 'scale(0.95)',
          }}
        />
        <div
          className="absolute w-24 h-12 rounded-full blur-lg opacity-40 transition-all duration-500"
          style={{
            backgroundColor: tempoActive
              ? '#FF2A2A'
              : restModeActive
              ? '#10B981'
              : `rgba(${accentRgb}, 0.8)`,
          }}
        />
      </div>
    );
  }

  // 3. MODOS 3D (WAVE u ORB): Contenedor interactivo para WebGL Canvas
  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full overflow-hidden pointer-events-none select-none flex items-center justify-center ${className}`}
      aria-hidden="true"
    />
  );
}
export default SpotifyThreeCanvas;
