"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Camera,
  Video,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal2,
  Crosshair,
  Download,
  Share2,
  Trash2,
  Usb,
  RefreshCw,
  ChevronLeft,
  Check,
  Sparkles,
  Image as ImageIcon,
  Pause,
  Play,
  SlidersHorizontal,
  X,
  Film,
  Aperture,
  Smartphone,
} from "lucide-react";

interface LoyaScopeAndroidBridge {
  isNativeApp: () => boolean;
  isUsbCameraConnected: () => boolean;
  getUsbCameraName: () => string;
  rescanUsbCamera: () => void;
  saveToGallery: (base64Data: string, filename: string, mimeType: string) => boolean;
}

declare global {
  interface Window {
    LoyaScopeAndroid?: LoyaScopeAndroidBridge;
    onLoyaNativeUsbUpdate?: (connected: boolean, deviceName: string) => void;
  }
}

interface CapturedMedia {
  id: string;
  type: "photo" | "video";
  url: string;
  blob: Blob;
  filename: string;
  timestamp: string;
  width: number;
  height: number;
  zoom: number;
  duration?: number;
}

export default function LoyaScopePage() {
  // Native APK & UVC state
  const [isNativeApk, setIsNativeApk] = useState<boolean>(false);
  const [isNativeUvcMode, setIsNativeUvcMode] = useState<boolean>(false);
  const [nativeUsbConnected, setNativeUsbConnected] = useState<boolean>(false);
  const [nativeUsbName, setNativeUsbName] = useState<string>("Cámara USB-C (OTG)");

  // Camera & Stream state
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isUsbDetected, setIsUsbDetected] = useState<boolean>(false);
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>("Buscando cámara...");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [resolutionLabel, setResolutionLabel] = useState<string>("HD");

  // Optical & Transform state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [mirrored, setMirrored] = useState<boolean>(false);
  const [showReticle, setShowReticle] = useState<boolean>(true);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [showAdjustments, setShowAdjustments] = useState<boolean>(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState<boolean>(false);

  // Capture & Recording state
  const [captureMode, setCaptureMode] = useState<"photo" | "video">("photo");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Gallery state
  const [mediaList, setMediaList] = useState<CapturedMedia[]>([]);
  const [activePreview, setActivePreview] = useState<CapturedMedia | null>(null);
  const [showGalleryDrawer, setShowGalleryDrawer] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const uvcCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordAnimFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFrozenRef = useRef<boolean>(false);

  // Refs for live values inside requestAnimationFrame during video recording
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const rotationRef = useRef(rotation);
  const mirroredRef = useRef(mirrored);
  const brightnessRef = useRef(brightness);
  const contrastRef = useRef(contrast);
  const isNativeUvcModeRef = useRef(isNativeUvcMode);

  useEffect(() => {
    zoomRef.current = zoom;
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);
  useEffect(() => {
    mirroredRef.current = mirrored;
  }, [mirrored]);
  useEffect(() => {
    brightnessRef.current = brightness;
  }, [brightness]);
  useEffect(() => {
    contrastRef.current = contrast;
  }, [contrast]);
  useEffect(() => {
    isNativeUvcModeRef.current = isNativeUvcMode;
  }, [isNativeUvcMode]);
  useEffect(() => {
    isFrozenRef.current = isFrozen;
  }, [isFrozen]);

  // Touch gesture refs (Pinch to zoom + 1-finger pan + double tap)
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3400);
  }, []);

  // Helper to detect if a MediaDeviceInfo is an external / USB-C UVC camera
  const isExternalUsbCamera = useCallback((dev: MediaDeviceInfo, index: number) => {
    const l = (dev.label || "").toLowerCase();
    if (
      l.includes("usb") ||
      l.includes("uvc") ||
      l.includes("external") ||
      l.includes("externa") ||
      l.includes("capture") ||
      l.includes("endoscop") ||
      l.includes("microscop") ||
      l.includes("pc camera") ||
      l.includes("webcam") ||
      l.includes("otg") ||
      l.includes("hdmi") ||
      l.includes("facing external")
    ) {
      return true;
    }

    // Check WebRTC InputDeviceInfo.getCapabilities().facingMode
    const maybeInputDev = dev as MediaDeviceInfo & {
      getCapabilities?: () => MediaTrackCapabilities;
    };
    if (typeof maybeInputDev.getCapabilities === "function") {
      try {
        const caps = maybeInputDev.getCapabilities();
        if (caps && Array.isArray(caps.facingMode)) {
          const hasInternal =
            caps.facingMode.includes("user") || caps.facingMode.includes("environment");
          if (!hasInternal && caps.facingMode.length === 0 && index >= 2) {
            return true;
          }
        }
      } catch {
        // Ignore capability inspection error
      }
    }

    return false;
  }, []);

  // Stop current WebRTC camera stream cleanly
  const stopCurrentStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Start WebRTC stream for a specific deviceId (or auto-discover external USB camera)
  const startCamera = useCallback(
    async (targetDeviceId?: string, forceRescanUsb = false) => {
      setStreamError(null);
      setIsNativeUvcMode(false);
      stopCurrentStream();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStreamError(
          "Tu navegador no permite acceso a cámaras WebRTC. Usa HTTPS o instala la App Android (.APK)."
        );
        return;
      }

      try {
        let stream: MediaStream;

        if (targetDeviceId) {
          // Try opening the specific camera first without rigid 1080p constraints if 720p/VGA is needed
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { exact: targetDeviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            });
          } catch {
            // Pure deviceId constraint for 640x480 USB-C endoscopes/microscopes
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: targetDeviceId } },
              audio: false,
            });
          }
        } else {
          // IMPORTANT: Request { video: true } WITHOUT facingMode first so Android/iOS unlocks external USB-C cameras!
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "environment" },
              audio: false,
            });
          }
        }

        // Now enumerate all video devices with full permissions unlocked
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoInputs);

        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack?.getSettings();
        const currentId =
          settings?.deviceId || targetDeviceId || videoInputs[0]?.deviceId || "";

        // If no specific targetDeviceId was requested (or user clicked Rescan USB), check if an external USB camera exists
        if (!targetDeviceId || forceRescanUsb) {
          const usbCam = videoInputs.find((d, idx) => isExternalUsbCamera(d, idx));
          if (usbCam && usbCam.deviceId && usbCam.deviceId !== currentId) {
            stream.getTracks().forEach((t) => t.stop());
            showToast(`Cámara USB-C detectada: ${usbCam.label || "USB UVC"}`);
            await startCamera(usbCam.deviceId, false);
            return;
          }
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        if (settings?.width && settings?.height) {
          setResolutionLabel(`${settings.width}×${settings.height}`);
        } else {
          setResolutionLabel("LIVE");
        }

        setSelectedDeviceId(currentId);
        const matchedIdx = videoInputs.findIndex((d) => d.deviceId === currentId);
        const matchedDevice = videoInputs[matchedIdx];
        const label =
          matchedDevice?.label ||
          videoTrack?.label ||
          `Cámara #${matchedIdx >= 0 ? matchedIdx + 1 : 1}`;
        setActiveCameraLabel(label);

        const usbDetected = matchedDevice
          ? isExternalUsbCamera(matchedDevice, matchedIdx)
          : false;
        setIsUsbDetected(usbDetected);
        setIsStreaming(true);
        setIsFrozen(false);
      } catch (err: unknown) {
        console.error("Error starting camera:", err);
        const message =
          err instanceof Error ? err.message : "Permiso denegado o cámara ocupada.";
        setStreamError(
          `No se pudo abrir la cámara (${message}). Acepta los permisos de cámara o usa la App Android (.APK) para cámaras USB-C.`
        );
      }
    },
    [stopCurrentStream, isExternalUsbCamera, showToast]
  );

  // Activate Native Android APK USB-C UVC Stream Mode
  const startNativeUsbMode = useCallback(
    (usbName?: string) => {
      stopCurrentStream();
      setStreamError(null);
      setIsNativeUvcMode(true);
      setIsUsbDetected(true);
      setSelectedDeviceId("native-usb-uvc");
      setActiveCameraLabel(usbName || nativeUsbName || "Cámara USB-C (Driver UVC)");
      setResolutionLabel("USB-C UVC");
      setIsStreaming(true);
      setIsFrozen(false);
    },
    [stopCurrentStream, nativeUsbName]
  );

  // Poll `/__uvc_frame.jpg` at ~30 FPS when in Native Android APK USB-C UVC mode
  useEffect(() => {
    if (!isNativeUvcMode) return;
    let active = true;
    const img = new Image();
    img.crossOrigin = "anonymous";

    const fetchNextFrame = () => {
      if (!active) return;
      if (isFrozenRef.current) {
        setTimeout(fetchNextFrame, 100);
        return;
      }
      img.onload = () => {
        if (!active) return;
        const canvas = uvcCanvasRef.current;
        if (canvas) {
          const w = img.naturalWidth || 1280;
          const h = img.naturalHeight || 720;
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            setResolutionLabel(`${w}×${h} UVC`);
          }
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
          }
        }
        if (active) {
          requestAnimationFrame(fetchNextFrame);
        }
      };
      img.onerror = () => {
        if (active) {
          setTimeout(fetchNextFrame, 120);
        }
      };
      img.src = `/__uvc_frame.jpg?t=${Date.now()}`;
    };

    fetchNextFrame();
    return () => {
      active = false;
    };
  }, [isNativeUvcMode]);

  // Initial boot: check Native Android APK bridge + WebRTC + USB hotplug listener
  useEffect(() => {
    const hasBridge =
      typeof window !== "undefined" &&
      typeof window.LoyaScopeAndroid?.isNativeApp === "function" &&
      window.LoyaScopeAndroid.isNativeApp();

    if (hasBridge && window.LoyaScopeAndroid) {
      setIsNativeApk(true);

      window.onLoyaNativeUsbUpdate = (connected: boolean, deviceName: string) => {
        setNativeUsbConnected(connected);
        if (deviceName) setNativeUsbName(deviceName);
        if (connected) {
          showToast(`USB-C UVC conectado: ${deviceName || "Cámara Externa"}`);
          startNativeUsbMode(deviceName);
        } else {
          showToast("Cámara USB-C desconectada, cambiando a cámara interna");
          startCamera();
        }
      };

      if (window.LoyaScopeAndroid.isUsbCameraConnected()) {
        const name = window.LoyaScopeAndroid.getUsbCameraName();
        setNativeUsbConnected(true);
        setNativeUsbName(name || "Cámara USB-C UVC");
        startNativeUsbMode(name);
      } else {
        startCamera();
      }
    } else {
      startCamera();
    }

    // Screen Wake Lock
    let wakeLock: { release: () => Promise<void> } | null = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && navigator.wakeLock) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Ignore if unsupported
      }
    };
    requestWakeLock();

    const handleDeviceChange = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const all = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = all.filter((d) => d.kind === "videoinput");
      setDevices(videoInputs);

      const usbCam = videoInputs.find((d, idx) => isExternalUsbCamera(d, idx));
      if (usbCam) {
        showToast(`USB-C detectado: ${usbCam.label || "Cámara Externa"}`);
        startCamera(usbCam.deviceId);
      }
    };

    navigator.mediaDevices?.addEventListener?.("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", handleDeviceChange);
      stopCurrentStream();
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [startCamera, startNativeUsbMode, stopCurrentStream, isExternalUsbCamera, showToast]);

  // Draw current video or UVC canvas frame (with zoom, pan, rotation, mirror, brightness/contrast) onto a target canvas
  const renderTransformedFrame = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      source: HTMLVideoElement | HTMLCanvasElement,
      sourceW: number,
      sourceH: number,
      outWidth: number,
      outHeight: number,
      z: number,
      p: { x: number; y: number },
      rot: number,
      mir: boolean,
      br: number,
      ct: number
    ) => {
      ctx.save();
      ctx.clearRect(0, 0, outWidth, outHeight);
      if (br !== 100 || ct !== 100) {
        ctx.filter = `brightness(${br}%) contrast(${ct}%)`;
      } else {
        ctx.filter = "none";
      }

      ctx.translate(outWidth / 2, outHeight / 2);
      ctx.translate(p.x * (outWidth / 380), p.y * (outHeight / 380));
      ctx.scale(z, z);

      if (mir) {
        ctx.scale(-1, 1);
      }
      if (rot !== 0) {
        ctx.rotate((rot * Math.PI) / 180);
      }

      ctx.drawImage(source, -sourceW / 2, -sourceH / 2, sourceW, sourceH);
      ctx.restore();
    },
    []
  );

  // Convert Blob to Base64 data URL (for saving via Native Android APK bridge)
  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  // Save/Share helper for Android & iOS Camera Roll ("Guardar en Carrete")
  const saveMediaToCameraRoll = useCallback(
    async (item: CapturedMedia, silentIfDownload = false) => {
      const mimeType =
        item.type === "photo" ? "image/jpeg" : item.blob.type || "video/mp4";

      // 1. If running inside our Native Loya Scope Android APK, save directly into DCIM/LoyaScope via MediaStore!
      if (window.LoyaScopeAndroid?.saveToGallery) {
        try {
          const b64 = await blobToBase64(item.blob);
          const ok = window.LoyaScopeAndroid.saveToGallery(b64, item.filename, mimeType);
          if (ok) {
            showToast("Guardado directamente en tu Carrete (DCIM/LoyaScope)");
            return;
          }
        } catch (e) {
          console.error("Native gallery save error:", e);
        }
      }

      // 2. Mobile Browser Web Share API (opens native iOS/Android sheet with "Save Image" / "Save Video")
      const file = new File([item.blob], item.filename, {
        type: mimeType,
        lastModified: Date.now(),
      });
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (
        isMobileDevice &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: item.filename,
          });
          showToast(
            item.type === "photo"
              ? "Foto lista para el carrete"
              : "Video listo para el carrete"
          );
          return;
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") {
            return;
          }
        }
      }

      // 3. Fallback / Desktop direct download
      const a = document.createElement("a");
      a.href = item.url;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (!silentIfDownload) {
        showToast(
          item.type === "photo"
            ? "Foto descargada en tu dispositivo"
            : "Video descargado en tu dispositivo"
        );
      }
    },
    [showToast]
  );

  // Take a high-resolution photo (works for both Native USB-C UVC and WebRTC)
  const takePhoto = useCallback(async () => {
    if (!isStreaming) return;

    const sourceEl = isNativeUvcMode ? uvcCanvasRef.current : videoRef.current;
    if (!sourceEl) return;

    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 160);

    const srcW =
      sourceEl instanceof HTMLVideoElement
        ? sourceEl.videoWidth || 1920
        : sourceEl.width || 1280;
    const srcH =
      sourceEl instanceof HTMLVideoElement
        ? sourceEl.videoHeight || 1080
        : sourceEl.height || 720;

    const isRotated90 = rotation % 180 !== 0;
    const outW = isRotated90 ? srcH : srcW;
    const outH = isRotated90 ? srcW : srcH;

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderTransformedFrame(
      ctx,
      sourceEl,
      srcW,
      srcH,
      outW,
      outH,
      zoom,
      pan,
      rotation,
      mirrored,
      brightness,
      contrast
    );

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const now = new Date();
        const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const filename = `LoyaScope_${stamp}.jpg`;
        const url = URL.createObjectURL(blob);

        const item: CapturedMedia = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: "photo",
          url,
          blob,
          filename,
          timestamp: now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          width: outW,
          height: outH,
          zoom,
        };

        setMediaList((prev) => [item, ...prev]);
        setActivePreview(item);

        // If inside the Native Android APK, auto-save directly to the Camera Roll!
        if (window.LoyaScopeAndroid?.saveToGallery) {
          const b64 = await blobToBase64(blob);
          window.LoyaScopeAndroid.saveToGallery(b64, filename, "image/jpeg");
          showToast("Foto guardada en el Carrete (DCIM/LoyaScope)");
        } else {
          showToast("Foto capturada • Toca 'Guardar en Carrete'");
        }
      },
      "image/jpeg",
      0.95
    );
  }, [
    isStreaming,
    isNativeUvcMode,
    rotation,
    zoom,
    pan,
    mirrored,
    brightness,
    contrast,
    renderTransformedFrame,
    showToast,
  ]);

  // Start / Stop Video Recording (records the zoomed/transformed canvas for both UVC and WebRTC!)
  const startRecording = useCallback(() => {
    if (!isStreaming || isRecording) return;
    const sourceEl = isNativeUvcMode ? uvcCanvasRef.current : videoRef.current;
    if (!sourceEl) return;

    const srcW =
      sourceEl instanceof HTMLVideoElement
        ? sourceEl.videoWidth || 1280
        : sourceEl.width || 1280;
    const srcH =
      sourceEl instanceof HTMLVideoElement
        ? sourceEl.videoHeight || 720
        : sourceEl.height || 720;

    const isRotated90 = rotationRef.current % 180 !== 0;
    const outW = isRotated90 ? srcH : srcW;
    const outH = isRotated90 ? srcW : srcH;

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    recordCanvasRef.current = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderLoop = () => {
      const currentSource = isNativeUvcModeRef.current
        ? uvcCanvasRef.current
        : videoRef.current;
      if (currentSource && recordCanvasRef.current) {
        const w =
          currentSource instanceof HTMLVideoElement
            ? currentSource.videoWidth || srcW
            : currentSource.width || srcW;
        const h =
          currentSource instanceof HTMLVideoElement
            ? currentSource.videoHeight || srcH
            : currentSource.height || srcH;
        renderTransformedFrame(
          ctx,
          currentSource,
          w,
          h,
          outW,
          outH,
          zoomRef.current,
          panRef.current,
          rotationRef.current,
          mirroredRef.current,
          brightnessRef.current,
          contrastRef.current
        );
      }
      recordAnimFrameRef.current = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    const canvasStream = canvas.captureStream(30);

    const mimeCandidates = [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    const selectedMime =
      mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "";

    try {
      const recorder = selectedMime
        ? new MediaRecorder(canvasStream, {
            mimeType: selectedMime,
            videoBitsPerSecond: 6_000_000,
          })
        : new MediaRecorder(canvasStream);

      recordedChunksRef.current = [];
      const startedAt = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (recordAnimFrameRef.current) {
          cancelAnimationFrame(recordAnimFrameRef.current);
          recordAnimFrameRef.current = null;
        }
        const finalMime = recorder.mimeType || selectedMime || "video/mp4";
        const ext = finalMime.includes("mp4") ? "mp4" : "webm";
        const blob = new Blob(recordedChunksRef.current, { type: finalMime });
        const url = URL.createObjectURL(blob);
        const now = new Date();
        const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const filename = `LoyaScope_${stamp}.${ext}`;
        const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

        const item: CapturedMedia = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: "video",
          url,
          blob,
          filename,
          timestamp: now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          width: outW,
          height: outH,
          zoom: zoomRef.current,
          duration: durationSec,
        };

        setMediaList((prev) => [item, ...prev]);
        setActivePreview(item);

        if (window.LoyaScopeAndroid?.saveToGallery) {
          const b64 = await blobToBase64(blob);
          window.LoyaScopeAndroid.saveToGallery(b64, filename, finalMime);
          showToast("Video guardado en el Carrete (DCIM/LoyaScope)");
        } else {
          showToast("Video grabado • Toca 'Guardar en Carrete'");
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      showToast("Error al iniciar grabación de video");
    }
  }, [isStreaming, isRecording, isNativeUvcMode, renderTransformedFrame, showToast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Freeze / Unfreeze live video
  const toggleFreeze = () => {
    if (isNativeUvcMode) {
      setIsFrozen((f) => !f);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsFrozen(false);
    } else {
      video.pause();
      setIsFrozen(true);
    }
  };

  // Cycle between Native USB-C (if connected) and internal cameras
  const cycleCamera = () => {
    if (isNativeApk && nativeUsbConnected && !isNativeUvcMode) {
      startNativeUsbMode(nativeUsbName);
      return;
    }
    if (devices.length === 0) {
      startCamera(undefined, true);
      return;
    }
    const idx = devices.findIndex((d) => d.deviceId === selectedDeviceId);
    const next = devices[(idx + 1) % devices.length];
    if (next) {
      startCamera(next.deviceId);
    }
  };

  // Pointer gestures on viewfinder (Pinch-to-Zoom, Drag-to-Pan, Double-tap reset)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        setZoom((z) => (z > 1 ? 1 : 2.5));
        setPan({ x: 0, y: 0 });
      }
      lastTapRef.current = now;
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchDistRef.current = dist;
      initialZoomRef.current = zoom;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2 && initialPinchDistRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const scale = dist / initialPinchDistRef.current;
      const nextZoom = Math.min(
        8,
        Math.max(1, Number((initialZoomRef.current * scale).toFixed(2)))
      );
      setZoom(nextZoom);
    } else if (pointersRef.current.size === 1 && zoom > 1 && lastPanPointRef.current) {
      const dx = e.clientX - lastPanPointRef.current.x;
      const dy = e.clientY - lastPanPointRef.current.y;
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      const maxOffset = (zoom - 1) * 180;
      setPan((prev) => ({
        x: Math.max(-maxOffset, Math.min(maxOffset, prev.x + dx)),
        y: Math.max(-maxOffset, Math.min(maxOffset, prev.y + dy)),
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      initialPinchDistRef.current = null;
    }
    if (pointersRef.current.size === 1) {
      const remaining = Array.from(pointersRef.current.values())[0];
      lastPanPointRef.current = { x: remaining.x, y: remaining.y };
    } else {
      lastPanPointRef.current = null;
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const deleteMedia = (id: string) => {
    setMediaList((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((x) => x.id !== id);
    });
    if (activePreview?.id === id) {
      setActivePreview(null);
    }
  };

  return (
    <div className="relative w-full h-dvh bg-[#050608] text-white flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* Top Telemetry & Camera Selector Bar */}
      <header className="relative z-30 flex items-center justify-between px-3 sm:px-5 pt-3 pb-2.5 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95"
            title="Volver a Loya Creative Lab"
          >
            <ChevronLeft size={18} />
          </Link>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                LOYA SCOPE
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {resolutionLabel}
              </span>
            </div>
            <button
              onClick={() => setShowDeviceMenu((v) => !v)}
              className="flex items-center gap-1.5 text-left text-xs text-zinc-300 hover:text-white transition-colors mt-0.5"
            >
              <Usb
                size={12}
                className={isUsbDetected ? "text-emerald-400" : "text-zinc-400"}
              />
              <span className="truncate max-w-[140px] sm:max-w-[240px] font-mono text-[11px]">
                {activeCameraLabel}
              </span>
              <span className="text-[10px] text-emerald-400 underline ml-1">
                Cámaras ({devices.length + (nativeUsbConnected ? 1 : 0) || 1})
              </span>
            </button>
          </div>
        </div>

        {/* Right Quick Optical Tools + APK Download Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {!isNativeApk && (
            <a
              href="/loya-scope.apk"
              download="LoyaScope-USB.apk"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-400/15 hover:bg-emerald-400/25 border border-emerald-400/40 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1 transition-all"
              title="Descargar APK Android con Driver USB-C Nativo"
            >
              <Smartphone size={13} />
              <span className="hidden xs:inline">APK USB-C</span>
            </a>
          )}

          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 font-mono text-xs animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {formatTimer(recordingSeconds)}
            </div>
          )}

          <button
            onClick={toggleFreeze}
            className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1 transition-all ${
              isFrozen
                ? "bg-amber-500/20 border-amber-400/50 text-amber-300"
                : "bg-white/[0.06] border-white/10 text-zinc-300 hover:text-white"
            }`}
            title="Congelar imagen"
          >
            {isFrozen ? <Play size={16} /> : <Pause size={16} />}
          </button>

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white transition-all"
            title="Rotar 90°"
          >
            <RotateCw size={16} />
          </button>

          <button
            onClick={() => setMirrored((m) => !m)}
            className={`p-2 rounded-xl border transition-all ${
              mirrored
                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
                : "bg-white/[0.06] border-white/10 text-zinc-300 hover:text-white"
            }`}
            title="Espejo horizontal"
          >
            <FlipHorizontal2 size={16} />
          </button>

          <button
            onClick={() => setShowReticle((r) => !r)}
            className={`p-2 rounded-xl border transition-all ${
              showReticle
                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
                : "bg-white/[0.06] border-white/10 text-zinc-300 hover:text-white"
            }`}
            title="Mostrar/Ocultar Retícula"
          >
            <Crosshair size={16} />
          </button>

          <button
            onClick={() => setShowAdjustments((a) => !a)}
            className={`p-2 rounded-xl border transition-all ${
              showAdjustments
                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
                : "bg-white/[0.06] border-white/10 text-zinc-300 hover:text-white"
            }`}
            title="Brillo y Contraste"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </header>

      {/* Camera Selector Dropdown Modal */}
      {showDeviceMenu && (
        <div className="absolute top-16 left-3 sm:left-5 z-50 w-84 max-w-[calc(100vw-24px)] rounded-2xl bg-[#0D1015]/95 backdrop-blur-2xl border border-white/15 p-3.5 shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Usb size={14} className="text-emerald-400" /> Selector de Cámaras
            </span>
            <button
              onClick={() => {
                if (isNativeApk && window.LoyaScopeAndroid) {
                  window.LoyaScopeAndroid.rescanUsbCamera();
                } else {
                  startCamera(undefined, true);
                }
                setShowDeviceMenu(false);
              }}
              className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw size={11} /> Escanear USB-C
            </button>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {/* Native USB-C UVC Option when inside Loya Scope APK */}
            {isNativeApk && (
              <button
                onClick={() => {
                  if (nativeUsbConnected) {
                    startNativeUsbMode(nativeUsbName);
                  } else {
                    window.LoyaScopeAndroid?.rescanUsbCamera();
                  }
                  setShowDeviceMenu(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all ${
                  isNativeUvcMode
                    ? "bg-emerald-500/20 border border-emerald-400/40 text-white"
                    : "bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 text-emerald-200"
                }`}
              >
                <div className="truncate pr-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <Usb size={13} className="text-emerald-400" />
                    <span>{nativeUsbConnected ? nativeUsbName : "Conectar Cámara USB-C (OTG)"}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400">
                    {nativeUsbConnected
                      ? "● Driver UVC Nativo Activo"
                      : "Toca para escanear puerto USB-C"}
                  </span>
                </div>
                {isNativeUvcMode && <Check size={14} className="text-emerald-400 shrink-0" />}
              </button>
            )}

            {/* WebRTC Video Input Devices */}
            {devices.map((dev, idx) => {
              const isSelected = !isNativeUvcMode && dev.deviceId === selectedDeviceId;
              const isUsb = isExternalUsbCamera(dev, idx);
              return (
                <button
                  key={dev.deviceId || idx}
                  onClick={() => {
                    startCamera(dev.deviceId);
                    setShowDeviceMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all ${
                    isSelected
                      ? "bg-emerald-500/20 border border-emerald-400/40 text-white"
                      : "bg-white/[0.03] hover:bg-white/[0.08] border border-transparent text-zinc-300"
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold truncate">
                      {dev.label || `Cámara #${idx + 1}`}
                    </div>
                    {isUsb && (
                      <span className="text-[10px] text-emerald-400">
                        ● Externa / USB UVC
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={14} className="text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation & Official Native APK Download for Android USB-C */}
          {!isNativeApk && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                ¿Tu celular Android no muestra la cámara USB-C en el navegador? Descarga nuestra APK oficial con <strong className="text-emerald-300">Driver USB-C UVC Nativo</strong> y permisos de cámara activados:
              </p>
              <a
                href="/loya-scope.apk"
                download="LoyaScope-USB.apk"
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Download size={14} />
                <span>Descargar Loya Scope (.APK)</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Image Adjustments Panel (Brightness / Contrast) */}
      {showAdjustments && (
        <div className="absolute top-16 right-3 sm:right-5 z-50 w-72 rounded-2xl bg-[#0D1015]/95 backdrop-blur-2xl border border-white/15 p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-300">
              Ajuste Óptico en Vivo
            </span>
            <button
              onClick={() => {
                setBrightness(100);
                setContrast(100);
              }}
              className="text-[11px] font-mono text-emerald-400 hover:underline"
            >
              Reset
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Brillo</span>
              <span>{brightness}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={180}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-emerald-400"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Contraste</span>
              <span>{contrast}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={180}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full accent-emerald-400"
            />
          </div>
        </div>
      )}

      {/* Main Interactive Optical Viewfinder */}
      <main
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden touch-none bg-[#030406]"
      >
        {/* Native USB-C UVC Canvas Stream */}
        <canvas
          ref={uvcCanvasRef}
          style={{
            display: isNativeUvcMode ? "block" : "none",
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom}) ${
              mirrored ? "scaleX(-1)" : ""
            } rotate(${rotation}deg)`,
            filter: `brightness(${brightness}%) contrast(${contrast}%)`,
          }}
          className="max-w-full max-h-full w-full h-full object-contain transition-transform duration-75 ease-out pointer-events-none"
        />

        {/* Standard WebRTC Video Stream */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            display: isNativeUvcMode ? "none" : "block",
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom}) ${
              mirrored ? "scaleX(-1)" : ""
            } rotate(${rotation}deg)`,
            filter: `brightness(${brightness}%) contrast(${contrast}%)`,
          }}
          className="max-w-full max-h-full w-full h-full object-contain transition-transform duration-75 ease-out pointer-events-none"
        />

        {/* Shutter Flash Effect */}
        {shutterFlash && (
          <div className="absolute inset-0 bg-white/80 z-30 pointer-events-none transition-opacity" />
        )}

        {/* Precision Reticle Overlay */}
        {showReticle && isStreaming && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="w-[82%] h-[74%] max-w-3xl max-h-[620px] relative border border-emerald-400/15 rounded-2xl">
              <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-emerald-400/70 rounded-tl-md" />
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-emerald-400/70 rounded-tr-md" />
              <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-emerald-400/70 rounded-bl-md" />
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-emerald-400/70 rounded-br-md" />
            </div>
            <div className="absolute w-14 h-14 rounded-full border border-emerald-400/40 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
              <div className="absolute w-24 h-[1px] bg-emerald-400/25" />
              <div className="absolute h-24 w-[1px] bg-emerald-400/25" />
            </div>
          </div>
        )}

        {/* Telemetry HUD Badges inside Viewfinder */}
        {isStreaming && (
          <div className="absolute top-3 left-4 z-20 pointer-events-none flex flex-wrap items-center gap-2">
            {isNativeUvcMode && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/50 text-emerald-300 font-mono text-xs">
                ● USB-C UVC DIRECTO
              </span>
            )}
            {zoom > 1 && (
              <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-emerald-400/40 text-emerald-300 font-mono text-xs">
                ZOOM {zoom.toFixed(1)}x • Arrastra para mover
              </span>
            )}
            {isFrozen && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/50 text-amber-300 font-mono text-xs">
                IMAGEN CONGELADA
              </span>
            )}
          </div>
        )}

        {/* Error or Connect USB Prompt */}
        {streamError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <div className="max-w-md w-full rounded-3xl bg-[#0E1117] border border-white/15 p-6 text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <Usb size={28} />
              </div>
              <h2 className="text-lg font-bold text-white">
                Conecta tu Cámara USB-C
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono leading-relaxed">
                {streamError}
              </p>
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => startCamera(undefined, true)}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-300 transition-all"
                >
                  Reintentar Conexión
                </button>
                {!isNativeApk && (
                  <a
                    href="/loya-scope.apk"
                    download="LoyaScope-USB.apk"
                    className="w-full py-3 px-4 rounded-xl bg-white/[0.08] border border-emerald-400/40 text-emerald-300 font-bold text-xs uppercase tracking-wider hover:bg-white/[0.14] transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={15} />
                    <span>Descargar APK con Driver USB-C</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-zinc-900/95 border border-emerald-400/40 text-emerald-300 text-xs font-mono shadow-xl backdrop-blur-xl flex items-center gap-2 whitespace-nowrap">
            <Sparkles size={13} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </main>

      {/* Bottom Zoom Controls & Shutter / Video Dock */}
      <footer className="relative z-30 px-4 pt-2 pb-6 sm:pb-5 bg-gradient-to-t from-black via-black/95 to-transparent space-y-3">
        {/* Zoom Bar: Quick Presets + Precision Slider */}
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2">
            <button
              onClick={() => setZoom((z) => Math.max(1, Number((z - 0.5).toFixed(1))))}
              className="p-1 text-zinc-400 hover:text-white active:scale-90 transition"
              aria-label="Reducir zoom"
            >
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min={1}
              max={8}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-emerald-400 h-1.5 bg-white/15 rounded-lg cursor-pointer"
              aria-label="Control de zoom"
            />

            <button
              onClick={() => setZoom((z) => Math.min(8, Number((z + 0.5).toFixed(1))))}
              className="p-1 text-zinc-400 hover:text-white active:scale-90 transition"
              aria-label="Aumentar zoom"
            >
              <ZoomIn size={16} />
            </button>

            <div className="flex items-center gap-1 pl-1 border-l border-white/10">
              {[1, 2, 4, 8].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setZoom(preset)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all ${
                    Math.abs(zoom - preset) < 0.15
                      ? "bg-emerald-400 text-zinc-950"
                      : "text-zinc-400 hover:text-white bg-white/[0.04]"
                  }`}
                >
                  {preset}x
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selector Pill (FOTO / VIDEO) */}
          <div className="flex items-center justify-center gap-6 text-xs font-mono tracking-widest uppercase">
            <button
              onClick={() => !isRecording && setCaptureMode("photo")}
              className={`py-1 px-3 rounded-full transition-all ${
                captureMode === "photo"
                  ? "text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-400/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              FOTO
            </button>
            <button
              onClick={() => setCaptureMode("video")}
              className={`py-1 px-3 rounded-full transition-all ${
                captureMode === "video"
                  ? "text-red-400 font-bold bg-red-500/15 border border-red-400/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              VIDEO
            </button>
          </div>
        </div>

        {/* Primary Action Row: Gallery Thumbnail | Main Shutter/Record | Switch Camera */}
        <div className="max-w-md mx-auto flex items-center justify-between px-4">
          {/* Left: Gallery / Last Capture Button */}
          <button
            onClick={() => {
              if (mediaList.length > 0) {
                setActivePreview(mediaList[0]);
              } else {
                setShowGalleryDrawer(true);
              }
            }}
            className="relative w-13 h-13 rounded-2xl bg-white/[0.06] border border-white/15 overflow-hidden flex items-center justify-center hover:border-emerald-400/50 transition-all active:scale-95"
            title="Abrir galería / Guardar en carrete"
          >
            {mediaList.length > 0 ? (
              mediaList[0].type === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaList[0].url}
                  alt="Última captura"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-emerald-950/60 flex flex-col items-center justify-center text-emerald-300">
                  <Film size={18} />
                  <span className="text-[9px] font-mono">VIDEO</span>
                </div>
              )
            ) : (
              <ImageIcon size={20} className="text-zinc-400" />
            )}
            {mediaList.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-400 text-zinc-950 font-mono text-[10px] font-bold">
                {mediaList.length}
              </span>
            )}
          </button>

          {/* Center: Shutter / Video Record Button */}
          {captureMode === "photo" ? (
            <button
              onClick={takePhoto}
              disabled={!isStreaming}
              className="w-18 h-18 rounded-full p-1.5 border-4 border-emerald-400/90 flex items-center justify-center active:scale-90 transition-all shadow-[0_0_30px_rgba(0,230,153,0.3)] disabled:opacity-40"
              aria-label="Tomar Foto"
            >
              <div className="w-full h-full rounded-full bg-white hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <Camera size={24} className="text-zinc-950" />
              </div>
            </button>
          ) : (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isStreaming}
              className={`w-18 h-18 rounded-full p-1.5 border-4 flex items-center justify-center active:scale-90 transition-all ${
                isRecording
                  ? "border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.5)]"
                  : "border-red-400/90 shadow-[0_0_25px_rgba(239,68,68,0.25)]"
              }`}
              aria-label={isRecording ? "Detener Grabación" : "Iniciar Grabación"}
            >
              <div
                className={`transition-all duration-200 ${
                  isRecording
                    ? "w-7 h-7 rounded-md bg-red-500"
                    : "w-full h-full rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center"
                }`}
              >
                {!isRecording && <Video size={24} className="text-white" />}
              </div>
            </button>
          )}

          {/* Right: While recording video, allow taking a simultaneous photo; otherwise switch USB/camera */}
          {isRecording ? (
            <button
              onClick={takePhoto}
              className="w-13 h-13 rounded-2xl bg-white/[0.1] border border-white/20 flex items-center justify-center text-white hover:bg-white/[0.2] active:scale-90 transition-all"
              title="Capturar foto mientras grabas"
            >
              <Camera size={20} />
            </button>
          ) : (
            <button
              onClick={cycleCamera}
              className="w-13 h-13 rounded-2xl bg-white/[0.06] border border-white/15 flex flex-col items-center justify-center text-zinc-300 hover:text-white hover:border-emerald-400/40 active:scale-90 transition-all"
              title="Cambiar entre Cámara USB-C y cámaras del teléfono"
            >
              <RefreshCw size={18} />
              <span className="text-[9px] font-mono mt-0.5">CAM</span>
            </button>
          )}
        </div>
      </footer>

      {/* Instant Capture Preview & "Guardar en el Carrete" Modal */}
      {activePreview && (
        <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs uppercase">
                {activePreview.type === "photo" ? "FOTO CAPTURADA" : "VIDEO GRABADO"}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {activePreview.width}×{activePreview.height} • {activePreview.zoom.toFixed(1)}x
              </span>
            </div>

            <div className="flex items-center gap-2">
              {mediaList.length > 1 && (
                <button
                  onClick={() => {
                    setActivePreview(null);
                    setShowGalleryDrawer(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.08] border border-white/10 text-xs font-mono text-zinc-200 hover:text-white"
                >
                  Ver todas ({mediaList.length})
                </button>
              )}
              <button
                onClick={() => setActivePreview(null)}
                className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 my-4 flex items-center justify-center overflow-hidden rounded-2xl bg-[#07090D] border border-white/10 p-2">
            {activePreview.type === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activePreview.url}
                alt={activePreview.filename}
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            ) : (
              <video
                src={activePreview.url}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            )}
          </div>

          <div className="max-w-md mx-auto w-full space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => saveMediaToCameraRoll(activePreview)}
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
              >
                <Share2 size={18} />
                <span>Guardar en Carrete</span>
              </button>

              <a
                href={activePreview.url}
                download={activePreview.filename}
                onClick={() => showToast("Archivo descargado")}
                className="w-full py-3.5 px-5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Download size={18} />
                <span>Descargar Archivo</span>
              </a>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] font-mono text-zinc-400">
                {isNativeApk
                  ? "Guardado automático en Galería → álbum DCIM/LoyaScope."
                  : `En iPhone/Android: toca "Guardar en Carrete" → "Guardar ${
                      activePreview.type === "photo" ? "imagen" : "video"
                    }".`}
              </p>
              <button
                onClick={() => deleteMedia(activePreview.id)}
                className="p-2 rounded-xl text-red-400 hover:bg-red-500/15 transition-colors flex items-center gap-1 text-xs font-mono"
              >
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Gallery Drawer */}
      {showGalleryDrawer && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col p-4 sm:p-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white">
                Capturas de la Sesión ({mediaList.length})
              </h3>
              <p className="text-xs font-mono text-zinc-400">
                Toca cualquier foto o video para guardarlo en el carrete del celular
              </p>
            </div>
            <button
              onClick={() => setShowGalleryDrawer(false)}
              className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {mediaList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 font-mono text-sm gap-2">
              <Aperture size={32} className="text-zinc-600" />
              <p>Aún no has tomado fotos ni videos en esta sesión.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 content-start">
              {mediaList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setShowGalleryDrawer(false);
                    setActivePreview(item);
                  }}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-emerald-400/50 cursor-pointer"
                >
                  {item.type === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between text-[10px] font-mono text-zinc-200">
                    <span>
                      {item.type === "photo" ? "FOTO" : `VIDEO ${item.duration || 1}s`}
                    </span>
                    <span>{item.zoom.toFixed(1)}x</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
