// src/services/spotifyService.ts

/**
 * Spotify PKCE OAuth & Web API Service para APEX Hypertrophy OS.
 * Implementa el flujo oficial OAuth 2.0 PKCE directamente en el cliente (sin backend).
 * Credenciales aseguradas: El Client ID se gestiona internamente y nunca se expone en formularios del frontend.
 */

// Client ID por defecto configurado internamente
const INTERNAL_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "26c08add7afa417bb1da14684cca1b02";

const STORAGE_KEYS = {
    ACCESS_TOKEN: "apex_spotify_access_token",
    REFRESH_TOKEN: "apex_spotify_refresh_token",
    EXPIRES_AT: "apex_spotify_expires_at",
    CODE_VERIFIER: "apex_spotify_code_verifier",
    STATE: "apex_spotify_state"
};

export interface SpotifyDevice {
    id: string;
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    name: string;
    type: string;
    volume_percent: number;
}

export interface SpotifyTrack {
    id: string;
    name: string;
    artist: string;
    album: string;
    albumArt: string;
    durationMs: number;
    progressMs: number;
    isPlaying: boolean;
    uri: string;
    deviceName?: string;
    deviceId?: string;
    shuffleState?: boolean;
    repeatState?: "off" | "track" | "context";
    volumePercent?: number;
}

export interface WorkoutPlaylist {
    id: string;
    name: string;
    genre: string;
    bpm: string;
    description: string;
    spotifyUri: string;
    webUrl: string;
    accentColor: string;
}

export const CURATED_WORKOUT_PLAYLISTS: WorkoutPlaylist[] = [
    {
        id: "techno-140",
        name: "Peak Cadence Techno",
        genre: "Techno / Industrial",
        bpm: "140 BPM",
        description: "BPM sostenido para series efectivas y máxima activación neuromuscular.",
        spotifyUri: "spotify:playlist:37i9dQZF1DXdLEN7aqioXM",
        webUrl: "https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM",
        accentColor: "#10B981"
    },
    {
        id: "hard-rock",
        name: "Heavy Duty Strength",
        genre: "Heavy Metal / Hard Rock",
        bpm: "135-150 BPM",
        description: "Distorsión pesada y energía para series pesadas en sentadilla y banca.",
        spotifyUri: "spotify:playlist:37i9dQZF1DXdFESNN9TzQT",
        webUrl: "https://open.spotify.com/playlist/37i9dQZF1DXdFESNN9TzQT",
        accentColor: "#FF2A2A"
    },
    {
        id: "hiphop-pump",
        name: "Beast Mode Hip-Hop",
        genre: "Trap / Dark Hip-Hop",
        bpm: "130-145 BPM",
        description: "Bajos profundos y concentración mental para hipertrofia con RIR 1.",
        spotifyUri: "spotify:playlist:37i9dQZF1DX76t638V64Cr",
        webUrl: "https://open.spotify.com/playlist/37i9dQZF1DX76t638V64Cr",
        accentColor: "#F59E0B"
    },
    {
        id: "lofi-recovery",
        name: "Recovery & Stretch",
        genre: "Lo-Fi Beats",
        bpm: "80-95 BPM",
        description: "Baja frecuencia cardíaca para pausas entre series y movilidad final.",
        spotifyUri: "spotify:playlist:37i9dQZF1DWWQRwui0ExPn",
        webUrl: "https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn",
        accentColor: "#8B5CF6"
    }
];

// Helper: Generador de cadenas aleatorias para PKCE
function generateRandomString(length: number): string {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

// Helper: Cálculo de SHA-256
async function sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest("SHA-256", data);
}

// Helper: Base64URL encoding
function base64UrlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let str = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return btoa(str)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

export function isSpotifyConnected(): boolean {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    return Boolean(token || refreshToken);
}

export function disconnectSpotify(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
    localStorage.removeItem(STORAGE_KEYS.STATE);
}

/**
 * Inicia el flujo oficial de autorización Spotify PKCE OAuth en el navegador.
 * Ya no requiere que el usuario teclee o vea ninguna API key ni Client ID.
 */
