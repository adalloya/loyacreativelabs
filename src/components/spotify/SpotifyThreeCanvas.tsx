'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VisualizerMode } from '@/services/spotifyTelemetry';

export interface SpotifyThreeCanvasProps {
  mode: VisualizerMode;
  isPlaying: boolean;
  trackId?: string;
  trackName?: string;
  artistName?: string;
  albumArt?: string;
  customCanvasUrl?: string;
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
  trackName = '',
  artistName = '',
  albumArt = '',
  customCanvasUrl,
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
  const liquidLayer1Ref = useRef<HTMLDivElement | null>(null);
  const liquidLayer2Ref = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Referencias mutables para reactividad inmediata sin necesidad de reinstanciar WebGL
  const albumArtRef = useRef(albumArt);
  const isPlayingRef = useRef(isPlaying);
  const bpmRef = useRef(bpm);
  const energyRef = useRef(energy);
  const progressMsRef = useRef(progressMs);
  const tempoActiveRef = useRef(tempoActive);
  const restModeActiveRef = useRef(restModeActive);
  const burstTriggerRef = useRef(burstTrigger);
  const accentRgbRef = useRef(accentRgb);

  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('light');
    }
    return false;
  });

  useEffect(() => {
    const handleTheme = () => {
      if (typeof document !== 'undefined') {
        setIsLightMode(document.documentElement.classList.contains('light'));
      }
    };
    window.addEventListener('apex_theme_change', handleTheme);
    return () => window.removeEventListener('apex_theme_change', handleTheme);
  }, []);

  albumArtRef.current = albumArt;
  isPlayingRef.current = isPlaying;
  bpmRef.current = bpm;
  energyRef.current = energy;
  progressMsRef.current = progressMs;
  tempoActiveRef.current = tempoActive;
  restModeActiveRef.current = restModeActive;
  accentRgbRef.current = accentRgb;

  useEffect(() => {
    // Si está en OFF, no instanciar WebGL (0% uso de GPU/CPU)
    if (mode === 'OFF' || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 110;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);

    // Ajuste de cámara según el modo seleccionado
    if (mode === 'CANVAS') {
      camera.position.set(0, 0, 3.2);
    } else if (mode === 'ORB') {
      camera.position.set(0, 0, 3.2);
    } else if (mode === 'APEX') {
      camera.position.set(0, 0.65, 3.8);
      camera.lookAt(0, 0, 0);
    } else if (mode === 'AURA') {
      camera.position.set(0, 0, 3.8);
    } else if (mode === 'TUNNEL') {
      camera.position.set(0, 0, 4.4);
    } else if (mode === 'VORTEX') {
      camera.position.set(0, 1.8, 3.8);
      camera.lookAt(0, 0, 0);
    } else if (mode === 'SPECTRUM') {
      camera.position.set(0, 0.5, 4.4);
      camera.lookAt(0, 0, 0);
    } else {
      // WAVE
      camera.position.set(0, 0, 4.2);
    }

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

    // Materiales reactivos principales
    const wireMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: isLightMode ? 0.7 : (mode === 'AURA' ? 0.45 : mode === 'ORB' ? 0.38 : mode === 'APEX' ? 0.65 : 0.48),
      blending: isLightMode ? THREE.NormalBlending : (mode === 'AURA' || mode === 'TUNNEL' || mode === 'VORTEX' || mode === 'APEX' ? THREE.AdditiveBlending : THREE.NormalBlending),
    });

    const pointsMat = new THREE.PointsMaterial({
      color: isLightMode ? primaryColor : 0xffffff,
      size: mode === 'AURA' ? 0.038 : mode === 'ORB' ? 0.035 : mode === 'APEX' ? 0.034 : 0.03,
      transparent: true,
      opacity: isLightMode ? 0.8 : 0.85,
      blending: isLightMode ? THREE.NormalBlending : THREE.AdditiveBlending,
    });

    // Variables de geometrías según el modo
    let mainGeometry: THREE.BufferGeometry | null = null;
    let originalPositions: Float32Array | null = null;

    // Elementos auxiliares para modos específicos
    let extraPointsGeom: THREE.BufferGeometry | null = null;
    let extraPointsPositions: Float32Array | null = null;
    let spectrumBars: THREE.Mesh[] = [];
    let apexInnerMesh: THREE.Mesh | null = null;
    let apexCoreMesh: THREE.Mesh | null = null;

    // ==========================================
    // INICIALIZACIÓN DE GEOMETRÍAS POR MODO
    // ==========================================
    if (mode === 'APEX') {
      // MODO APEX: Reactor Cuántico / Anillo de Singularidad APEX con halo de partículas estelares
      // 1. Torus Principal de alambre de alta resolución (halo wireframe mostrado en screenshot)
      mainGeometry = new THREE.TorusGeometry(1.45, 0.44, 22, 64);
      mainGeometry.rotateX(Math.PI / 2.3);
      originalPositions = Float32Array.from(mainGeometry.attributes.position.array);

      meshGroup.add(new THREE.Mesh(mainGeometry, wireMat));
      meshGroup.add(new THREE.Points(mainGeometry, pointsMat));

      // 2. Anillo interior concéntrico secundario
      const innerTorusGeom = new THREE.TorusGeometry(0.82, 0.08, 14, 48);
      innerTorusGeom.rotateX(Math.PI / 2.3);
      apexInnerMesh = new THREE.Mesh(innerTorusGeom, wireMat);
      meshGroup.add(apexInnerMesh);

      // 3. Núcleo Icosaedro central APEX de energía pulsante
      const coreGeom = new THREE.IcosahedronGeometry(0.28, 1);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.75,
      });
      apexCoreMesh = new THREE.Mesh(coreGeom, coreMat);
      meshGroup.add(apexCoreMesh);

      // 4. Disco orbital de polvo estelar cuántico (halo de puntos cósmicos como en el screenshot)
      const apexParticleCount = 850;
      extraPointsGeom = new THREE.BufferGeometry();
      const apexPositions = new Float32Array(apexParticleCount * 3);

      for (let i = 0; i < apexParticleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const rad = 1.15 + Math.pow(Math.random(), 0.75) * 3.0;
        apexPositions[i * 3] = Math.cos(theta) * rad;
        apexPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.9;
        apexPositions[i * 3 + 2] = Math.sin(theta) * rad * 0.75;
      }

      extraPointsGeom.setAttribute('position', new THREE.BufferAttribute(apexPositions, 3));
      extraPointsPositions = Float32Array.from(apexPositions);

      const apexStardustMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.035,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      meshGroup.add(new THREE.Points(extraPointsGeom, apexStardustMat));

    } else if (mode === 'AURA') {
      // MODO AURA: Cortinas de luz polar / aurora boreal ondulante
      mainGeometry = new THREE.PlaneGeometry(9.0, 4.2, 56, 24);
      mainGeometry.rotateX(-0.25);
      originalPositions = Float32Array.from(mainGeometry.attributes.position.array);

      meshGroup.add(new THREE.Mesh(mainGeometry, wireMat));
      meshGroup.add(new THREE.Points(mainGeometry, pointsMat));

      // Polvo estelar cósmico flotante
      const starCount = 200;
      extraPointsGeom = new THREE.BufferGeometry();
      const starPos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        starPos[i * 3] = (Math.random() - 0.5) * 8.5;
        starPos[i * 3 + 1] = (Math.random() - 0.5) * 4.5;
        starPos[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
      }
      extraPointsGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      extraPointsPositions = Float32Array.from(starPos);

      const starMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.032,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });
      meshGroup.add(new THREE.Points(extraPointsGeom, starMat));

    } else if (mode === 'ORB') {
      // MODO ORB: Icosaedro geodésico supermasivo
      mainGeometry = new THREE.IcosahedronGeometry(1.15, 3);
      originalPositions = Float32Array.from(mainGeometry.attributes.position.array);

      meshGroup.add(new THREE.Mesh(mainGeometry, wireMat));
      meshGroup.add(new THREE.Points(mainGeometry, pointsMat));

    } else if (mode === 'TUNNEL') {
      // MODO TUNNEL: Túnel hiperespacial cyberpunk warp speed
      mainGeometry = new THREE.CylinderGeometry(1.7, 1.7, 18, 16, 40, true);
      mainGeometry.rotateX(Math.PI / 2);
      originalPositions = Float32Array.from(mainGeometry.attributes.position.array);

      meshGroup.add(new THREE.Mesh(mainGeometry, wireMat));
      meshGroup.add(new THREE.Points(mainGeometry, pointsMat));

      // Estrellas en warp speed hacia la cámara
      const warpCount = 240;
      extraPointsGeom = new THREE.BufferGeometry();
      const warpPos = new Float32Array(warpCount * 3);
      for (let i = 0; i < warpCount; i++) {
        warpPos[i * 3] = (Math.random() - 0.5) * 3.2;
        warpPos[i * 3 + 1] = (Math.random() - 0.5) * 3.2;
        warpPos[i * 3 + 2] = Math.random() * -16;
      }
      extraPointsGeom.setAttribute('position', new THREE.BufferAttribute(warpPos, 3));
      extraPointsPositions = Float32Array.from(warpPos);

      const warpMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.036,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      meshGroup.add(new THREE.Points(extraPointsGeom, warpMat));

    } else if (mode === 'VORTEX') {
      // MODO VORTEX: Disco de acreción galáctico en espiral
      const particleCount = 1400;
      mainGeometry = new THREE.BufferGeometry();
      const vortexPos = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        const arm = i % 3;
        const r = Math.pow(Math.random(), 0.65) * 3.4 + 0.35;
        const armOffset = arm * ((Math.PI * 2) / 3);
        const theta = armOffset + r * 1.6 + (Math.random() - 0.5) * 0.32;

        vortexPos[i * 3] = Math.cos(theta) * r;
        vortexPos[i * 3 + 1] = (Math.random() - 0.5) * 0.18;
        vortexPos[i * 3 + 2] = Math.sin(theta) * r;
      }

      mainGeometry.setAttribute('position', new THREE.BufferAttribute(vortexPos, 3));
      originalPositions = Float32Array.from(vortexPos);

      // Núcleo de singularidad gravitacional central
      const singularityGeom = new THREE.TorusGeometry(0.38, 0.05, 8, 32);
      singularityGeom.rotateX(Math.PI / 2);
      meshGroup.add(new THREE.Mesh(singularityGeom, wireMat));
      meshGroup.add(new THREE.Points(mainGeometry, pointsMat));

    } else if (mode === 'SPECTRUM') {
      // MODO SPECTRUM: Ecualizador holográfico 3D de 28 columnas neon
      const barCount = 28;
      const barGeom = new THREE.BoxGeometry(0.18, 1.0, 0.18);

      for (let i = 0; i < barCount; i++) {
        const barMesh = new THREE.Mesh(barGeom, wireMat);
        const xPos = (i - (barCount - 1) / 2) * 0.25;
        barMesh.position.set(xPos, 0, 0);
        meshGroup.add(barMesh);
        spectrumBars.push(barMesh);
      }

    } else if (mode === 'CANVAS') {
      // MODO CANVAS: Holograma 3D con relieve reactivo a BPM sobre la portada en alta resolución
      mainGeometry = new THREE.PlaneGeometry(2.35, 2.35, 64, 64);
      originalPositions = Float32Array.from(mainGeometry.attributes.position.array);

      const artUrl = albumArtRef.current;
      if (artUrl) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(
          artUrl,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.generateMipmaps = false;

            const canvasMat = new THREE.MeshStandardMaterial({
              map: tex,
              roughness: 0.28,
              metalness: 0.16,
              side: THREE.DoubleSide,
            });

            const mesh = new THREE.Mesh(mainGeometry!, canvasMat);
            meshGroup.add(mesh);
          },
          undefined,
          () => {
            const fallbackMat = new THREE.MeshBasicMaterial({
              color: primaryColor,
              wireframe: true,
              transparent: true,
              opacity: 0.65,
            });
            meshGroup.add(new THREE.Mesh(mainGeometry!, fallbackMat));
          }
        );
      } else {
        const fallbackMat = new THREE.MeshBasicMaterial({
          color: primaryColor,
          wireframe: true,
          transparent: true,
          opacity: 0.65,
        });
        meshGroup.add(new THREE.Mesh(mainGeometry, fallbackMat));
      }

      // Iluminación cinemática reactiva
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
      scene.add(ambientLight);

      const canvasPointLight = new THREE.PointLight(primaryColor, 3.2, 7.5);
      canvasPointLight.position.set(0, 1.4, 2.0);
      scene.add(canvasPointLight);

      // Partículas orbitales estelares de acento
      const stardustCount = 140;
      extraPointsGeom = new THREE.BufferGeometry();
      const stardustPos = new Float32Array(stardustCount * 3);
      for (let i = 0; i < stardustCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const rad = 1.35 + Math.random() * 1.5;
        stardustPos[i * 3] = Math.cos(theta) * rad;
        stardustPos[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
        stardustPos[i * 3 + 2] = Math.sin(theta) * rad * 0.4;
      }
      extraPointsGeom.setAttribute('position', new THREE.BufferAttribute(stardustPos, 3));
      extraPointsPositions = Float32Array.from(stardustPos);

      const stardustMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.034,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      meshGroup.add(new THREE.Points(extraPointsGeom, stardustMat));

    } else {
      // MODO WAVE: Terreno de ondas estilo consola Tesla
      mainGeometry = new THREE.PlaneGeometry(7.2, 2.3, 44, 16);
      mainGeometry.rotateX(-Math.PI / 3.4);
      originalPositions = Float32Array.from(mainGeometry.attributes.position.array);

      meshGroup.add(new THREE.Mesh(mainGeometry, wireMat));
      meshGroup.add(new THREE.Points(mainGeometry, pointsMat));
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

      // Ráfaga global por series completadas
      const burstWave = burstIntensity * 0.45;

      // Efecto glitch en picos de alta velocidad
      const isGlitch = isHighBpm && Math.random() < 0.045 * currentEnergy;
      const jitter = isGlitch ? (Math.random() - 0.5) * 0.12 : 0;

      if (mode === 'CANVAS') {
        // ------------------------------------------
        // MODO CANVAS: Holograma 3D + Relieve Reactivo
        // ------------------------------------------
        // A. Fondo Líquido Multicapa: rotación y zoom pulse sincronizado matemáticamente con beatPulse
        const beatScale = 1.0 + beatPulse * 0.12;
        const rot1 = (time * 8) % 360;
        const rot2 = (-time * 6) % 360;
        if (liquidLayer1Ref.current) {
          liquidLayer1Ref.current.style.transform = `rotate(${rot1}deg) scale(${beatScale * 1.15})`;
        }
        if (liquidLayer2Ref.current) {
          liquidLayer2Ref.current.style.transform = `rotate(${rot2}deg) scale(${beatScale * 1.25})`;
        }
        if (videoRef.current) {
          const targetRate = Math.max(0.6, Math.min(2.0, validBpm / 128));
          videoRef.current.playbackRate = targetRate;
        }

        // B. Ondulación reactiva de la malla 3D en eje Z
        if (mainGeometry && originalPositions) {
          const posAttr = mainGeometry.attributes.position as THREE.BufferAttribute;
          const posArray = posAttr.array as Float32Array;
          const count = originalPositions.length / 3;

          const freq = isHighBpm ? 3.8 : isMidBpm ? 2.8 : 2.0;
          const amp = isHighBpm ? 0.20 : isMidBpm ? 0.14 : 0.08;
          const kick = beatPulse * (isHighBpm ? 0.28 : isMidBpm ? 0.18 : 0.10);

          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x0 = originalPositions[idx];
            const y0 = originalPositions[idx + 1];
            const dist = Math.sqrt(x0 * x0 + y0 * y0);

            const ripple = Math.sin(dist * freq - time * 3.8) * (amp * currentEnergy);
            const beatPush = Math.cos(dist * 2.2) * kick;
            const microJitter = isHighBpm ? Math.sin(x0 * 9.0 + time * 12.0) * 0.035 * beatPulse : 0;

            posArray[idx + 2] = ripple + beatPush + microJitter + jitter + (burstWave * 0.3);
          }
          posAttr.needsUpdate = true;
          mainGeometry.computeVertexNormals();
        }

        // C. Inclinación 3D Parallax suave
        meshGroup.rotation.x = Math.sin(time * 0.6) * 0.08;
        meshGroup.rotation.y = Math.cos(time * 0.7) * 0.10;
        meshGroup.rotation.z = Math.sin(time * 0.3) * 0.02;

        // D. Zoom pulse de la geometría en el centro
        const meshScale = 1.0 + beatPulse * 0.06;
        meshGroup.scale.set(meshScale, meshScale, meshScale);

        // E. Partículas orbitales
        if (extraPointsGeom && extraPointsPositions) {
          const posAttr = extraPointsGeom.attributes.position as THREE.BufferAttribute;
          const posArray = posAttr.array as Float32Array;
          const count = extraPointsPositions.length / 3;
          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x = extraPointsPositions[idx];
            const z = extraPointsPositions[idx + 2];
            const angle = time * 0.4 + i;
            const rad = Math.sqrt(x * x + z * z);
            posArray[idx] = Math.cos(angle) * rad;
            posArray[idx + 2] = Math.sin(angle) * rad * 0.6;
          }
          posAttr.needsUpdate = true;
        }
      } else if (mode === 'APEX') {
        // ------------------------------------------
        // MODO APEX: Reactor Cuántico / Anillo Torus
        // ------------------------------------------
        // A. Ondulación reactiva de los vértices del Torus al ritmo del beat y BPM
        if (mainGeometry && originalPositions) {
          const posAttr = mainGeometry.attributes.position as THREE.BufferAttribute;
          const posArray = posAttr.array as Float32Array;
          const count = originalPositions.length / 3;

          const waveFreq = isHighBpm ? 5.2 : isMidBpm ? 3.6 : 2.4;
          const waveAmp = (isHighBpm ? 0.09 : 0.05) * currentEnergy;
          const beatKick = beatPulse * (isHighBpm ? 0.15 : 0.08);

          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x0 = originalPositions[idx];
            const y0 = originalPositions[idx + 1];
            const z0 = originalPositions[idx + 2];
            const angle = Math.atan2(z0, x0);

            // Deformación radial armónica en Z y radio
            const ripple = Math.sin(angle * waveFreq + time * 3.5) * waveAmp;
            const expansion = 1.0 + beatKick + ripple + (jitter * 0.35);

            posArray[idx] = x0 * expansion;
            posArray[idx + 1] = y0 * expansion + Math.sin(time * 2.0 + x0 * 2.2) * 0.03;
            posArray[idx + 2] = z0 * expansion;
          }
          posAttr.needsUpdate = true;
        }

        // B. Rotación continua 3D y balanceo majestuoso
        const spinSpeed = activePlayback ? (validBpm / 125) * 0.008 : 0.0025;
        meshGroup.rotation.y += spinSpeed;
        meshGroup.rotation.x = 0.35 + Math.sin(time * 0.6) * 0.12;
        meshGroup.rotation.z = Math.cos(time * 0.4) * 0.07;

        // C. Contrarotación del anillo interior y núcleo
        if (apexInnerMesh) {
          apexInnerMesh.rotation.z -= spinSpeed * 1.8;
          apexInnerMesh.rotation.y += spinSpeed * 1.2;
        }
        if (apexCoreMesh) {
          apexCoreMesh.rotation.x += spinSpeed * 2.2;
          apexCoreMesh.rotation.y -= spinSpeed * 2.0;
          const corePulse = 1.0 + beatPulse * 0.35;
          apexCoreMesh.scale.set(corePulse, corePulse, corePulse);
        }

        // D. Pulso dimensional del reactor completo en cada beat
        const apexPulse = 1.0 + beatPulse * 0.09 + burstWave;
        meshGroup.scale.set(apexPulse, apexPulse, apexPulse);

        // E. Órbitas de las partículas cuánticas auxiliares en espiral
        if (extraPointsGeom && extraPointsPositions) {
          const pAttr = extraPointsGeom.attributes.position as THREE.BufferAttribute;
          const pArray = pAttr.array as Float32Array;
          const pCount = extraPointsPositions.length / 3;
          const orbitSpeed = 0.38 * speedMultiplier;

          for (let i = 0; i < pCount; i++) {
            const idx = i * 3;
            const ox = extraPointsPositions[idx];
            const oz = extraPointsPositions[idx + 2];
            const r = Math.sqrt(ox * ox + oz * oz);
            const initialAngle = Math.atan2(oz, ox);
            const currentAngle = initialAngle + time * (orbitSpeed / Math.max(0.8, r * 0.75));

            pArray[idx] = Math.cos(currentAngle) * r;
            pArray[idx + 1] = extraPointsPositions[idx + 1] + Math.sin(time * 1.6 + r) * 0.08;
            pArray[idx + 2] = Math.sin(currentAngle) * r;
          }
          pAttr.needsUpdate = true;
        }
      } else if (mode === 'AURA') {
        // ------------------------------------------
        // MODO AURA: Cortinas de Aurora Boreal
        // ------------------------------------------
        if (mainGeometry && originalPositions) {
          const posAttr = mainGeometry.attributes.position as THREE.BufferAttribute;
          const posArray = posAttr.array as Float32Array;
          const count = originalPositions.length / 3;

          const waveSpeed = activePlayback ? time * (validBpm / 110) : time * 0.5;
          const amplitude = isHighBpm ? 0.38 : isMidBpm ? 0.28 : 0.18;

          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x0 = originalPositions[idx];
            const y0 = originalPositions[idx + 1];
            const z0 = originalPositions[idx + 2];

            // Ondulaciones armónicas fluidas de seda polar
            const w1 = Math.sin(x0 * 1.3 + waveSpeed * 2.2) * (amplitude * currentEnergy);
            const w2 = Math.cos(y0 * 1.8 + waveSpeed * 1.6) * (0.16 * currentEnergy);
            const w3 = Math.sin(x0 * 2.6 - waveSpeed * 3.1) * (0.08 * currentEnergy);
            const pulseDisplace = beatPulse * 0.22 * Math.sin(x0 * 1.5 + waveSpeed);

            posArray[idx + 2] = z0 + w1 + w2 + w3 + pulseDisplace + burstWave + jitter;
          }
          posAttr.needsUpdate = true;
        }

        // Suave balanceo etéreo del telón de luz
        meshGroup.rotation.y = Math.sin(time * 0.6) * 0.14;
        meshGroup.rotation.z = Math.cos(time * 0.4) * 0.04;

        // Movimiento de polvo estelar cósmico
        if (extraPointsGeom && extraPointsPositions) {
          const pAttr = extraPointsGeom.attributes.position as THREE.BufferAttribute;
          const pArray = pAttr.array as Float32Array;
          const pCount = extraPointsPositions.length / 3;

          for (let i = 0; i < pCount; i++) {
            const idx = i * 3;
            pArray[idx + 1] += 0.005 * (validBpm / 120);
            if (pArray[idx + 1] > 2.5) {
              pArray[idx + 1] = -2.5;
            }
            pArray[idx] = extraPointsPositions[idx] + Math.sin(time + i) * 0.08;
          }
          pAttr.needsUpdate = true;
        }

      } else if (mode === 'ORB') {
        // ------------------------------------------
        // MODO ORB: Icosaedro Geodésico
        // ------------------------------------------
        if (mainGeometry && originalPositions) {
          const posAttr = mainGeometry.attributes.position as THREE.BufferAttribute;
          const posArray = posAttr.array as Float32Array;
          const count = originalPositions.length / 3;

          const rotSpeed = activePlayback
            ? (isHighBpm ? 0.022 * (validBpm / 140) : isMidBpm ? 0.010 * (validBpm / 125) : 0.004)
            : 0.002;

          meshGroup.rotation.y += rotSpeed;
          meshGroup.rotation.x += rotSpeed * 0.55;

          const scaleFactor = 1.0 + (beatPulse * 0.22 * currentEnergy) + jitter * 0.3;
          meshGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);

          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x0 = originalPositions[idx];
            const y0 = originalPositions[idx + 1];
            const z0 = originalPositions[idx + 2];

            const len = Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0) || 1;
            const nx = x0 / len;
            const ny = y0 / len;
            const nz = z0 / len;

            let disp = 0;
            if (isHighBpm) {
              const spike = Math.pow(Math.abs(Math.sin(time * 7.0 + x0 * 3.2 + y0 * 3.2)), 2.6) * (0.32 * currentEnergy);
              const microVib = Math.sin(time * 38.0 + i * 3.2) * (0.035 * currentEnergy);
              disp = spike + beatPulse * 0.32 * currentEnergy + microVib + jitter + burstWave;
            } else if (isMidBpm) {
              const wave = Math.sin(time * 3.0 + x0 * 1.8 + y0 * 1.8) * Math.cos(time * 2.0 + z0 * 2.0);
              disp = (wave * 0.18 * currentEnergy) + (beatPulse * 0.32 * currentEnergy) + burstWave;
            } else {
              const swell = Math.sin(time * 1.5 + x0 * 1.0) * Math.cos(time * 1.2 + y0 * 1.0) * (0.11 * currentEnergy);
              disp = swell + burstWave * 0.4;
            }

            posArray[idx] = x0 + nx * disp;
            posArray[idx + 1] = y0 + ny * disp;
            posArray[idx + 2] = z0 + nz * disp;
          }
          posAttr.needsUpdate = true;
        }

      } else if (mode === 'TUNNEL') {
        // ------------------------------------------
        // MODO TUNNEL: Túnel Hiperespacial Warp Speed
        // ------------------------------------------
        if (mainGeometry && originalPositions) {
          const posAttr = mainGeometry.attributes.position as THREE.BufferAttribute;
          const posArray = posAttr.array as Float32Array;
          const count = originalPositions.length / 3;

          const tunnelSpin = activePlayback ? 0.008 * (validBpm / 120) : 0.002;
          meshGroup.rotation.z += tunnelSpin;

          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x0 = originalPositions[idx];
            const y0 = originalPositions[idx + 1];
            const z0 = originalPositions[idx + 2];

            const rad = Math.sqrt(x0 * x0 + y0 * y0) || 1;
            const nx = x0 / rad;
            const ny = y0 / rad;

            // Ondas de choque que viajan por el túnel
            const shockwave = Math.sin(z0 * 1.8 - time * 6.5) * (0.18 * currentEnergy);
            const expand = (shockwave + beatPulse * 0.28 * currentEnergy + burstWave);

            posArray[idx] = x0 + nx * expand;
            posArray[idx + 1] = y0 + ny * expand;
            posArray[idx + 2] = z0;
          }
          posAttr.needsUpdate = true;
        }

        // Estrellas volando hacia adelante en el eje Z
        if (extraPointsGeom) {
          const pAttr = extraPointsGeom.attributes.position as THREE.BufferAttribute;
          const pArray = pAttr.array as Float32Array;
          const pCount = pArray.length / 3;
          const warpSpeed = activePlayback ? 0.12 * (validBpm / 120) : 0.03;

          for (let i = 0; i < pCount; i++) {
            const zIdx = i * 3 + 2;
            pArray[zIdx] += warpSpeed + (beatPulse * 0.08);
            if (pArray[zIdx] > 4.5) {
              pArray[zIdx] = -16.0;
            }
          }
          pAttr.needsUpdate = true;
        }

      } else if (mode === 'VORTEX') {
        // ------------------------------------------
        // MODO VORTEX: Disco de Acreción Galáctico
        // ------------------------------------------
        if (mainGeometry && originalPositions) {
          const posAttr = mainGeometry.attributes.position as THREE.BufferAttribute;
          const posArray = posAttr.array as Float32Array;
          const count = originalPositions.length / 3;

          const spinFactor = activePlayback ? 0.015 * (validBpm / 120) : 0.004;
          meshGroup.rotation.y += spinFactor;
          meshGroup.rotation.x = -Math.PI / 3.2 + Math.sin(time * 0.5) * 0.05;

          const pulseRadius = 1.0 + (beatPulse * 0.24 * currentEnergy) + burstWave;

          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x0 = originalPositions[idx];
            const y0 = originalPositions[idx + 1];
            const z0 = originalPositions[idx + 2];

            const r = Math.sqrt(x0 * x0 + z0 * z0) || 1;
            // Ondas gravitacionales que oscilan en el plano vertical
            const rippleZ = Math.sin(r * 3.5 - time * 5.2) * (0.22 * currentEnergy);

            posArray[idx] = x0 * pulseRadius;
            posArray[idx + 1] = y0 + rippleZ;
            posArray[idx + 2] = z0 * pulseRadius;
          }
          posAttr.needsUpdate = true;
        }

      } else if (mode === 'SPECTRUM') {
        // ------------------------------------------
        // MODO SPECTRUM: Ecualizador Holográfico 3D
        // ------------------------------------------
        const barCount = spectrumBars.length;
        const baseSpeed = activePlayback ? time * (validBpm / 120) * 3.5 : time * 1.2;

        for (let i = 0; i < barCount; i++) {
          const bar = spectrumBars[i];
          const freqHarmonic = Math.sin(i * 0.52 + baseSpeed) * Math.cos(i * 0.28 + baseSpeed * 0.7);
          const beatContribution = (i % 3 === 0 ? beatPulse * 0.9 : beatPulse * 0.3) * currentEnergy;
          const targetHeight = Math.max(0.15, Math.abs(freqHarmonic) * 1.8 * currentEnergy + beatContribution + burstWave);

          bar.scale.y = targetHeight;
          bar.position.y = targetHeight / 2 - 0.4;
        }

        meshGroup.rotation.y = Math.sin(time * 0.4) * 0.12;

      } else {
        // ------------------------------------------
        // MODO WAVE: Terreno de Ondas Tesla
        // ------------------------------------------
        if (mainGeometry && originalPositions) {
          const posAttr = mainGeometry.attributes.position as THREE.BufferAttribute;
          const posArray = posAttr.array as Float32Array;
          const count = originalPositions.length / 3;

          if (isHighBpm) {
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
          } else if (isMidBpm) {
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
          } else {
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
          posAttr.needsUpdate = true;
        }
      }

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

      if (mainGeometry) mainGeometry.dispose();
      if (extraPointsGeom) extraPointsGeom.dispose();
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
  }, [mode, albumArt, isLightMode]);

  // Si burstTrigger cambia por prop, disparar ráfaga
  useEffect(() => {
    if (burstTrigger > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('apex:visualizer-event', { detail: { type: 'SET_COMPLETED' } })
      );
    }
  }, [burstTrigger]);

  // MODO OFF: Sin WebGL, sin canvas, 0% CPU y GPU
  if (mode === 'OFF') {
    return null;
  }

  const resolvedVideoUrl = customCanvasUrl || (
    /techno|rave|industrial/i.test(`${trackName} ${artistName}`)
      ? "https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-31728-large.mp4"
      : /phonk|drift|cowbell/i.test(`${trackName} ${artistName}`)
      ? "https://assets.mixkit.co/videos/preview/mixkit-hypnotic-smoke-in-the-dark-42442-large.mp4"
      : undefined
  );

  // MODOS ACTIVOS (CANVAS, ORB, WAVE, AURA, TUNNEL, VORTEX, SPECTRUM):
  return (
    <div
      className={`relative w-full h-full overflow-hidden pointer-events-none select-none flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      {/* 1. Fondo Líquido Multicapa (CSS + WebGL): solo activo en modo CANVAS cuando hay carátula */}
      {mode === 'CANVAS' && albumArt && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Capa Líquida 1: Rotación lenta horaria + Zoom Beat */}
          <div
            ref={liquidLayer1Ref}
            className="absolute -inset-[40%] bg-center bg-cover transition-transform duration-75 will-change-transform opacity-75"
            style={{
              backgroundImage: `url(${albumArt})`,
              filter: 'blur(28px) saturate(1.8) contrast(1.2)',
            }}
          />
          {/* Capa Líquida 2: Rotación lenta antihoraria + Contraste y saturación */}
          <div
            ref={liquidLayer2Ref}
            className="absolute -inset-[40%] bg-center bg-cover mix-blend-screen transition-transform duration-75 will-change-transform opacity-55"
            style={{
              backgroundImage: `url(${albumArt})`,
              filter: 'blur(36px) saturate(2.0) contrast(1.3)',
            }}
          />
          {/* Capa 3: Video Atmosférico / Custom MP4 opcional sincronizado con BPM */}
          {resolvedVideoUrl && (
            <video
              ref={videoRef}
              src={resolvedVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-screen pointer-events-none"
            />
          )}
          {/* Viñeta sutil cinemática con sombra oscura en bordes adaptable */}
          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            isLightMode
              ? "bg-gradient-to-t from-slate-200/40 via-transparent to-transparent"
              : "bg-gradient-to-t from-black via-transparent to-black/70"
          }`} />
        </div>
      )}

      {/* 2. WebGL Canvas Mount (Three.js 3D Viewport) */}
      <div
        ref={mountRef}
        className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none"
      />
    </div>
  );
}

export default SpotifyThreeCanvas;
