'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VisualizerMode } from '@/services/spotifyTelemetry';

export interface SpotifyThreeCanvasProps {
  mode: VisualizerMode;
  isPlaying: boolean;
  trackId?: string;
  bpm?: number;
  energy?: number;
  progressMs?: number;
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
  trackId = '',
  bpm = 135,
  energy = 0.85,
  progressMs = 0,
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
  const energyRef = useRef(energy);
  const progressMsRef = useRef(progressMs);
  const tempoActiveRef = useRef(tempoActive);
  const restModeActiveRef = useRef(restModeActive);
  const burstTriggerRef = useRef(burstTrigger);
  const accentRgbRef = useRef(accentRgb);

  isPlayingRef.current = isPlaying;
  bpmRef.current = bpm;
  energyRef.current = energy;
  progressMsRef.current = progressMs;
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

    // Parsear color RGB
    const parseRgb = (rgbStr: string) => {
      const parts = (rgbStr || '255, 42, 42').split(',').map((n) => parseInt(n.trim(), 10) / 255);
      return new THREE.Color(
        isNaN(parts[0]) ? 1.0 : parts[0],
        isNaN(parts[1]) ? 0.16 : parts[1],
        isNaN(parts[2]) ? 0.16 : parts[2]
      );
    };

    const primaryColor = parseRgb(accentRgbRef.current);

    const meshGroup = new THREE.Group();
    scene.add(meshGroup);

    let geometry: THREE.BufferGeometry;
    let originalPositions: Float32Array;

    const wireMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: mode === 'ORB' ? 0.38 : 0.48,
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

    // BUCLE DE RENDERIZADO REACTIVO 60 FPS
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const activePlayback = isPlayingRef.current;
      const rawBpm = bpmRef.current || 135;
      const validBpm = Math.max(50, Math.min(230, rawBpm));
      const currentEnergy = Math.max(0.2, Math.min(1.0, energyRef.current ?? 0.85));
      const tempoActiveVal = tempoActiveRef.current;
      const restActiveVal = restModeActiveRef.current;

      // 1. INYECCIÓN DEL COLOR DOMINANTE DEL ÁLBUM AL MATERIAL THREE.JS
      const targetColor = parseRgb(accentRgbRef.current);
      if (restActiveVal) {
        // En descanso: tinte esmeralda relajante
        wireMat.color.lerp(new THREE.Color(0.06, 0.75, 0.52), 0.08);
        pointsMat.color.lerp(new THREE.Color(0.85, 1.0, 0.92), 0.08);
      } else {
        // Interpolación continua al color del álbum activo
        wireMat.color.lerp(targetColor, 0.1);
        const pointTint = targetColor.clone().lerp(new THREE.Color(1, 1, 1), 0.7);
        pointsMat.color.lerp(pointTint, 0.1);
      }

      // 2. CÁLCULO DE CADENCIA Y PULSO RÍTMICO BASADO EN BPM Y PROGRESO
      const beatDurationSec = 60 / validBpm;
      const bps = validBpm / 60;
      let speedMultiplier = activePlayback ? bps * 1.6 : 0.45;
      if (tempoActiveVal) speedMultiplier *= 1.35;
      if (restActiveVal) speedMultiplier *= 0.4;

      time += 0.016 * speedMultiplier;
      burstIntensity = Math.max(0, burstIntensity - 0.022);

      const beatPhase = (time % beatDurationSec) / beatDurationSec;
      const beatPulse = Math.exp(-beatPhase * 4.2); // Pico exponencial de impacto

      // Clasificación de Rangos de BPM
      const isHighBpm = validBpm > 140; // Techno / Phonk
      const isMidBpm = validBpm >= 110 && validBpm <= 140; // Rock / Hip Hop
      const isLowBpm = validBpm < 110 || restActiveVal; // Lofi / Descanso

      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const count = originalPositions.length / 3;

      // Ráfaga global por series completadas
      const burstWave = burstIntensity * 0.45;