export async function initiateSpotifyLogin(): Promise<void> {
    if (typeof window === "undefined") return;

    const clientId = INTERNAL_CLIENT_ID;
    if (!clientId) {
        throw new Error("Client ID no configurado.");
    }

    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64UrlEncode(hashed);
    const state = generateRandomString(16);

    localStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
    localStorage.setItem(STORAGE_KEYS.STATE, state);

    // Redirect URI limpia
    const redirectUri = `${window.location.origin}${window.location.pathname}`;

    // Scopes oficiales requeridos por Spotify Web Playback SDK & Web API
    const scope = [
        "streaming",
        "user-read-email",
        "user-read-private",
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-read-currently-playing",
        "playlist-read-private",
        "playlist-read-collaborative"
    ].join(" ");

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("scope", scope);

    window.location.href = authUrl.toString();
}

/**
 * Procesa el callback al regresar de Spotify si existen ?code y ?state en la URL.
 */
export async function handleSpotifyCallback(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error) {
        console.error("Spotify Auth error:", error);
        cleanUrlParams();
        return false;
    }

    if (!code) return false;

    const storedVerifier = localStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
    const storedState = localStorage.getItem(STORAGE_KEYS.STATE);
    const clientId = INTERNAL_CLIENT_ID;

    if (!storedVerifier || !clientId) {
        cleanUrlParams();
        return false;
    }

    if (state && storedState && state !== storedState) {
        console.error("Spotify State mismatch (CSRF check failed)");
        cleanUrlParams();
        return false;
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}`;

    try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: clientId,
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
                code_verifier: storedVerifier
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Failed to exchange Spotify token:", errBody);
            cleanUrlParams();
            return false;
        }

        const data = await response.json();
        const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;

        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
        if (data.refresh_token) {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
        }
        localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());

        localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
        localStorage.removeItem(STORAGE_KEYS.STATE);

        cleanUrlParams();
        return true;
    } catch (err) {
        console.error("Error exchanging Spotify code:", err);
        cleanUrlParams();
        return false;
    }
}

function cleanUrlParams(): void {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    url.searchParams.delete("error");
    window.history.replaceState({}, document.title, url.toString());
}

/**
 * Obtiene un access_token válido, refrescándolo automáticamente si expiró.
 */
export async function getValidAccessToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiresAtStr = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const clientId = INTERNAL_CLIENT_ID;

    if (!token && !refreshToken) return null;

    const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
    const isExpired = Date.now() > expiresAt - 60000; // 1 minuto de margen

    if (!isExpired && token) {
        return token;
    }

    if (!refreshToken || !clientId) {
        return token || null;
    }

    // Refreshing Token
    try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: clientId,
                grant_type: "refresh_token",
                refresh_token: refreshToken
            })
        });

        if (!response.ok) {
            console.warn("Spotify token refresh failed, disconnecting.");
            disconnectSpotify();
            return null;
        }

        const data = await response.json();
        const newExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
        if (data.refresh_token) {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
        }
        localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, newExpiresAt.toString());

        return data.access_token;
    } catch (err) {
        console.error("Error refreshing Spotify token:", err);
        return null;
    }
}

/**
 * Realiza una petición autenticada a la Web API de Spotify.
 */
async function spotifyFetch(endpoint: string, options: RequestInit = {}): Promise<Response | null> {
    const token = await getValidAccessToken();
    if (!token) return null;

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        ...options,
        headers
    });

    return res;
}

/**
 * Consulta la pista que se está reproduciendo actualmente en el dispositivo del usuario.
 */
export async function getCurrentPlayback(): Promise<SpotifyTrack | null> {
    try {
        const res = await spotifyFetch("/me/player");
        if (!res) return null;

        if (res.status === 204 || res.status === 404) {
            return null;
        }

        if (!res.ok) {
            return null;
        }

        const data = await res.json();
        if (!data || !data.item) return null;

        const item = data.item;
        return {
            id: item.id || "",
            name: item.name || "Sin título",
            artist: item.artists?.map((a: any) => a.name).join(", ") || "Artista",
            album: item.album?.name || "",
            albumArt: item.album?.images?.[0]?.url || item.album?.images?.[1]?.url || "",
            durationMs: item.duration_ms || 0,
            progressMs: data.progress_ms || 0,
            isPlaying: Boolean(data.is_playing),
            uri: item.uri || "",
            deviceName: data.device?.name,
            deviceId: data.device?.id,
            shuffleState: Boolean(data.shuffle_state),
            repeatState: data.repeat_state || "off",
            volumePercent: data.device?.volume_percent ?? 100
        };
    } catch (err) {
        console.error("Error fetching Spotify playback:", err);
        return null;
    }
}

export interface PlayPlaylistResult {
    success: boolean;
    deviceName?: string;
    deviceId?: string;
    error?: string;
    needsAppOpen?: boolean;
}

/**
 * Obtiene el dispositivo activo o el mejor candidato disponible en Spotify.
 */
export async function getBestAvailableDevice(): Promise<SpotifyDevice | null> {
    const devices = await spotifyGetDevices();
    if (!devices || devices.length === 0) return null;
    const active = devices.find(d => d.is_active);
    return active || devices[0];
}

/**
 * Abre directamente la app nativa de Spotify o el reproductor web como fallback infalible.
 */
export function openSpotifyDeepLink(uri: string, webUrl?: string): void {
    if (typeof window === "undefined") return;
    try {
        // Intenta abrir el deep link nativo (spotify:playlist:...)
        window.location.href = uri;
    } catch {
        if (webUrl) {
            window.open(webUrl, "_blank");
        }
    }
}

/**
 * Control: Reanudar o iniciar reproducción con targeting automático de dispositivo.
 */
export async function spotifyPlay(targetDeviceId?: string): Promise<boolean> {
    try {
        let devId = targetDeviceId;
        if (!devId) {
            const best = await getBestAvailableDevice();
            if (best) {
                devId = best.id;
                if (!best.is_active) {
                    await spotifyTransferPlayback(best.id, true);
                    return true;
                }
            }
        }

        const endpoint = devId ? `/me/player/play?device_id=${encodeURIComponent(devId)}` : "/me/player/play";
        const res = await spotifyFetch(endpoint, { method: "PUT" });
        if (res && (res.status === 204 || res.ok)) return true;

        if (devId) {
            return await spotifyTransferPlayback(devId, true);
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * Control: Pausar reproducción.
 */
export async function spotifyPause(deviceId?: string): Promise<boolean> {
    try {
        const endpoint = deviceId ? `/me/player/pause?device_id=${encodeURIComponent(deviceId)}` : "/me/player/pause";
        const res = await spotifyFetch(endpoint, { method: "PUT" });
        return Boolean(res && (res.status === 204 || res.ok));
    } catch {
        return false;
    }
}

/**
 * Control: Siguiente pista.
 */
export async function spotifyNext(deviceId?: string): Promise<boolean> {
    try {
        const endpoint = deviceId ? `/me/player/next?device_id=${encodeURIComponent(deviceId)}` : "/me/player/next";
        const res = await spotifyFetch(endpoint, { method: "POST" });
        return Boolean(res && (res.status === 204 || res.ok));
    } catch {
        return false;
    }
}

/**
 * Control: Pista anterior.
 */
export async function spotifyPrevious(deviceId?: string): Promise<boolean> {
    try {
        const endpoint = deviceId ? `/me/player/previous?device_id=${encodeURIComponent(deviceId)}` : "/me/player/previous";
        const res = await spotifyFetch(endpoint, { method: "POST" });
        return Boolean(res && (res.status === 204 || res.ok));
    } catch {
        return false;
    }
}

/**
 * Control: Buscar posición en la pista (Seek en milisegundos).
 */
export async function spotifySeek(positionMs: number, deviceId?: string): Promise<boolean> {
    try {
        const endpoint = deviceId
            ? `/me/player/seek?position_ms=${Math.floor(positionMs)}&device_id=${encodeURIComponent(deviceId)}`
            : `/me/player/seek?position_ms=${Math.floor(positionMs)}`;
        const res = await spotifyFetch(endpoint, { method: "PUT" });
        return Boolean(res && (res.status === 204 || res.ok));
    } catch {
        return false;
    }
}

/**
 * Control: Modo Aleatorio (Shuffle).
 */
export async function spotifySetShuffle(state: boolean, deviceId?: string): Promise<boolean> {
    try {
        const endpoint = deviceId
            ? `/me/player/shuffle?state=${state}&device_id=${encodeURIComponent(deviceId)}`
            : `/me/player/shuffle?state=${state}`;
        const res = await spotifyFetch(endpoint, { method: "PUT" });
        return Boolean(res && (res.status === 204 || res.ok));
    } catch {
        return false;
    }
}

/**
 * Control: Repetir pista o contexto (off, track, context).
 */
export async function spotifySetRepeat(state: "off" | "track" | "context", deviceId?: string): Promise<boolean> {
    try {
        const endpoint = deviceId
            ? `/me/player/repeat?state=${state}&device_id=${encodeURIComponent(deviceId)}`
            : `/me/player/repeat?state=${state}`;
        const res = await spotifyFetch(endpoint, { method: "PUT" });
        return Boolean(res && (res.status === 204 || res.ok));
    } catch {
        return false;
    }
}

/**
 * Control: Volumen (0-100).
 */
export async function spotifySetVolume(volumePercent: number, deviceId?: string): Promise<boolean> {
    try {
        const endpoint = deviceId
            ? `/me/player/volume?volume_percent=${Math.round(volumePercent)}&device_id=${encodeURIComponent(deviceId)}`
            : `/me/player/volume?volume_percent=${Math.round(volumePercent)}`;
        const res = await spotifyFetch(endpoint, { method: "PUT" });
        return Boolean(res && (res.status === 204 || res.ok));
    } catch {
        return false;
    }
}

/**
 * Obtener lista de dispositivos conectados en Spotify.
 */
export async function spotifyGetDevices(): Promise<SpotifyDevice[]> {
    try {
        const res = await spotifyFetch("/me/player/devices");
        if (!res || !res.ok) return [];
        const data = await res.json();
        return data.devices || [];
    } catch {
        return [];
    }
}

/**
 * Transferir reproducción a un dispositivo específico y activarlo.
 */
export async function spotifyTransferPlayback(deviceId: string, play: boolean = true): Promise<boolean> {
    try {
        const res = await spotifyFetch("/me/player", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ device_ids: [deviceId], play })
        });
        return Boolean(res && (res.status === 204 || res.ok));
    } catch {
        return false;
    }
}

/**
 * Inicia una lista de reproducción específica en el reproductor activo del usuario o en el dispositivo indicado.
 * Despierta y transfiere la sesión si el dispositivo está en espera.
 */
export async function spotifyPlayPlaylist(
    playlistUri: string,
    targetDeviceId?: string
): Promise<PlayPlaylistResult> {
    try {
        const devices = await spotifyGetDevices();
        
        let targetDev: SpotifyDevice | undefined;
        if (targetDeviceId) {
            targetDev = devices.find(d => d.id === targetDeviceId);
        }
        if (!targetDev) {
            targetDev = devices.find(d => d.is_active) || devices[0];
        }

        // Si no hay ningún dispositivo registrado en Spotify
        if (!targetDev) {
            return {
                success: false,
                needsAppOpen: true,
                error: "No se detectó ningún dispositivo con Spotify abierto. Abre Spotify en tu teléfono o computadora para iniciar."
            };
        }

        // Si el dispositivo no estaba activo, transferimos la sesión primero para despertarlo
        if (!targetDev.is_active) {
            await spotifyTransferPlayback(targetDev.id, false);
            await new Promise(r => setTimeout(r, 300));
        }

        // Enviamos el comando de reproducción con device_id explícito
        const endpoint = `/me/player/play?device_id=${encodeURIComponent(targetDev.id)}`;
        const res = await spotifyFetch(endpoint, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                context_uri: playlistUri
            })
        });

        if (res && (res.status === 204 || res.ok)) {
            return {
                success: true,
                deviceName: targetDev.name,
                deviceId: targetDev.id
            };
        }

        // Fallback: transferencia directa con play: true
        const fallbackRes = await spotifyTransferPlayback(targetDev.id, true);
        if (fallbackRes) {
            // Reintentar poner la playlist después de activar
            await new Promise(r => setTimeout(r, 300));
            await spotifyFetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ context_uri: playlistUri })
            });
            return {
                success: true,
                deviceName: targetDev.name,
                deviceId: targetDev.id
            };
        }

        return {
            success: false,
            deviceName: targetDev.name,
            deviceId: targetDev.id,
            needsAppOpen: true,
            error: "Abre Spotify en tu dispositivo para recibir la orden de reproducción."
        };
    } catch (err: any) {
        return {
            success: false,
            needsAppOpen: true,
            error: err?.message || "Error al conectar con Spotify Web API."
        };
    }
}
