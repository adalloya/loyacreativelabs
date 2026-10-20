// src/components/apex/ApexAmbientVisualizer.tsx
"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useApexFx } from "@/hooks/useApexFx";

interface ApexAmbientVisualizerProps {
    isPlaying?: boolean;
    bpm?: number;
    accentColor?: string;
}

export const ApexAmbientVisualizer: React.FC<ApexAmbientVisualizerProps> = ({
    isPlaying = false,
    bpm = 135,
    accentColor = "#10B981"
}) => {
    const { isFxActive } = useApexFx();
    const containerRef = useRef<HTMLDivElement | null>(null);

    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const pointsRef = useRef<THREE.Points | null>(null);
    const geometryRef = useRef<THREE.BufferGeometry | null>(null);
    const materialRef = useRef<THREE.PointsMaterial | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isPlayingRef = useRef(isPlaying);
    const bpmRef = useRef(bpm);

    isPlayingRef.current = isPlaying;
    bpmRef.current = bpm;

    useEffect(() => {
        // SI FX ESTÁ APAGADO: No inicializar nada y asegurar limpieza total
        if (!isFxActive || typeof window === "undefined" || !containerRef.current) {
            return;
        }

        const container = containerRef.current;
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 1. Inicializar WebGLRenderer en modo de bajo consumo
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: false,
            powerPreference: "low-power"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(width, height);
        renderer.domElement.style.position = "absolute";
        renderer.domElement.style.top = "0";
        renderer.domElement.style.left = "0";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.pointerEvents = "none";
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 2. Escena y Cámara
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(55, width / height, 1, 1000);
        camera.position.set(0, 45, 120);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // 3. Malla 3D de Partículas de Ondas de Sonido (50 x 50 = 2,500 puntos)
        const separation = 4.2;
        const amountX = 50;
        const amountY = 40;
        const numParticles = amountX * amountY;

        const positions = new Float32Array(numParticles * 3);
        const colors = new Float32Array(numParticles * 3);

        const colorBase = new THREE.Color(accentColor || "#10B981");
        const colorAccent = new THREE.Color("#FF2A2A");

        let i = 0;
        let c = 0;
        for (let ix = 0; ix < amountX; ix++) {
            for (let iy = 0; iy < amountY; iy++) {
                positions[i] = ix * separation - (amountX * separation) / 2;
                positions[i + 1] = 0; // Se calcula en el loop de animación
                positions[i + 2] = iy * separation - (amountY * separation) / 2;

                const mixFactor = (ix / amountX) * 0.7 + (iy / amountY) * 0.3;
                const mixed = colorBase.clone().lerp(colorAccent, mixFactor * 0.35);

                colors[c] = mixed.r;
                colors[c + 1] = mixed.g;
                colors[c + 2] = mixed.b;

                i += 3;
                c += 3;
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometryRef.current = geometry;

        const material = new THREE.PointsMaterial({
            size: 2.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending
        });
        materialRef.current = material;

        const points = new THREE.Points(geometry, material);
        scene.add(points);
        pointsRef.current = points;

        // 4. Bucle de Animación Dinámico Reactivo al Ritmo de Spotify
        let count = 0;
        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);

            const activePlayback = isPlayingRef.current;
            const currentBpm = bpmRef.current || 135;

            // Frecuencia dinámica modulada según si hay música reproduciéndose
            const speed = activePlayback ? (currentBpm / 60) * 0.035 : 0.012;
            const amplitude = activePlayback ? 8.5 : 4.0;

            count += speed;

            const posAttr = geometry.attributes.position as THREE.BufferAttribute;
            const posArray = posAttr.array as Float32Array;

            let idx = 0;
            for (let ix = 0; ix < amountX; ix++) {
                for (let iy = 0; iy < amountY; iy++) {
                    const wave1 = Math.sin((ix + count) * 0.28) * amplitude;
                    const wave2 = Math.sin((iy + count) * 0.45) * amplitude;
                    posArray[idx + 1] = wave1 + wave2;
                    idx += 3;
                }
            }

            posAttr.needsUpdate = true;
            points.rotation.y = count * 0.04;

            renderer.render(scene, camera);
        };

        animate();

        // 5. Manejador de redimensionamiento
        const handleResize = () => {
            if (!rendererRef.current || !cameraRef.current) return;
            const newW = window.innerWidth;
            const newH = window.innerHeight;
            cameraRef.current.aspect = newW / newH;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(newW, newH);
        };

        window.addEventListener("resize", handleResize);

        // 6. DESTRUCCIÓN COMPLETA AL DESMONTAR O AL APAGAR FX (renderer.dispose(), 0% GPU/batería)
        return () => {
            window.removeEventListener("resize", handleResize);

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            if (geometryRef.current) {
                geometryRef.current.dispose();
                geometryRef.current = null;
            }

            if (materialRef.current) {
                materialRef.current.dispose();
                materialRef.current = null;
            }

            if (pointsRef.current && sceneRef.current) {
                sceneRef.current.remove(pointsRef.current);
                pointsRef.current = null;
            }

            if (rendererRef.current) {
                rendererRef.current.dispose();
                rendererRef.current.forceContextLoss(); // Mata de raíz el contexto WebGL para liberar GPU
                if (rendererRef.current.domElement && container.contains(rendererRef.current.domElement)) {
                    container.removeChild(rendererRef.current.domElement);
                }
                rendererRef.current = null;
            }

            sceneRef.current = null;
            cameraRef.current = null;
        };
    }, [isFxActive, accentColor]);

    // Si el usuario tiene FX apagado, no renderiza ni 1 nodo de canvas
    if (!isFxActive) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-700 opacity-100"
            aria-hidden="true"
        >
            {/* Luces Ambientales Reactivas Fijas en Segundo Plano */}
            <div
                className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-20 transition-all duration-1000"
                style={{
                    backgroundColor: isPlaying ? (accentColor || "#10B981") : "#10B981"
                }}
            />
            <div
                className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] pointer-events-none opacity-25 transition-all duration-1000"
                style={{
                    backgroundColor: isPlaying ? "#FF2A2A" : "#10B981"
                }}
            />
        </div>
    );
};
