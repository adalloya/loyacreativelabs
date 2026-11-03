import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// Localiza ejecutables disponibles en el sistema o en bin/
function getBinaryPath(name: "yt-dlp" | "ffmpeg"): string {
  const localProjectBin = path.join(process.cwd(), "bin", name);
  if (fs.existsSync(localProjectBin)) return localProjectBin;

  if (name === "ffmpeg") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ffmpegStatic = require("ffmpeg-static");
      if (ffmpegStatic && fs.existsSync(ffmpegStatic)) return ffmpegStatic;
    } catch {}
  }

  return name;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoUrl = searchParams.get("url");
  const mode = searchParams.get("mode") || "meta"; // 'meta' | 'stream'

  if (!videoUrl || (!videoUrl.includes("youtube.com") && !videoUrl.includes("youtu.be"))) {
    return NextResponse.json({ error: "URL de YouTube inválida" }, { status: 400 });
  }

  const ytDlpPath = getBinaryPath("yt-dlp");
  const ffmpegPath = getBinaryPath("ffmpeg");

  // ==========================================
  // 1. MODO METADATOS (Instantáneo 150ms)
  // ==========================================
  if (mode === "meta") {
    // Intento 1: YouTube oEmbed ultra-rápido (150ms, sin bloqueos)
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
      const oembedRes = await fetch(oembedUrl, { signal: AbortSignal.timeout(3000) });
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        const idMatch = videoUrl.match(/(?:v=|youtu\.be\/|embed\/|v\/)([a-zA-Z0-9_-]{11})/);
        const vidId = idMatch ? idMatch[1] : `yt-${Date.now()}`;

        return NextResponse.json({
          id: vidId,
          title: oembedData.title || "Canción de YouTube",
          uploader: oembedData.author_name || "Artista Desconocido",
          duration: 0,
          thumbnail: oembedData.thumbnail_url || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
        });
      }
    } catch {
      // Continuar con yt-dlp si oembed falló
    }

    // Intento 2: yt-dlp dump-json con timeout seguro
    try {
      const metaPromise = new Promise<{
        id: string;
        title: string;
        uploader: string;
        duration: number;
        thumbnail: string;
      }>((resolve, reject) => {
        const proc = spawn(ytDlpPath, [
          "--dump-single-json",
          "--no-check-certificates",
          "--no-warnings",
          "--prefer-free-formats",
          videoUrl,
        ]);

        let stdout = "";
        let stderr = "";

        const timer = setTimeout(() => {
          proc.kill("SIGKILL");
          reject(new Error("Timeout en yt-dlp metadata"));
        }, 5000);

        proc.stdout.on("data", (data) => {
          stdout += data.toString();
        });
        proc.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        proc.on("close", (code) => {
          clearTimeout(timer);
          if (code === 0 && stdout) {
            try {
              const info = JSON.parse(stdout);
              resolve({
                id: info.id,
                title: info.title,
                uploader: info.uploader || info.channel || "Artista Desconocido",
                duration: info.duration || 0,
                thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`,
              });
              return;
            } catch (parseErr) {
              reject(parseErr);
            }
          } else {
            reject(new Error(stderr || `yt-dlp exited with code ${code}`));
          }
        });
      });

      const meta = await metaPromise;
      return NextResponse.json(meta);
    } catch {
      const idMatch = videoUrl.match(/(?:v=|youtu\.be\/|embed\/|v\/)([a-zA-Z0-9_-]{11})/);
      const vidId = idMatch ? idMatch[1] : `yt-${Date.now()}`;
      return NextResponse.json({
        id: vidId,
        title: "Pista de YouTube",
        uploader: "YouTube",
        duration: 0,
        thumbnail: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
      });
    }
  }

  // ==========================================
  // 2. MODO STREAM AUDIO (MP3 REAL)
  // ==========================================
  try {
    const ytArgs: string[] = [
      "-f",
      "ba/b",
      "--no-check-certificates",
      "--no-warnings",
      "-o",
      "-",
      videoUrl,
    ];

    const ytProc = spawn(ytDlpPath, ytArgs);

    let outputStream = ytProc.stdout;
    let cleanup = () => {
      try {
        ytProc.kill("SIGKILL");
      } catch {}
    };

    if (ffmpegPath) {
      const ffmpegProc = spawn(ffmpegPath, [
        "-i",
        "pipe:0",
        "-f",
        "mp3",
        "-acodec",
        "libmp3lame",
        "-ab",
        "192k",
        "-ar",
        "44100",
        "pipe:1",
      ]);

      ytProc.stdout.pipe(ffmpegProc.stdin);
      outputStream = ffmpegProc.stdout;

      cleanup = () => {
        try {
          ytProc.kill("SIGKILL");
        } catch {}
        try {
          ffmpegProc.kill("SIGKILL");
        } catch {}
      };

      ffmpegProc.stderr.on("data", () => {});
    }

    ytProc.stderr.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("ERROR:")) {
        console.warn("[yt-dlp stream]:", msg);
      }
    });

    const readable = new ReadableStream({
      start(controller) {
        outputStream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });

        outputStream.on("end", () => {
          controller.close();
        });

        outputStream.on("error", (err) => {
          controller.error(err);
        });
      },
      cancel() {
        cleanup();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (streamErr: unknown) {
    const message = streamErr instanceof Error ? streamErr.message : "Error al extraer el audio de YouTube";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