      // 3. ANIMACIONES DIFERENCIADAS BASADAS EN EL RANGO DE BPM

      if (isHighBpm && !restActiveVal) {
        // ==========================================
        // RANGO ALTO (> 140 BPM - TECHNO / PHONK)
        // ==========================================
        // Rotación angular acelerada
        const rotSpeed = activePlayback ? 0.022 * (validBpm / 140) : 0.005;
        meshGroup.rotation.y += rotSpeed;
        meshGroup.rotation.x += rotSpeed * 0.55;

        // Efecto glitch y micro-jitter estroboscópico sutil
        const isGlitch = Math.random() < 0.045 * currentEnergy;
        const jitter = isGlitch ? (Math.random() - 0.5) * 0.12 : 0;
        pointsMat.size = 0.038 + (isGlitch ? 0.018 : 0) + beatPulse * 0.015;
        pointsMat.opacity = isGlitch ? 1.0 : (0.75 + beatPulse * 0.25);
        meshGroup.scale.set(1.0 + jitter * 0.4, 1.0 + jitter * 0.4, 1.0 + jitter * 0.4);

        if (mode === 'ORB') {
          // Vértices vibran con alta frecuencia y picos afilados
          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x0 = originalPositions[idx];
            const y0 = originalPositions[idx + 1];
            const z0 = originalPositions[idx + 2];

            const len = Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0) || 1;
            const nx = x0 / len;
            const ny = y0 / len;
            const nz = z0 / len;

            const spike = Math.pow(Math.abs(Math.sin(time * 7.0 + x0 * 3.2 + y0 * 3.2)), 2.6) * (0.32 * currentEnergy);
            const microVib = Math.sin(time * 38.0 + i * 3.2) * (0.035 * currentEnergy);
            const disp = spike + beatPulse * 0.32 * currentEnergy + microVib + jitter + burstWave;

            posArray[idx] = x0 + nx * disp;
            posArray[idx + 1] = y0 + ny * disp;
            posArray[idx + 2] = z0 + nz * disp;
          }
        } else {
          // Malla WAVE con picos agudos y agresivos
          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x0 = originalPositions[idx];
            const y0 = originalPositions[idx + 1];
            const z0 = originalPositions[idx + 2];

            const s1 = Math.sin(x0 * 2.2 + time * 5.8);
            const wave1 = Math.sign(s1) * Math.pow(Math.abs(s1), 2.4) * (0.42 * currentEnergy);
            const wave2 = Math.cos(y0 * 2.8 + time * 4.2) * (0.24 * currentEnergy);
            const microVib = Math.sin(time * 32.0 + x0 * 8.0) * (0.04 * currentEnergy);
            const peakKick = beatPulse * 0.38 * Math.sin(x0 * 3.0 + time * 7.5);

            posArray[idx + 2] = z0 + wave1 + wave2 + peakKick + microVib + jitter + burstWave;
          }
          meshGroup.rotation.z = Math.sin(time * 1.4) * 0.045 + jitter * 0.2;
        }

      } else if (isMidBpm && !restActiveVal) {
        // ==========================================
        // RANGO MEDIO (110 - 140 BPM - ROCK / HIP HOP)
        // ==========================================
        // Pulso pesado, profundo y expansivo rítmicamente (simula sub-bajo o bombo firme)
        const rotSpeed = activePlayback ? 0.010 * (validBpm / 125) : 0.003;
        meshGroup.rotation.y += rotSpeed;
        meshGroup.rotation.x += rotSpeed * 0.4;

        // Expansión rítmica de bajo
        const bassScale = 1.0 + (beatPulse * 0.20 * currentEnergy) + (burstIntensity * 0.15);
        meshGroup.scale.set(bassScale, bassScale, bassScale);
        pointsMat.size = 0.034;
        pointsMat.opacity = 0.65 + beatPulse * 0.25;

        if (mode === 'ORB') {
          // Deformación volumétrica profunda y expansiva
          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x0 = originalPositions[idx];
            const y0 = originalPositions[idx + 1];
            const z0 = originalPositions[idx + 2];

            const len = Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0) || 1;
            const nx = x0 / len;
            const ny = y0 / len;
            const nz = z0 / len;

            const wave = Math.sin(time * 3.0 + x0 * 1.8 + y0 * 1.8) * Math.cos(time * 2.0 + z0 * 2.0);
            const disp = (wave * 0.18 * currentEnergy) + (beatPulse * 0.32 * currentEnergy) + burstWave;

            posArray[idx] = x0 + nx * disp;
            posArray[idx + 1] = y0 + ny * disp;
            posArray[idx + 2] = z0 + nz * disp;
          }
        } else {
          // Ondas de sub-bajo continuas y firmes
          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x0 = originalPositions[idx];
            const y0 = originalPositions[idx + 1];
            const z0 = originalPositions[idx + 2];

            const wave1 = Math.sin(x0 * 1.5 + time * 3.2) * (0.34 * currentEnergy);
            const wave2 = Math.cos(y0 * 1.9 + time * 2.2) * (0.20 * currentEnergy);
            const bassKick = beatPulse * 0.36 * Math.cos(x0 * 1.5);

            posArray[idx + 2] = z0 + wave1 + wave2 + bassKick + burstWave;
          }
          meshGroup.rotation.z = Math.sin(time * 0.7) * 0.035;
        }

      } else {
        // ==========================================
        // RANGO BAJO (< 110 BPM - LOFI / DESCANSO)
        // ==========================================
        // Ondas fluidas, suaves, lentas y armónicas para bajar pulsaciones
        const rotSpeed = activePlayback ? 0.004 : 0.001;
        meshGroup.rotation.y += rotSpeed;
        meshGroup.rotation.x = Math.sin(time * 0.5) * 0.035;
        meshGroup.scale.set(1.0, 1.0, 1.0);
        pointsMat.size = 0.028;
        pointsMat.opacity = 0.45 + Math.sin(time * 1.6) * 0.15;

        if (mode === 'ORB') {
          // Respiración suave y armónica
          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x0 = originalPositions[idx];
            const y0 = originalPositions[idx + 1];
            const z0 = originalPositions[idx + 2];

            const len = Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0) || 1;
            const nx = x0 / len;
            const ny = y0 / len;
            const nz = z0 / len;

            const swell = Math.sin(time * 1.5 + x0 * 1.0) * Math.cos(time * 1.2 + y0 * 1.0) * (0.11 * currentEnergy);
            const disp = swell + burstWave * 0.4;

            posArray[idx] = x0 + nx * disp;
            posArray[idx + 1] = y0 + ny * disp;
            posArray[idx + 2] = z0 + nz * disp;
          }
        } else {
          // Ondas fluidas y relajantes tipo oleaje nocturno
          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x0 = originalPositions[idx];
            const y0 = originalPositions[idx + 1];
            const z0 = originalPositions[idx + 2];

            const wave1 = Math.sin(x0 * 1.0 + time * 1.3) * (0.16 * currentEnergy);
            const wave2 = Math.cos(y0 * 1.2 + time * 0.9) * (0.10 * currentEnergy);

            posArray[idx + 2] = z0 + wave1 + wave2 + (burstWave * 0.4);
          }
          meshGroup.rotation.z = Math.sin(time * 0.3) * 0.02;
        }
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
  }, [mode]);

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
            backgroundColor: `rgba(${accentRgb}, ${isPlaying ? 0.38 : 0.15})`,
            transform: isPlaying ? (bpm > 140 ? 'scale(1.25)' : 'scale(1.15)') : 'scale(0.95)',
          }}
        />
        <div
          className="absolute w-24 h-12 rounded-full blur-lg opacity-40 transition-all duration-500"
          style={{
            backgroundColor: tempoActive
              ? '#FF2A2A'
              : restModeActive
              ? '#10B981'
              : `rgba(${accentRgb}, 0.85)`,
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
