"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  RotateCw,
  FlipHorizontal2,
  Grid3X3,
  Download,
  Share2,
  Trash2,
  Usb,
  RefreshCw,
  ChevronLeft,
  Check,
  Pause,
  Play,
  SlidersHorizontal,
  X,
  Smartphone,
  Maximize2,
  Minimize2,
  Sun,
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
  const [nativeUsbName, setNativeUsbName] = useState<string>("USB-C Camera");

  // Camera & Stream state
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isUsbDetected, setIsUsbDetected] = useState<boolean>(false);
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>("Cámara");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [resolutionLabel, setResolutionLabel] = useState<string>("HD");
  const [fillScreen, setFillScreen] = useState<boolean>(true);

  // Optical & Transform state
  const [zoom, setZoom] = useState<number>(1);
  const [showZoomDial, setShowZoomDial] = useState<boolean>(false);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [mirrored, setMirrored] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [showAdjustments, setShowAdjustments] = useState<boolean>(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState<boolean>(false);

  // iOS Tap-to-Focus Box state
  const [focusBox, setFocusBox] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

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
  const zoomDialTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Touch gesture refs
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const movedDuringTouchRef = useRef<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  const revealZoomDialTemporarily = useCallback(() => {
    setShowZoomDial(true);
    if (zoomDialTimeoutRef.current) clearTimeout(zoomDialTimeoutRef.current);
    zoomDialTimeoutRef.current = setTimeout(() => {
      setShowZoomDial(false);
    }, 3200);
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
        // Ignore
      }
    }

    return false;
  }, []);

  const stopCurrentStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(
    async (targetDeviceId?: string, forceRescanUsb = false) => {
      setStreamError(null);
      setIsNativeUvcMode(false);
      stopCurrentStream();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStreamError(
          "Tu navegador no permite acceso a cámaras. Usa HTTPS o instala la App Android (.APK)."
        );
        return;
      }

      try {
        let stream: MediaStream;

        if (targetDeviceId) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { exact: targetDeviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
              audio: false,
            });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: targetDeviceId } },
              audio: false,
            });
          }
        } else {
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

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoInputs);

        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack?.getSettings();
        const currentId =
          settings?.deviceId || targetDeviceId || videoInputs[0]?.deviceId || "";

        if (!targetDeviceId || forceRescanUsb) {
          const usbCam = videoInputs.find((d, idx) => isExternalUsbCamera(d, idx));
          if (usbCam && usbCam.deviceId && usbCam.deviceId !== currentId) {
            stream.getTracks().forEach((t) => t.stop());
            showToast(`USB-C conectado: ${usbCam.label || "USB UVC"}`);
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
          setResolutionLabel(
            settings.height >= 1080 ? "1080p" : settings.height >= 720 ? "720p" : "SD"
          );
        } else {
          setResolutionLabel("HD");
        }

        setSelectedDeviceId(currentId);
        const matchedIdx = videoInputs.findIndex((d) => d.deviceId === currentId);
        const matchedDevice = videoInputs[matchedIdx];
        const label =
          matchedDevice?.label ||
          videoTrack?.label ||
          `Cámara ${matchedIdx >= 0 ? matchedIdx + 1 : 1}`;
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
          `No se pudo abrir la cámara (${message}). Acepta los permisos o instala la App Android (.APK) para cámaras USB-C.`
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
      setActiveCameraLabel(usbName || nativeUsbName || "USB-C Camera");
      setResolutionLabel("USB-C");
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
            setResolutionLabel(`${h}p USB`);
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

  // Initial boot
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
          showToast(`USB-C conectado: ${deviceName || "UVC"}`);
          startNativeUsbMode(deviceName);
        } else {
          showToast("USB-C desconectado");
          startCamera();
        }
      };

      if (window.LoyaScopeAndroid.isUsbCameraConnected()) {
        const name = window.LoyaScopeAndroid.getUsbCameraName();
        setNativeUsbConnected(true);
        setNativeUsbName(name || "USB-C UVC");
        startNativeUsbMode(name);
      } else {
        startCamera();
      }
    } else {
      startCamera();
    }

    let wakeLock: { release: () => Promise<void> } | null = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && navigator.wakeLock) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Ignore
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

  // Draw current video or UVC canvas frame onto target canvas
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

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  // Save/Share helper for iOS & Android Camera Roll ("Guardar en Carrete")
  const saveMediaToCameraRoll = useCallback(
    async (item: CapturedMedia, silentIfDownload = false) => {
      const mimeType =
        item.type === "photo" ? "image/jpeg" : item.blob.type || "video/mp4";

      if (window.LoyaScopeAndroid?.saveToGallery) {
        try {
          const b64 = await blobToBase64(item.blob);
          const ok = window.LoyaScopeAndroid.saveToGallery(b64, item.filename, mimeType);
          if (ok) {
            showToast("Guardado en el Carrete");
            return;
          }
        } catch (e) {
          console.error("Native gallery save error:", e);
        }
      }

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
          showToast("Guardado en el Carrete");
          return;
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") {
            return;
          }
        }
      }

      const a = document.createElement("a");
      a.href = item.url;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (!silentIfDownload) {
        showToast("Guardado en tu dispositivo");
      }
    },
    [showToast]
  );

  // Take a photo
  const takePhoto = useCallback(async () => {
    if (!isStreaming) return;

    const sourceEl = isNativeUvcMode ? uvcCanvasRef.current : videoRef.current;
    if (!sourceEl) return;

    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 130);

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
        const filename = `IMG_${stamp}.jpg`;
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

        if (window.LoyaScopeAndroid?.saveToGallery) {
          const b64 = await blobToBase64(blob);
          window.LoyaScopeAndroid.saveToGallery(b64, filename, "image/jpeg");
          showToast("Foto guardada en Carrete");
        } else {
          setActivePreview(item);
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

  // Start Video Recording
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
        const filename = `VID_${stamp}.${ext}`;
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

        if (window.LoyaScopeAndroid?.saveToGallery) {
          const b64 = await blobToBase64(blob);
          window.LoyaScopeAndroid.saveToGallery(b64, filename, finalMime);
          showToast("Video guardado en Carrete");
        } else {
          setActivePreview(item);
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
      showToast("Error al grabar video");
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

  // Pointer gestures on full-screen viewfinder (Pinch-to-Zoom, Drag-to-Pan, Tap-to-Focus Box, Double-Tap Zoom)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movedDuringTouchRef.current = false;

    if (pointersRef.current.size === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 260) {
        setZoom((z) => (z > 1 ? 1 : 2));
        setPan({ x: 0, y: 0 });
      }
      lastTapRef.current = now;
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchDistRef.current = dist;
      initialZoomRef.current = zoom;
      revealZoomDialTemporarily();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    const prevPt = pointersRef.current.get(e.pointerId);
    if (prevPt && Math.hypot(e.clientX - prevPt.x, e.clientY - prevPt.y) > 6) {
      movedDuringTouchRef.current = true;
    }
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2 && initialPinchDistRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const scale = dist / initialPinchDistRef.current;
      const nextZoom = Math.min(
        8,
        Math.max(1, Number((initialZoomRef.current * scale).toFixed(1)))
      );
      setZoom(nextZoom);
      revealZoomDialTemporarily();
    } else if (pointersRef.current.size === 1 && zoom > 1 && lastPanPointRef.current) {
      const dx = e.clientX - lastPanPointRef.current.x;
      const dy = e.clientY - lastPanPointRef.current.y;
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      const maxOffset = (zoom - 1) * 220;
      setPan((prev) => ({
        x: Math.max(-maxOffset, Math.min(maxOffset, prev.x + dx)),
        y: Math.max(-maxOffset, Math.min(maxOffset, prev.y + dy)),
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const wasSingleTap =
      pointersRef.current.size === 1 && !movedDuringTouchRef.current;
    pointersRef.current.delete(e.pointerId);

    if (wasSingleTap) {
      setShowDeviceMenu(false);
      setShowAdjustments(false);
      // Show Apple yellow focus square at tap location
      setFocusBox({ x: e.clientX, y: e.clientY, visible: true });
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = setTimeout(() => {
        setFocusBox((prev) => ({ ...prev, visible: false }));
      }, 1500);
    }

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
    const h = Math.floor(sec / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((sec % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
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
    <div className="fixed inset-0 w-screen h-dvh bg-black text-white select-none overflow-hidden font-sans">
      {/* FULL-SCREEN EDGE-TO-EDGE CAMERA VIEWFINDER */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute inset-0 w-full h-full overflow-hidden touch-none bg-black"
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
          className={`w-full h-full ${
            fillScreen ? "object-cover" : "object-contain"
          } transition-transform duration-75 ease-out pointer-events-none`}
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
          className={`w-full h-full ${
            fillScreen ? "object-cover" : "object-contain"
          } transition-transform duration-75 ease-out pointer-events-none`}
        />

        {/* iOS Shutter Black/White Flash */}
        {shutterFlash && (
          <div className="absolute inset-0 bg-black/75 z-30 pointer-events-none" />
        )}

        {/* Authentic Apple iOS Rule-of-Thirds 3x3 Grid Overlay */}
        {showGrid && isStreaming && (
          <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3">
            <div className="border-r border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-r border-b border-white/25 flex items-center justify-center">
              <div className="w-4 h-[1px] bg-white/40 absolute" />
              <div className="h-4 w-[1px] bg-white/40 absolute" />
            </div>
            <div className="border-b border-white/25" />
            <div className="border-r border-white/25" />
            <div className="border-r border-white/25" />
            <div />
          </div>
        )}

        {/* Authentic Apple Yellow Tap-to-Focus Square */}
        {focusBox.visible && (
          <div
            style={{
              left: focusBox.x - 38,
              top: focusBox.y - 38,
            }}
            className="absolute w-[76px] h-[76px] border border-[#FFD60A] pointer-events-none z-20 transition-transform duration-150 scale-100"
          >
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-[1px] h-2 bg-[#FFD60A]" />
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-[1px] h-2 bg-[#FFD60A]" />
            <div className="absolute top-1/2 -left-0.5 -translate-y-1/2 w-2 h-[1px] bg-[#FFD60A]" />
            <div className="absolute top-1/2 -right-0.5 -translate-y-1/2 w-2 h-[1px] bg-[#FFD60A]" />
            <Sun
              size={14}
              className="absolute -right-6 top-1/2 -translate-y-1/2 text-[#FFD60A]"
            />
          </div>
        )}
      </div>

      {/* FLOATING TOP APPLE CAMERA BAR */}
      <header className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 bg-gradient-to-b from-black/65 via-black/25 to-transparent pointer-events-none">
        {/* Left: Home & Camera / USB-C Selector Pill */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-xl flex items-center justify-center text-white/90 hover:text-white active:scale-90 transition"
            title="Salir al inicio"
          >
            <ChevronLeft size={20} />
          </Link>

          <button
            onClick={() => setShowDeviceMenu((v) => !v)}
            className="h-9 px-3 rounded-full bg-black/45 backdrop-blur-xl border border-white/15 flex items-center gap-1.5 text-xs font-medium text-white active:scale-95 transition"
          >
            <Usb
              size={13}
              className={isUsbDetected ? "text-[#FFD60A]" : "text-white/75"}
            />
            <span className="truncate max-w-[115px] sm:max-w-[200px]">
              {activeCameraLabel}
            </span>
            <span className="text-[10px] font-semibold text-[#FFD60A] ml-0.5">
              {resolutionLabel}
            </span>
          </button>
        </div>

        {/* Center: Apple iOS Red Recording Timer Pill */}
        {isRecording && (
          <div className="pointer-events-auto px-3 py-1 rounded-full bg-[#FF3B30] text-white text-xs font-mono font-semibold tracking-wider flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>{formatTimer(recordingSeconds)}</span>
          </div>
        )}

        {/* Right: Apple iOS Circular Utility Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {!isNativeApk && (
            <a
              href="/loya-scope.apk"
              download="LoyaScope-USB.apk"
              className="h-9 px-3 rounded-full bg-[#FFD60A] text-black text-xs font-bold flex items-center gap-1 shadow-lg active:scale-95 transition"
              title="Descargar APK con soporte USB-C"
            >
              <Smartphone size={13} />
              <span>APK</span>
            </a>
          )}

          <button
            onClick={() => setFillScreen((f) => !f)}
            className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-xl flex items-center justify-center text-white/90 active:scale-90 transition"
            title={fillScreen ? "Ajustar imagen completa" : "Llenar toda la pantalla"}
          >
            {fillScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className={`w-9 h-9 rounded-full backdrop-blur-xl flex items-center justify-center active:scale-90 transition ${
              rotation !== 0
                ? "bg-[#FFD60A] text-black"
                : "bg-black/45 text-white/90"
            }`}
            title="Rotar 90°"
          >
            <RotateCw size={16} />
          </button>

          <button
            onClick={() => setMirrored((m) => !m)}
            className={`w-9 h-9 rounded-full backdrop-blur-xl flex items-center justify-center active:scale-90 transition ${
              mirrored ? "bg-[#FFD60A] text-black" : "bg-black/45 text-white/90"
            }`}
            title="Espejo"
          >
            <FlipHorizontal2 size={16} />
          </button>

          <button
            onClick={() => setShowGrid((g) => !g)}
            className={`w-9 h-9 rounded-full backdrop-blur-xl flex items-center justify-center active:scale-90 transition ${
              showGrid ? "bg-[#FFD60A] text-black" : "bg-black/45 text-white/90"
            }`}
            title="Cuadrícula"
          >
            <Grid3X3 size={16} />
          </button>

          <button
            onClick={() => setShowAdjustments((a) => !a)}
            className={`w-9 h-9 rounded-full backdrop-blur-xl flex items-center justify-center active:scale-90 transition ${
              showAdjustments || brightness !== 100 || contrast !== 100
                ? "bg-[#FFD60A] text-black"
                : "bg-black/45 text-white/90"
            }`}
            title="Exposición y Contraste"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </header>

      {/* iOS Translucent Camera Selector Sheet */}
      {showDeviceMenu && (
        <div className="fixed top-16 left-4 z-50 w-80 max-w-[calc(100vw-32px)] rounded-3xl bg-zinc-900/85 backdrop-blur-2xl border border-white/15 p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-semibold tracking-wide text-white/90 flex items-center gap-1.5">
              <Usb size={14} className="text-[#FFD60A]" /> Seleccionar Cámara
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
              className="text-xs font-medium text-[#FFD60A] flex items-center gap-1"
            >
              <RefreshCw size={12} /> Buscar USB-C
            </button>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
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
                className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs flex items-center justify-between transition ${
                  isNativeUvcMode
                    ? "bg-[#FFD60A] text-black font-bold"
                    : "bg-white/10 text-white"
                }`}
              >
                <div className="truncate pr-2">
                  <div className="flex items-center gap-1.5">
                    <Usb size={13} />
                    <span>
                      {nativeUsbConnected
                        ? nativeUsbName
                        : "Conectar Cámara USB-C (OTG)"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] ${
                      isNativeUvcMode ? "text-black/75" : "text-[#FFD60A]"
                    }`}
                  >
                    {nativeUsbConnected
                      ? "● USB-C UVC Directo"
                      : "Toca para activar puerto USB-C"}
                  </span>
                </div>
                {isNativeUvcMode && <Check size={15} />}
              </button>
            )}

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
                  className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs flex items-center justify-between transition ${
                    isSelected
                      ? "bg-[#FFD60A] text-black font-bold"
                      : "bg-white/[0.06] hover:bg-white/[0.12] text-white"
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="truncate">
                      {dev.label || `Cámara ${idx + 1}`}
                    </div>
                    {isUsb && (
                      <span
                        className={`text-[10px] ${
                          isSelected ? "text-black/75" : "text-[#FFD60A]"
                        }`}
                      >
                        ● Cámara USB-C Externa
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={15} />}
                </button>
              );
            })}
          </div>

          {!isNativeApk && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <p className="text-[11px] text-white/70 leading-snug">
                Para detectar cámaras USB-C en Android sin restricciones del navegador, instala nuestra app nativa:
              </p>
              <a
                href="/loya-scope.apk"
                download="LoyaScope-USB.apk"
                className="w-full py-2.5 px-3 rounded-2xl bg-[#FFD60A] text-black font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                <span>Descargar Loya Scope (.APK)</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* iOS Exposure / Contrast Popover */}
      {showAdjustments && (
        <div className="fixed top-16 right-4 z-50 w-68 rounded-3xl bg-zinc-900/85 backdrop-blur-2xl border border-white/15 p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/90">
              Exposición y Contraste
            </span>
            <button
              onClick={() => {
                setBrightness(100);
                setContrast(100);
              }}
              className="text-xs font-medium text-[#FFD60A]"
            >
              Restablecer
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-white/70">
              <span>Exposición</span>
              <span className="text-[#FFD60A] font-mono">{brightness}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={180}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-[#FFD60A]"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-white/70">
              <span>Contraste</span>
              <span className="text-[#FFD60A] font-mono">{contrast}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={180}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full accent-[#FFD60A]"
            />
          </div>
          <div className="pt-1 flex justify-between items-center border-t border-white/10">
            <span className="text-xs text-white/70">Congelar imagen</span>
            <button
              onClick={toggleFreeze}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                isFrozen ? "bg-[#FFD60A] text-black" : "bg-white/10 text-white"
              }`}
            >
              {isFrozen ? <Play size={12} /> : <Pause size={12} />}
              <span>{isFrozen ? "Reanudar" : "Congelar"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Toast Pill */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-xl border border-white/15 text-[#FFD60A] text-xs font-medium shadow-xl whitespace-nowrap pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Connection Error Overlay */}
      {streamError && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
          <div className="max-w-sm w-full rounded-3xl bg-zinc-900/95 border border-white/15 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-[#FFD60A]/15 flex items-center justify-center mx-auto text-[#FFD60A]">
              <Usb size={26} />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Conecta tu Cámara USB-C
            </h2>
            <p className="text-xs text-white/70 leading-relaxed">{streamError}</p>
            <div className="flex flex-col gap-2.5 pt-1">
              <button
                onClick={() => startCamera(undefined, true)}
                className="w-full py-3 px-4 rounded-2xl bg-[#FFD60A] text-black font-semibold text-xs uppercase tracking-wider"
              >
                Reintentar
              </button>
              {!isNativeApk && (
                <a
                  href="/loya-scope.apk"
                  download="LoyaScope-USB.apk"
                  className="w-full py-3 px-4 rounded-2xl bg-white/10 text-white font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <Download size={15} />
                  <span>Descargar App Android (.APK)</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BOTTOM APPLE iOS CAMERA CONTROLS */}
      <footer className="fixed bottom-0 inset-x-0 z-30 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 px-6 bg-gradient-to-t from-black/80 via-black/45 to-transparent flex flex-col items-center gap-3 pointer-events-none">
        {/* Continuous Apple Zoom Dial Slider (appears when pinching or tapping zoom pills) */}
        {showZoomDial && (
          <div className="pointer-events-auto w-full max-w-xs bg-black/60 backdrop-blur-2xl rounded-full px-4 py-2 border border-white/15 flex items-center gap-3">
            <span className="text-[11px] font-mono text-white/70">1×</span>
            <input
              type="range"
              min={1}
              max={8}
              step={0.1}
              value={zoom}
              onChange={(e) => {
                setZoom(Number(e.target.value));
                revealZoomDialTemporarily();
              }}
              className="flex-1 accent-[#FFD60A] h-1 bg-white/25 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] font-mono text-[#FFD60A] font-bold">
              {zoom.toFixed(1)}×
            </span>
          </div>
        )}

        {/* Authentic Apple iOS Circular Zoom Rings (1x, 2x, 4x, 8x) */}
        <div className="pointer-events-auto inline-flex items-center gap-1.5 p-1 rounded-full bg-black/45 backdrop-blur-xl border border-white/10">
          {[1, 2, 4, 8].map((preset) => {
            const isSelected =
              preset === 1
                ? zoom < 1.5
                : preset === 2
                ? zoom >= 1.5 && zoom < 3
                : preset === 4
                ? zoom >= 3 && zoom < 6
                : zoom >= 6;
            const displayLabel =
              isSelected && Math.abs(zoom - preset) >= 0.1
                ? `${zoom.toFixed(1)}`
                : `${preset}`;
            return (
              <button
                key={preset}
                onClick={() => {
                  setZoom(preset);
                  revealZoomDialTemporarily();
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold tracking-tight transition-all duration-200 ${
                  isSelected
                    ? "bg-black/80 text-[#FFD60A] scale-110 shadow-md border border-[#FFD60A]/40"
                    : "text-white/90 hover:text-white scale-95"
                }`}
              >
                <span>
                  {displayLabel}
                  <span className="text-[10px]">×</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Authentic Apple iOS Mode Switcher (VIDEO | FOTO) */}
        <div className="pointer-events-auto flex items-center justify-center gap-7 py-1">
          <button
            onClick={() => setCaptureMode("video")}
            className={`text-[13px] font-semibold tracking-[0.14em] uppercase transition-all ${
              captureMode === "video"
                ? "text-[#FFD60A] scale-105"
                : "text-white/75 hover:text-white"
            }`}
          >
            VIDEO
          </button>
          <button
            onClick={() => !isRecording && setCaptureMode("photo")}
            className={`text-[13px] font-semibold tracking-[0.14em] uppercase transition-all ${
              captureMode === "photo"
                ? "text-[#FFD60A] scale-105"
                : "text-white/75 hover:text-white"
            }`}
          >
            FOTO
          </button>
        </div>

        {/* Authentic Apple iOS 3-Column Shutter Bar */}
        <div className="pointer-events-auto w-full max-w-md flex items-center justify-between px-2">
          {/* Left: iOS Last Photo/Video Square Thumbnail */}
          <button
            onClick={() => {
              if (mediaList.length > 0) {
                setActivePreview(mediaList[0]);
              } else {
                setShowGalleryDrawer(true);
              }
            }}
            className="relative w-13 h-13 rounded-xl bg-black/50 backdrop-blur-xl border border-white/25 overflow-hidden flex items-center justify-center active:scale-90 transition"
            aria-label="Abrir carrete de la sesión"
          >
            {mediaList.length > 0 ? (
              mediaList[0].type === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaList[0].url}
                  alt="Última foto"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={mediaList[0].url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              )
            ) : (
              <div className="w-full h-full bg-zinc-900/70" />
            )}
          </button>

          {/* Center: Authentic Apple iOS Shutter / Record Ring */}
          {captureMode === "photo" ? (
            <button
              onClick={takePhoto}
              disabled={!isStreaming}
              className="w-[74px] h-[74px] rounded-full border-[4px] border-white p-[4px] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
              aria-label="Tomar foto"
            >
              <div className="w-full h-full rounded-full bg-white active:scale-90 transition-transform duration-100" />
            </button>
          ) : (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isStreaming}
              className="w-[74px] h-[74px] rounded-full border-[4px] border-white p-[4px] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
              aria-label={isRecording ? "Detener video" : "Grabar video"}
            >
              <div
                className={`bg-[#FF3B30] transition-all duration-200 ${
                  isRecording
                    ? "w-7 h-7 rounded-[8px]"
                    : "w-full h-full rounded-full"
                }`}
              />
            </button>
          )}

          {/* Right: iOS Circular Camera Flip Button (or White Snapshot Button while recording video) */}
          {isRecording ? (
            <button
              onClick={takePhoto}
              className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-90 transition shadow-lg"
              title="Tomar foto durante el video"
            >
              <div className="w-10 h-10 rounded-full border-2 border-black/15 bg-white" />
            </button>
          ) : (
            <button
              onClick={cycleCamera}
              className="w-12 h-12 rounded-full bg-black/45 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white active:rotate-180 active:scale-90 transition-all duration-300"
              title="Cambiar de cámara (USB-C / Interna)"
            >
              <RefreshCw size={21} />
            </button>
          )}
        </div>
      </footer>

      {/* iOS Photos-Style Fullscreen Media Preview & Save Sheet */}
      {activePreview && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] pb-3 bg-black/70 backdrop-blur-xl z-10">
            <button
              onClick={() => setActivePreview(null)}
              className="flex items-center gap-1 text-[#FFD60A] text-sm font-medium"
            >
              <ChevronLeft size={20} />
              <span>Cámara</span>
            </button>

            <span className="text-xs font-medium text-white/80">
              {activePreview.timestamp} • {activePreview.zoom.toFixed(1)}×
            </span>

            <button
              onClick={() => {
                setActivePreview(null);
                setShowGalleryDrawer(true);
              }}
              className="text-xs font-medium text-[#FFD60A]"
            >
              Todas ({mediaList.length})
            </button>
          </div>

          {/* Fullscreen Image/Video Preview */}
          <div className="flex-1 flex items-center justify-center overflow-hidden bg-black">
            {activePreview.type === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activePreview.url}
                alt={activePreview.filename}
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                src={activePreview.url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Bottom iOS Action Toolbar */}
          <div className="px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] bg-black/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-between gap-3">
            <button
              onClick={() => saveMediaToCameraRoll(activePreview)}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-[#FFD60A] text-black font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Share2 size={18} />
              <span>Guardar en Carrete</span>
            </button>

            <a
              href={activePreview.url}
              download={activePreview.filename}
              className="p-3.5 rounded-2xl bg-white/10 text-white active:scale-95 transition"
              title="Descargar archivo"
            >
              <Download size={18} />
            </a>

            <button
              onClick={() => deleteMedia(activePreview.id)}
              className="p-3.5 rounded-2xl bg-white/10 text-[#FF453A] active:scale-95 transition"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Session Gallery Grid */}
      {showGalleryDrawer && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] pb-3 border-b border-white/10">
            <button
              onClick={() => setShowGalleryDrawer(false)}
              className="flex items-center gap-1 text-[#FFD60A] text-sm font-medium"
            >
              <ChevronLeft size={20} />
              <span>Cámara</span>
            </button>
            <span className="text-sm font-semibold text-white">
              Recientes ({mediaList.length})
            </span>
            <button
              onClick={() => setShowGalleryDrawer(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X size={16} />
            </button>
          </div>

          {mediaList.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
              No hay fotos ni videos en esta sesión
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-1 grid grid-cols-3 sm:grid-cols-4 gap-1 content-start">
              {mediaList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setShowGalleryDrawer(false);
                    setActivePreview(item);
                  }}
                  className="relative aspect-square bg-zinc-900 overflow-hidden cursor-pointer"
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
                  {item.type === "video" && (
                    <span className="absolute bottom-1 right-1.5 text-[10px] font-semibold text-white drop-shadow">
                      0:{String(item.duration || 1).padStart(2, "0")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
