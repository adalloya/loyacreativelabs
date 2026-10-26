'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  StructureType,
  JointType,
  SteelFinish,
  RoofCoverType,
  RoofParams,
  GateParams,
  WorkTableParams,
  StructuralMember,
  generateRoofMembers,
  generateGateMembers,
  generateWorkTableMembers,
  calculateBillOfMaterials,
  ProjectBillOfMaterials,
} from '@/lib/arco-maestro/structure-engine';
import { getAreaPrices } from '@/lib/arco-maestro/local-prices';
import {
  Layers,
  RotateCcw,
  Eye,
  Sliders,
  Flame,
  Wrench,
  Sparkles,
  Maximize2,
  Copy,
  Check,
  Share2,
  Scale,
  Compass,
  DollarSign,
  Info,
} from 'lucide-react';

interface Arco3DStudioProps {
  onOpenCutList?: () => void;
  onOpenPriceManager?: () => void;
}

export default function Arco3DStudio({ onOpenCutList, onOpenPriceManager }: Arco3DStudioProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Modo de estructura activa
  const [structureType, setStructureType] = useState<StructureType>('ROOF_PERGOLA');

  // Parámetros Techo / Pérgola
  const [roofParams, setRoofParams] = useState<RoofParams>({
    width_m: 4.0,
    length_m: 5.0,
    heightFront_m: 3.0,
    heightBack_m: 2.6,
    postCountX: 2,
    postCountZ: 2,
    purlinCount: 5,
    postMaterialId: 'ptr-3x3-c14',
    beamMaterialId: 'ptr-4x2-c14',
    purlinMaterialId: 'monten-4x2-c14',
    jointType: 'WELD',
    coverType: 'NONE',
    finish: 'BLACK_MATTE',
  });

  // Parámetros Portón
  const [gateParams, setGateParams] = useState<GateParams>({
    width_m: 3.0,
    height_m: 2.2,
    frameMaterialId: 'zintro-r300-c16',
    horizontalDividers: 1,
    verticalDividers: 0,
    infillType: 'LOUVERS',
    infillMaterialId: 'zintro-r150-c18',
    jointType: 'WELD',
    finish: 'BLACK_MATTE',
  });

  // Parámetros Mesa de Taller
  const [tableParams, setTableParams] = useState<WorkTableParams>({
    length_m: 2.0,
    width_m: 1.0,
    height_m: 0.9,
    legMaterialId: 'ptr-2x2-c11',
    frameMaterialId: 'ptr-2x2-c14',
    hasLowerShelf: true,
    jointType: 'WELD',
    finish: 'RAW_STEEL',
  });

  // Controles de Visualización
  const [explodedFactor, setExplodedFactor] = useState<number>(0); // 0 a 1
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showJointMarkers, setShowJointMarkers] = useState<boolean>(true);
  const [activeFinish, setActiveFinish] = useState<SteelFinish>('BLACK_MATTE');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState<boolean>(false);

  // Referencias Three.js
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const structureGroupRef = useRef<THREE.Group | null>(null);
  const dimensionGroupRef = useRef<THREE.Group | null>(null);
  const jointsGroupRef = useRef<THREE.Group | null>(null);
  const coverMeshRef = useRef<THREE.Mesh | null>(null);

  // Generar miembros según la estructura activa
  const { members, slopeInfo } = useMemo(() => {
    if (structureType === 'ROOF_PERGOLA') {
      const res = generateRoofMembers(roofParams);
      return { members: res.members, slopeInfo: { percent: res.slopePercent, deg: res.slopeDegrees } };
    } else if (structureType === 'GATE_FRAME') {
      return { members: generateGateMembers(gateParams), slopeInfo: null };
    } else {
      return { members: generateWorkTableMembers(tableParams), slopeInfo: null };
    }
  }, [structureType, roofParams, gateParams, tableParams]);

  // Cálculo en tiempo real de material y cortes
  const bom: ProjectBillOfMaterials = useMemo(() => {
    return calculateBillOfMaterials(members);
  }, [members]);

  // Material Shader según acabado
  const steelMaterial = useMemo(() => {
    let color = 0x1e2024;
    let metalness = 0.85;
    let roughness = 0.35;

    if (activeFinish === 'RAW_STEEL') {
      color = 0x475569;
      metalness = 0.9;
      roughness = 0.25;
    } else if (activeFinish === 'GALVANIZED_ZINTRO') {
      color = 0x94a3b8;
      metalness = 0.8;
      roughness = 0.45;
    } else if (activeFinish === 'RED_OXIDE') {
      color = 0x881337;
      metalness = 0.3;
      roughness = 0.7;
    }

    return new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness,
    });
  }, [activeFinish]);

  // Inicializar Three.js
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090a0f);
    sceneRef.current = scene;

    // Fog suave para profundidad arquitectónica
    scene.fog = new THREE.FogExp2(0x090a0f, 0.04);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(6, 5, 8);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // No ir por debajo del suelo
    controls.minDistance = 1.5;
    controls.maxDistance = 30;
    controls.target.set(0, 1.5, 0);
    controlsRef.current = controls;

    // 5. Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    sunLight.position.set(10, 15, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-10, 8, -8);
    scene.add(fillLight);

    // 6. Grid del Taller (Cuadrícula métrica)
    const grid = new THREE.GridHelper(20, 20, 0xeab308, 0x27272a);
    grid.position.y = -0.001;
    scene.add(grid);

    // Suelo reflectante sutil
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x07080a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 7. Grupos de Elementos
    const structureGroup = new THREE.Group();
    scene.add(structureGroup);
    structureGroupRef.current = structureGroup;

    const dimensionGroup = new THREE.Group();
    scene.add(dimensionGroup);
    dimensionGroupRef.current = dimensionGroup;

    const jointsGroup = new THREE.Group();
    scene.add(jointsGroup);
    jointsGroupRef.current = jointsGroup;

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Actualizar la geometría 3D en la escena
  useEffect(() => {
    const structGroup = structureGroupRef.current;
    const dimGroup = dimensionGroupRef.current;
    const jntGroup = jointsGroupRef.current;
    const scene = sceneRef.current;
    if (!structGroup || !dimGroup || !jntGroup || !scene) return;

    // Limpiar geometrías previas
    while (structGroup.children.length > 0) {
      const obj = structGroup.children[0] as THREE.Mesh;
      structGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }
    while (dimGroup.children.length > 0) {
      const obj = dimGroup.children[0] as THREE.Mesh;
      dimGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }
    while (jntGroup.children.length > 0) {
      const obj = jntGroup.children[0] as THREE.Mesh;
      jntGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }
    if (coverMeshRef.current) {
      scene.remove(coverMeshRef.current);
      coverMeshRef.current.geometry.dispose();
      coverMeshRef.current = null;
    }

    // Materiales de Uniones
    // Soldadura: Cordón dorado luminoso
    const weldMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.9,
    });

    // Tornillo: Perno hexagonal / cilindro plateado
    const boltMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.3,
      metalness: 0.95,
    });

    // Placa base de poste
    const basePlateGeo = new THREE.BoxGeometry(0.2, 0.015, 0.2);
    const basePlateMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 });

    // Renderizar cada miembro estructural
    members.forEach((m) => {
      const vStart = new THREE.Vector3(...m.start);
      const vEnd = new THREE.Vector3(...m.end);

      // Desplazamiento por vista explosionada
      let explodeOffset = 0;
      if (m.role === 'BEAM') explodeOffset = explodedFactor * 0.6;
      if (m.role === 'PURLIN') explodeOffset = explodedFactor * 1.3;
      if (m.role === 'INFILL') explodeOffset = explodedFactor * 0.4;
      if (m.role === 'BRACE') explodeOffset = explodedFactor * 0.5;

      vStart.y += explodeOffset;
      vEnd.y += explodeOffset;

      const dir = new THREE.Vector3().subVectors(vEnd, vStart);
      const len = dir.length();
      if (len <= 0.001) return;

      // Sección transversal según tipo de perfil
      let profileWidth = 0.076; // 3"
      let profileDepth = 0.076;

      if (m.materialId.includes('4x2') || m.materialId.includes('r400')) {
        profileWidth = 0.101;
        profileDepth = 0.05;
      } else if (m.materialId.includes('4x4')) {
        profileWidth = 0.101;
        profileDepth = 0.101;
      } else if (m.materialId.includes('2x2') || m.materialId.includes('r200')) {
        profileWidth = 0.05;
        profileDepth = 0.05;
      } else if (m.materialId.includes('monten')) {
        profileWidth = 0.05;
        profileDepth = 0.1;
      } else if (m.materialId.includes('r150')) {
        profileWidth = 0.038;
        profileDepth = 0.012;
      }

      const geom = new THREE.BoxGeometry(profileWidth, len, profileDepth);
      const mesh = new THREE.Mesh(geom, steelMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Posicionar en el punto medio
      const mid = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);
      mesh.position.copy(mid);

      // Orientar vector (0, 1, 0) hacia la dirección del miembro
      const up = new THREE.Vector3(0, 1, 0);
      const normalizedDir = dir.clone().normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normalizedDir);
      mesh.setRotationFromQuaternion(quaternion);

      structGroup.add(mesh);

      // Placa base si es poste en el suelo
      if (m.role === 'POST' && m.start[1] === 0) {
        const plate = new THREE.Mesh(basePlateGeo, basePlateMat);
        plate.position.set(m.start[0], 0.008, m.start[2]);
        plate.receiveShadow = true;
        structGroup.add(plate);

        // 4 taquetes expansivos en las esquinas de la placa
        const anchorGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.03, 8);
        const offsets = [-0.07, 0.07];
        offsets.forEach((ox) => {
          offsets.forEach((oz) => {
            const bolt = new THREE.Mesh(anchorGeo, boltMaterial);
            bolt.position.set(m.start[0] + ox, 0.02, m.start[2] + oz);
            jntGroup.add(bolt);
          });
        });
      }

      // Marcadores visuales de Unión (Soldadura / Tornillo)
      if (showJointMarkers) {
        if (m.jointType === 'WELD') {
          // Cordón de soldadura (pequeña esfera/anillo resplandeciente)
          const weldGeo = new THREE.SphereGeometry(0.038, 12, 12);
          const weld1 = new THREE.Mesh(weldGeo, weldMaterial);
          weld1.position.copy(vStart);
          jntGroup.add(weld1);

          const weld2 = new THREE.Mesh(weldGeo, weldMaterial);
          weld2.position.copy(vEnd);
          jntGroup.add(weld2);
        } else {
          // Tornillo / Perno
          const boltGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 6);
          const bolt1 = new THREE.Mesh(boltGeo, boltMaterial);
          bolt1.position.copy(vStart);
          jntGroup.add(bolt1);

          const bolt2 = new THREE.Mesh(boltGeo, boltMaterial);
          bolt2.position.copy(vEnd);
          jntGroup.add(bolt2);
        }
      }
    });

    // Cubierta de Techo si aplica
    if (structureType === 'ROOF_PERGOLA' && roofParams.coverType !== 'NONE') {
      const { width_m, length_m, heightFront_m, heightBack_m } = roofParams;
      const heightDiff = heightFront_m - heightBack_m;
      const rafterLen = Math.sqrt(Math.pow(length_m, 2) + Math.pow(heightDiff, 2));

      const coverGeo = new THREE.PlaneGeometry(width_m + 0.2, rafterLen + 0.2);

      let coverColor = 0x94a3b8;
      let opacity = 0.85;
      if (roofParams.coverType === 'POLICARBONATO') {
        coverColor = 0xe0f2fe;
        opacity = 0.45;
      } else if (roofParams.coverType === 'TRASLUCIDA') {
        coverColor = 0xf8fafc;
        opacity = 0.6;
      }

      const coverMat = new THREE.MeshStandardMaterial({
        color: coverColor,
        transparent: true,
        opacity,
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });

      const coverMesh = new THREE.Mesh(coverGeo, coverMat);
      const midY = (heightFront_m + heightBack_m) / 2 + 0.12 + explodedFactor * 2.0;
      coverMesh.position.set(0, midY, 0);

      // Rotación hacia la pendiente
      const slopeAngle = Math.atan2(heightFront_m - heightBack_m, length_m);
      coverMesh.rotation.x = -Math.PI / 2 + slopeAngle;
      coverMesh.receiveShadow = true;
      coverMesh.castShadow = true;

      scene.add(coverMesh);
      coverMeshRef.current = coverMesh;
    }

    // Dibujar Cotas y Líneas de Dimensión
    if (showDimensions && structureType === 'ROOF_PERGOLA') {
      const { width_m, length_m, heightFront_m } = roofParams;
      const lineMat = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 2 });

      // Cota Ancho Frente (Eje X en el suelo)
      const ptsWidth = [
        new THREE.Vector3(-width_m / 2, 0.05, length_m / 2 + 0.4),
        new THREE.Vector3(width_m / 2, 0.05, length_m / 2 + 0.4),
      ];
      const geomWidth = new THREE.BufferGeometry().setFromPoints(ptsWidth);
      dimGroup.add(new THREE.Line(geomWidth, lineMat));

      // Cota Largo Fondo (Eje Z en el suelo)
      const ptsLength = [
        new THREE.Vector3(width_m / 2 + 0.4, 0.05, -length_m / 2),
        new THREE.Vector3(width_m / 2 + 0.4, 0.05, length_m / 2),
      ];
      const geomLength = new THREE.BufferGeometry().setFromPoints(ptsLength);
      dimGroup.add(new THREE.Line(geomLength, lineMat));

      // Cota Altura Frente (Eje Y)
      const ptsHeight = [
        new THREE.Vector3(-width_m / 2 - 0.4, 0, length_m / 2),
        new THREE.Vector3(-width_m / 2 - 0.4, heightFront_m, length_m / 2),
      ];
      const geomHeight = new THREE.BufferGeometry().setFromPoints(ptsHeight);
      dimGroup.add(new THREE.Line(geomHeight, lineMat));
    }
  }, [members, activeFinish, explodedFactor, showDimensions, showJointMarkers, structureType, roofParams, steelMaterial]);

  // Controles de Cámara Rápida
  const setCameraView = (view: 'PERSPECTIVE' | 'FRONT' | 'SIDE' | 'TOP' | 'RESET') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (view === 'FRONT') {
      camera.position.set(0, 2.5, 9);
      controls.target.set(0, 2, 0);
    } else if (view === 'SIDE') {
      camera.position.set(9, 2.5, 0);
      controls.target.set(0, 2, 0);
    } else if (view === 'TOP') {
      camera.position.set(0, 11, 0.01);
      controls.target.set(0, 0, 0);
    } else if (view === 'PERSPECTIVE' || view === 'RESET') {
      camera.position.set(6, 5, 8);
      controls.target.set(0, 1.5, 0);
    }
    controls.update();
  };

  // Copiar Pedido para WhatsApp
  const handleCopyWhatsApp = () => {
    let text = `🏗️ *PEDIDO DE MATERIAL · ARCO MAESTRO*\n`;
    text += `Proyecto: ${
      structureType === 'ROOF_PERGOLA'
        ? `Techo/Pérgola ${roofParams.width_m}m x ${roofParams.length_m}m`
        : structureType === 'GATE_FRAME'
        ? `Portón ${gateParams.width_m}m x ${gateParams.height_m}m`
        : `Mesa de Taller`
    }\n\n`;

    text += `*TRAMOS COMERCIALES DE 6.00 METROS:*\n`;
    bom.materials.forEach((m) => {
      text += `• ${m.required6mBars} tramo(s) de *${m.materialName}* ($${m.pricePerBarMXN.toLocaleString(
        'es-MX'
      )} c/u) = $${m.totalCostMXN.toLocaleString('es-MX')}\n`;
    });

    text += `\n*CONSUMIBLES ESTIMADOS:*\n`;
    if (roofParams.jointType === 'WELD') {
      text += `• ${bom.electrodesKgNeeded} kg Electrodo E6013 3/32"\n`;
    } else {
      text += `• ${bom.boltsCountNeeded} Tornillos c/tuerca y rondana 3/8"\n`;
    }
    text += `• ${bom.cuttingDiscsNeeded} Discos de corte 4 1/2"\n`;
    text += `• ${bom.primerLitersNeeded} L Fondo Anticorrosivo\n`;
    text += `• ${bom.enamelLitersNeeded} L Esmalte Negro Mate\n\n`;

    text += `*TOTAL ESTIMADO MATERIAL:* $${bom.grandTotalMXN.toLocaleString('es-MX')} MXN\n`;
    text += `*PESO ESTRUCTURAL APROX:* ~${bom.estimatedWeightKg} kg\n`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Selector Superior de Estructura Tipo Preset */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/5 p-2 backdrop-blur-2xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStructureType('ROOF_PERGOLA')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition ${
              structureType === 'ROOF_PERGOLA'
                ? 'bg-yellow-400 text-zinc-950 shadow-md'
                : 'text-zinc-300 hover:bg-white/10'
            }`}
          >
            <span>🏠</span>
            <span>Techo / Pérgola / Cochera</span>
          </button>
          <button
            onClick={() => setStructureType('GATE_FRAME')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition ${
              structureType === 'GATE_FRAME'
                ? 'bg-yellow-400 text-zinc-950 shadow-md'
                : 'text-zinc-300 hover:bg-white/10'
            }`}
          >
            <span>🚪</span>
            <span>Portón Residencial / Marco</span>
          </button>
          <button
            onClick={() => setStructureType('WORK_TABLE')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition ${
              structureType === 'WORK_TABLE'
                ? 'bg-yellow-400 text-zinc-950 shadow-md'
                : 'text-zinc-300 hover:bg-white/10'
            }`}
          >
            <span>🛠️</span>
            <span>Mesa de Soldador / Taller</span>
          </button>
        </div>

        {/* Botón rápido a Precios de tu Zona */}
        {onOpenPriceManager && (
          <button
            onClick={onOpenPriceManager}
            className="flex items-center gap-1.5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-3 py-1.5 text-xs font-bold text-yellow-300 hover:bg-yellow-400/20 transition"
          >
            <DollarSign size={13} />
            <span>Editar Precios de mi Área</span>
          </button>
        )}
      </div>

      {/* Grid Principal: Viewport 3D a la izquierda, Panel de Control a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. VIEWPORT 3D INTERACTIVO THREE.JS (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col rounded-3xl border border-white/15 bg-black/50 backdrop-blur-2xl overflow-hidden shadow-2xl relative">
          {/* Header del Viewport con Resumen en Vivo */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3 z-10">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>3D CAD Studio</span>
                  <span className="text-zinc-500 font-normal">| Escala 1:1 Taller</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Arrastra con un dedo para rotar · Pellizca para zoom
                </p>
              </div>
            </div>

            {/* Badges de Métricas Rápidas */}
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 font-bold text-white tabular-nums">
                {bom.totalBars6m} Tramos (6m)
              </span>
              <span className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 font-bold text-yellow-300 tabular-nums">
                ~{bom.estimatedWeightKg} kg Acero
              </span>
              <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-extrabold text-emerald-400 tabular-nums">
                ${bom.grandTotalMXN.toLocaleString('es-MX')} MXN
              </span>
            </div>
          </div>

          {/* Canvas Container Three.js */}
          <div
            ref={mountRef}
            className="w-full h-[420px] sm:h-[500px] lg:h-[580px] bg-[#07080A] cursor-grab active:cursor-grabbing relative"
          />

          {/* Overlay Flotante Inferior: Controles de Cámara y Visualización */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Vistas Predefinidas */}
            <div className="flex items-center gap-1 rounded-2xl border border-white/20 bg-black/80 p-1.5 backdrop-blur-xl pointer-events-auto shadow-lg text-[11px] font-bold">
              <button
                onClick={() => setCameraView('PERSPECTIVE')}
                className="rounded-xl px-2.5 py-1 text-zinc-300 hover:text-white hover:bg-white/10 transition"
              >
                3D
              </button>
              <button
                onClick={() => setCameraView('FRONT')}
                className="rounded-xl px-2.5 py-1 text-zinc-300 hover:text-white hover:bg-white/10 transition"
              >
                Frente
              </button>
              <button
                onClick={() => setCameraView('SIDE')}
                className="rounded-xl px-2.5 py-1 text-zinc-300 hover:text-white hover:bg-white/10 transition"
              >
                Lateral
              </button>
              <button
                onClick={() => setCameraView('TOP')}
                className="rounded-xl px-2.5 py-1 text-zinc-300 hover:text-white hover:bg-white/10 transition"
              >
                Planta
              </button>
              <button
                onClick={() => setCameraView('RESET')}
                className="rounded-xl p-1 text-zinc-400 hover:text-yellow-400 hover:bg-white/10 transition"
                title="Centrar Cámara"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            {/* Toggles Rápidos (Cotas, Uniones, Vista Explosionada) */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-black/80 px-3 py-1.5 backdrop-blur-xl pointer-events-auto shadow-lg text-xs">
              <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDimensions}
                  onChange={(e) => setShowDimensions(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-yellow-400 focus:ring-0"
                />
                <span className="text-[11px] font-semibold">Cotas</span>
              </label>

              <span className="text-zinc-600">|</span>

              <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showJointMarkers}
                  onChange={(e) => setShowJointMarkers(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-yellow-400 focus:ring-0"
                />
                <span className="text-[11px] font-semibold">Uniones</span>
              </label>

              <span className="text-zinc-600">|</span>

              <div className="flex items-center gap-1.5">
                <Layers size={13} className="text-yellow-400" />
                <span className="text-[10px] text-zinc-400">Explosión:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={explodedFactor}
                  onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
                  className="w-16 accent-yellow-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. PANEL DE CONFIGURACIÓN Y PARÁMETROS REALES (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Tarjeta de Parámetros de la Estructura */}
          <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-2xl space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Sliders size={15} className="text-yellow-400" />
                <span>Dimensiones & Perfiles</span>
              </h4>
              {slopeInfo && (
                <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                  Pendiente: {slopeInfo.percent}% ({slopeInfo.deg}°)
                </span>
              )}
            </div>

            {/* CONTROLES PARA TECHO / PÉRGOLA */}
            {structureType === 'ROOF_PERGOLA' && (
              <div className="space-y-4 text-xs">
                {/* Ancho y Largo */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-[11px] font-medium flex justify-between">
                      <span>Ancho Frente</span>
                      <span className="text-yellow-400 font-bold tabular-nums">
                        {roofParams.width_m} m
                      </span>
                    </label>
                    <input
                      type="range"
                      min="2.0"
                      max="8.0"
                      step="0.25"
                      value={roofParams.width_m}
                      onChange={(e) =>
                        setRoofParams({ ...roofParams, width_m: parseFloat(e.target.value) })
                      }
                      className="w-full accent-yellow-400 mt-1 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[11px] font-medium flex justify-between">
                      <span>Largo / Fondo</span>
                      <span className="text-yellow-400 font-bold tabular-nums">
                        {roofParams.length_m} m
                      </span>
                    </label>
                    <input
                      type="range"
                      min="2.0"
                      max="10.0"
                      step="0.25"
                      value={roofParams.length_m}
                      onChange={(e) =>
                        setRoofParams({ ...roofParams, length_m: parseFloat(e.target.value) })
                      }
                      className="w-full accent-yellow-400 mt-1 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Altura Frente y Altura Atrás (Caída de agua) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-[11px] font-medium flex justify-between">
                      <span>Alto Frente</span>
                      <span className="text-yellow-400 font-bold tabular-nums">
                        {roofParams.heightFront_m} m
                      </span>
                    </label>
                    <input
                      type="range"
                      min="2.0"
                      max="4.5"
                      step="0.1"
                      value={roofParams.heightFront_m}
                      onChange={(e) =>
                        setRoofParams({ ...roofParams, heightFront_m: parseFloat(e.target.value) })
                      }
                      className="w-full accent-yellow-400 mt-1 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[11px] font-medium flex justify-between">
                      <span>Alto Atrás (Caída)</span>
                      <span className="text-yellow-400 font-bold tabular-nums">
                        {roofParams.heightBack_m} m
                      </span>
                    </label>
                    <input
                      type="range"
                      min="1.8"
                      max="4.5"
                      step="0.1"
                      value={roofParams.heightBack_m}
                      onChange={(e) =>
                        setRoofParams({ ...roofParams, heightBack_m: parseFloat(e.target.value) })
                      }
                      className="w-full accent-yellow-400 mt-1 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Cantidad de Postes y Montenes */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-[11px] font-medium flex justify-between">
                      <span>Postes al Frente</span>
                      <span className="text-white font-bold">{roofParams.postCountX}</span>
                    </label>
                    <div className="flex gap-1 mt-1">
                      {[2, 3, 4].map((cnt) => (
                        <button
                          key={cnt}
                          onClick={() => setRoofParams({ ...roofParams, postCountX: cnt })}
                          className={`flex-1 rounded-lg py-1 font-bold text-center transition ${
                            roofParams.postCountX === cnt
                              ? 'bg-yellow-400 text-zinc-950'
                              : 'bg-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[11px] font-medium flex justify-between">
                      <span>Montenes / Largueros</span>
                      <span className="text-white font-bold">{roofParams.purlinCount}</span>
                    </label>
                    <div className="flex gap-1 mt-1">
                      {[3, 4, 5, 6, 7].map((cnt) => (
                        <button
                          key={cnt}
                          onClick={() => setRoofParams({ ...roofParams, purlinCount: cnt })}
                          className={`flex-1 rounded-lg py-1 font-bold text-center transition ${
                            roofParams.purlinCount === cnt
                              ? 'bg-yellow-400 text-zinc-950'
                              : 'bg-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selección de Perfiles */}
                <div className="space-y-2 border-t border-white/10 pt-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-400 text-[11px]">Perfil para Columnas / Postes:</span>
                    <select
                      value={roofParams.postMaterialId}
                      onChange={(e) =>
                        setRoofParams({ ...roofParams, postMaterialId: e.target.value })
                      }
                      className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                    >
                      <option value="ptr-3x3-c14">PTR 3" x 3" Cal. 14 (Recomendado estándar)</option>
                      <option value="ptr-4x4-c14">PTR 4" x 4" Cal. 14 (Pesado / Grandes luces)</option>
                      <option value="ptr-2x2-c11">PTR 2" x 2" Cal. 11 (Cédula reforzada)</option>
                      <option value="ptr-2x2-c14">PTR 2" x 2" Cal. 14 (Techos ligeros)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-400 text-[11px]">Perfil Viga Maestra de Carga:</span>
                    <select
                      value={roofParams.beamMaterialId}
                      onChange={(e) =>
                        setRoofParams({ ...roofParams, beamMaterialId: e.target.value })
                      }
                      className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                    >
                      <option value="ptr-4x2-c14">PTR 4" x 2" Cal. 14 (Resistente / Cero flecha)</option>
                      <option value="ptr-3x1.5-c14">PTR 3" x 1 1/2" Cal. 14</option>
                      <option value="monten-4x2-c14">Polín Montén 4" x 2" Cal. 14</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-400 text-[11px]">Perfil para Largueros / Montenes:</span>
                    <select
                      value={roofParams.purlinMaterialId}
                      onChange={(e) =>
                        setRoofParams({ ...roofParams, purlinMaterialId: e.target.value })
                      }
                      className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                    >
                      <option value="monten-4x2-c14">Polín Montén C 4" x 2" Cal. 14 (Clásico)</option>
                      <option value="monten-3x1.5-c14">Polín Montén C 3" x 1 1/2" Cal. 14</option>
                      <option value="ptr-2x1-c14">PTR 2" x 1" Cal. 14 (Tubular estético)</option>
                      <option value="ptr-2x2-c14">PTR 2" x 2" Cal. 14</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-400 text-[11px]">Cubierta / Techo:</span>
                    <select
                      value={roofParams.coverType}
                      onChange={(e) =>
                        setRoofParams({ ...roofParams, coverType: e.target.value as RoofCoverType })
                      }
                      className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                    >
                      <option value="NONE">Sin Cubierta (Solo Estructura de Acero)</option>
                      <option value="LAMINA_R101">Lámina Galvanizada R-101</option>
                      <option value="POLICARBONATO">Policarbonato Celular 6mm Traslúcido</option>
                      <option value="TRASLUCIDA">Lámina Acrílica Traslúcida</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* CONTROLES PARA PORTÓN RESIDENCIAL */}
            {structureType === 'GATE_FRAME' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-[11px] font-medium flex justify-between">
                      <span>Ancho Portón</span>
                      <span className="text-yellow-400 font-bold tabular-nums">
                        {gateParams.width_m} m
                      </span>
                    </label>
                    <input
                      type="range"
                      min="1.0"
                      max="6.0"
                      step="0.1"
                      value={gateParams.width_m}
                      onChange={(e) =>
                        setGateParams({ ...gateParams, width_m: parseFloat(e.target.value) })
                      }
                      className="w-full accent-yellow-400 mt-1 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[11px] font-medium flex justify-between">
                      <span>Altura Portón</span>
                      <span className="text-yellow-400 font-bold tabular-nums">
                        {gateParams.height_m} m
                      </span>
                    </label>
                    <input
                      type="range"
                      min="1.5"
                      max="3.0"
                      step="0.1"
                      value={gateParams.height_m}
                      onChange={(e) =>
                        setGateParams({ ...gateParams, height_m: parseFloat(e.target.value) })
                      }
                      className="w-full accent-yellow-400 mt-1 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-zinc-400 text-[11px]">Perfil de Marco Perimetral (Corte a 45°):</span>
                  <select
                    value={gateParams.frameMaterialId}
                    onChange={(e) =>
                      setGateParams({ ...gateParams, frameMaterialId: e.target.value })
                    }
                    className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="zintro-r300-c16">Tubular 3" x 1 1/2" (R-300) Zintro Cal. 16</option>
                    <option value="zintro-r400-c16">Tubular 4" x 1 1/2" (R-400) Zintro Cal. 16</option>
                    <option value="ptr-2x2-c14">PTR 2" x 2" Cal. 14</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-zinc-400 text-[11px]">Relleno Estético:</span>
                  <select
                    value={gateParams.infillType}
                    onChange={(e) =>
                      setGateParams({
                        ...gateParams,
                        infillType: e.target.value as 'LOUVERS' | 'TUBULAR_BARS' | 'EMPTY',
                      })
                    }
                    className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="LOUVERS">Duela Tubular R-150 Cal. 18 (Louvers Horizontales)</option>
                    <option value="EMPTY">Solo Marco y Refuerzo Central</option>
                  </select>
                </div>
              </div>
            )}

            {/* CONTROLES PARA MESA DE SOLDADOR */}
            {structureType === 'WORK_TABLE' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-zinc-400 text-[10px] font-medium">Largo (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tableParams.length_m}
                      onChange={(e) =>
                        setTableParams({ ...tableParams, length_m: parseFloat(e.target.value) || 1 })
                      }
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-[10px] font-medium">Ancho (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tableParams.width_m}
                      onChange={(e) =>
                        setTableParams({ ...tableParams, width_m: parseFloat(e.target.value) || 1 })
                      }
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-[10px] font-medium">Alto (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={tableParams.height_m}
                      onChange={(e) =>
                        setTableParams({ ...tableParams, height_m: parseFloat(e.target.value) || 0.9 })
                      }
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-zinc-400 text-[11px]">Patas de la Mesa:</span>
                  <select
                    value={tableParams.legMaterialId}
                    onChange={(e) =>
                      setTableParams({ ...tableParams, legMaterialId: e.target.value })
                    }
                    className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="ptr-2x2-c11">PTR 2" x 2" Cal. 11 (Pesado para martilleo)</option>
                    <option value="ptr-3x3-c14">PTR 3" x 3" Cal. 14</option>
                  </select>
                </div>
              </div>
            )}

            {/* Selector de Unión: Soldadura vs Tornillos */}
            <div className="border-t border-white/10 pt-3 space-y-2">
              <span className="text-zinc-400 text-[11px] font-semibold flex items-center gap-1.5">
                <Sparkles size={12} className="text-yellow-400" />
                <span>Tipo de Unión Predeterminada:</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (structureType === 'ROOF_PERGOLA')
                      setRoofParams({ ...roofParams, jointType: 'WELD' });
                    if (structureType === 'GATE_FRAME')
                      setGateParams({ ...gateParams, jointType: 'WELD' });
                    if (structureType === 'WORK_TABLE')
                      setTableParams({ ...tableParams, jointType: 'WELD' });
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 font-bold text-xs transition ${
                    (structureType === 'ROOF_PERGOLA' && roofParams.jointType === 'WELD') ||
                    (structureType === 'GATE_FRAME' && gateParams.jointType === 'WELD') ||
                    (structureType === 'WORK_TABLE' && tableParams.jointType === 'WELD')
                      ? 'bg-yellow-400 text-zinc-950 shadow-md'
                      : 'bg-white/5 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Flame size={14} />
                  <span>Soldadura (E6013)</span>
                </button>

                <button
                  onClick={() => {
                    if (structureType === 'ROOF_PERGOLA')
                      setRoofParams({ ...roofParams, jointType: 'BOLT' });
                    if (structureType === 'GATE_FRAME')
                      setGateParams({ ...gateParams, jointType: 'BOLT' });
                    if (structureType === 'WORK_TABLE')
                      setTableParams({ ...tableParams, jointType: 'BOLT' });
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 font-bold text-xs transition ${
                    (structureType === 'ROOF_PERGOLA' && roofParams.jointType === 'BOLT') ||
                    (structureType === 'GATE_FRAME' && gateParams.jointType === 'BOLT') ||
                    (structureType === 'WORK_TABLE' && tableParams.jointType === 'BOLT')
                      ? 'bg-yellow-400 text-zinc-950 shadow-md'
                      : 'bg-white/5 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Wrench size={14} />
                  <span>Tornillería / Anclas</span>
                </button>
              </div>
            </div>

            {/* Selector de Acabado / Color del Acero */}
            <div className="border-t border-white/10 pt-3 space-y-2">
              <span className="text-zinc-400 text-[11px] font-semibold">Acabado del Acero:</span>
              <div className="grid grid-cols-4 gap-1.5 text-[10px] font-bold">
                {[
                  { id: 'BLACK_MATTE', label: 'Negro Mate', colorBg: 'bg-zinc-900 border-zinc-700' },
                  { id: 'GALVANIZED_ZINTRO', label: 'Zintro', colorBg: 'bg-slate-400 border-slate-300 text-zinc-900' },
                  { id: 'RAW_STEEL', label: 'Carbón', colorBg: 'bg-slate-600 border-slate-500' },
                  { id: 'RED_OXIDE', label: 'Rojo Óxido', colorBg: 'bg-rose-900 border-rose-700' },
                ].map((fin) => (
                  <button
                    key={fin.id}
                    onClick={() => setActiveFinish(fin.id as SteelFinish)}
                    className={`rounded-xl py-1.5 px-1 border text-center transition ${
                      activeFinish === fin.id
                        ? 'ring-2 ring-yellow-400 font-extrabold'
                        : 'opacity-70 hover:opacity-100'
                    } ${fin.colorBg}`}
                  >
                    {fin.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tarjeta de Resumen Ejecutivo y Tramos de 6m */}
          <div className="rounded-3xl border border-yellow-400/30 bg-yellow-400/5 p-5 backdrop-blur-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-yellow-400/20 pb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-yellow-300 flex items-center gap-1.5">
                <Info size={14} />
                <span>Desglose de Tramos de 6m</span>
              </h4>
              <span className="text-[11px] text-zinc-400">Stock Comercial</span>
            </div>

            {/* Lista de Explicación Directa por Perfil */}
            <div className="space-y-3">
              {bom.materials.map((m) => (
                <div
                  key={m.materialId}
                  className="rounded-2xl border border-white/10 bg-black/40 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{m.materialName}</span>
                    <span className="rounded-lg bg-yellow-400/20 text-yellow-300 px-2 py-0.5 text-[11px] font-black tabular-nums">
                      {m.required6mBars} tramo(s) de 6m
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {m.plainExplanation}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-white/5">
                    <span>${m.pricePerBarMXN.toLocaleString('es-MX')} c/u</span>
                    <span className="font-bold text-zinc-300">
                      Subtotal: ${m.totalCostMXN.toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Acciones Rápidas */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleCopyWhatsApp}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold py-3 text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
              >
                {copiedWhatsApp ? <Check size={16} /> : <Share2 size={16} />}
                <span>
                  {copiedWhatsApp ? '¡Copiado para WhatsApp!' : 'Copiar Pedido para Ferretería'}
                </span>
              </button>

              {onOpenCutList && (
                <button
                  onClick={onOpenCutList}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 text-xs transition"
                >
                  Ver Diagramas de Corte y Retales (Detalle)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
