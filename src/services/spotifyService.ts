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
    STATE: "apex_spotify_state",
    LAST_DEVICE_ID: "apex_spotify_last_device_id",
    LAST_DEVICE_NAME: "apex_spotify_last_device_name",
    LAST_TRACK: "apex_spotify_last_known_track",
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
    isRecentlyPlayed?: boolean;
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
        id: "beast-mode",
        name: "Beast Mode (Hip-Hop & Trap)",
        genre: "Trap / Dark Hip-Hop",
        bpm: "135-150 BPM",
        description: "Bajos profundos y motivación implacable para series pesadas, RIR 1 y al fallo.",
        spotifyUri: "spotify:playlist:37i9dQZF1DX76Wlfdnj7AP",
        webUrl: "https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP",
        accentColor: "#F59E0B"
    },
    {
        id: "hard-techno",
        name: "Techno Workout Fuel 2026",
        genre: "Hard Techno / Industrial",
        bpm: "145-155 BPM",
        description: "BPM sostenido para mantener la cadencia motora continua en triseries y densidad metabólica.",
        spotifyUri: "spotify:playlist:1OkopwBrJ3sGGGETXzcOub",
        webUrl: "https://open.spotify.com/playlist/1OkopwBrJ3sGGGETXzcOub",
        accentColor: "#10B981"
    },
    {
        id: "rock-metal",
        name: "Heavy Rock & Metal Pump",
        genre: "Hard Rock / Heavy Metal",
        bpm: "130-150 BPM",
        description: "Distorsión pesada y energía para series máximas en sentadilla, peso muerto y press de banca.",
        spotifyUri: "spotify:playlist:3WcixbNwS38mdMbp4TVNJg",
        webUrl: "https://open.spotify.com/playlist/3WcixbNwS38mdMbp4TVNJg",
        accentColor: "#FF2A2A"
    },
    {
        id: "gym-phonk",
        name: "Gym Phonk ⚡️ PR & Fallo",
        genre: "Drift Phonk / Hardstyle",
        bpm: "140-160 BPM",
        description: "Sub-bajos demoledores y adrenalina pura para romper récords personales (PRs) en el gimnasio.",
        spotifyUri: "spotify:playlist:3pt8bCG6sb6ZFUhK52aGW9",
        webUrl: "https://open.spotify.com/playlist/3pt8bCG6sb6ZFUhK52aGW9",
        accentColor: "#EC4899"
    },
    {
        id: "mansion-reggaeton",
        name: "Mansión Reggaetón Gym",
        genre: "Reggaetón / Urbano Latino",
        bpm: "95-105 BPM",
        description: "Ritmo latino y perreo con bajo potente para mantener el bombeo en días de glúteo y pierna.",
        spotifyUri: "spotify:playlist:37i9dQZF1DWZjqjZMudx9T",
        webUrl: "https://open.spotify.com/playlist/37i9dQZF1DWZjqjZMudx9T",
        accentColor: "#EAB308"
    },
    {
        id: "edm-workout",
        name: "EDM Workout Energy",
        genre: "Electro / Mainstage / Bass",
        bpm: "128-135 BPM",
        description: "Drops de alta intensidad para circuitos HIIT, protocolos de cardio y quema glucogénica.",
        spotifyUri: "spotify:playlist:10pkrFc3vbThnvOgNU0OJ3",
        webUrl: "https://open.spotify.com/playlist/10pkrFc3vbThnvOgNU0OJ3",
        accentColor: "#06B6D4"
    },
    {
        id: "00s-rock",
        name: "00s Rock Anthems",
        genre: "Alt-Rock / Nu-Metal Classics",
        bpm: "120-140 BPM",
        description: "Himnos legendarios de rock alternativo para conectar mente y músculo en cada serie.",
        spotifyUri: "spotify:playlist:37i9dQZF1DX3oM43CtKnRV",
        webUrl: "https://open.spotify.com/playlist/37i9dQZF1DX3oM43CtKnRV",
        accentColor: "#3B82F6"
    },
    {
        id: "lofi-recovery",
        name: "Lofi Beats & Movilidad",
        genre: "Lo-Fi Beats / Chillhop",
        bpm: "80-90 BPM",
        description: "Baja frecuencia cardíaca para pausas entre series pesadas, movilidad articular y estiramientos.",
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
    localStorage.removeItem(STORAGE_KEYS.LAST_DEVICE_ID);
    localStorage.removeItem(STORAGE_KEYS.LAST_DEVICE_NAME);
    localStorage.removeItem(STORAGE_KEYS.LAST_TRACK);
}

export function getLastKnownTrack(): SpotifyTrack | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.LAST_TRACK);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function saveLastKnownTrack(track: SpotifyTrack): void {
    if (typeof window === "undefined" || !track) return;
    try {
        localStorage.setItem(STORAGE_KEYS.LAST_TRACK, JSON.stringify(track));
        if (track.deviceId) {
            localStorage.setItem(STORAGE_KEYS.LAST_DEVICE_ID, track.deviceId);
        }
        if (track.deviceName) {
            localStorage.setItem(STORAGE_KEYS.LAST_DEVICE_NAME, track.deviceName);
        }
    } catch {
        // ignore
    }
}

/**
 * Detecta si el usuario está navegando desde un dispositivo iOS (iPhone, iPad o iPod).
 * Esto permite adaptar la UX para restricciones de Safari/WebKit y suspensión de socket en segundo plano.
 */
export function isIOSDevice(): boolean {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isAppleMobile = /iPad|iPhone|iPod/.test(ua);
    const isIpadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return isAppleMobile || isIpadOS;
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
        "user-read-recently-played",
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

        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("apex:spotify-sync", { detail: { connected: true } }));
            window.dispatchEvent(new CustomEvent("apex:spotify-connected"));
        }

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
 * Fuerza el refresco del access_token usando el refresh_token guardado en localStorage.
 */
export async function forceRefreshToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const clientId = INTERNAL_CLIENT_ID;
    if (!refreshToken || !clientId) return null;

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

        if (!response.ok) return null;

        const data = await response.json();
        const newExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
        if (data.refresh_token) {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
        }
        localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, newExpiresAt.toString());
        return data.access_token;
    } catch {
        return null;
    }
}

/**
 * Realiza una petición autenticada a la Web API de Spotify con auto-reintento en caso de 401 Unauthorized.
 */
async function spotifyFetch(endpoint: string, options: RequestInit = {}): Promise<Response | null> {
    let token = await getValidAccessToken();
    if (!token) return null;

    const makeCall = async (authToken: string) => {
        const headers = new Headers(options.headers || {});
        headers.set("Authorization", `Bearer ${authToken}`);
        return fetch(`https://api.spotify.com/v1${endpoint}`, {
            ...options,
            headers
        });
    };

    try {
        let res = await makeCall(token);
        if (res && res.status === 401) {
            const refreshed = await forceRefreshToken();
            if (refreshed) {
                res = await makeCall(refreshed);
            }
        }
        return res;
    } catch (err) {
        console.warn(`[Spotify API] Conexión interrumpida en ${endpoint}:`, err);
        return null;
    }
}

/**
 * Consulta la pista que se está reproduciendo actualmente en el dispositivo del usuario.
 * Incorpora estrategia de 4 niveles ultra-resistente a la suspensión de iOS (Safari & Chrome WebKit):
 *   1. GET /v1/me/player (Estado completo y dispositivo activo)
 *   2. GET /v1/me/player/currently-playing (Respuesta directa y ligera sin bloquear en /devices)
 *   3. GET /v1/me/player/recently-played (Recupera la sesión reciente si iOS suspendió Spotify Connect)
 *   4. Cache local de última pista en localStorage para evitar pantallas en blanco / desvanecidas.
 */
export async function getCurrentPlayback(): Promise<SpotifyTrack | null> {
    try {
        // Nivel 1: Consulta del reproductor activo completo
        const res = await spotifyFetch("/me/player");
        if (res && res.ok && res.status !== 204 && res.status !== 404) {
            try {
                const data = await res.json();
                if (data && data.item) {
                    const item = data.item;
                    const trackObj: SpotifyTrack = {
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
                        volumePercent: data.device?.volume_percent ?? 100,
                        isRecentlyPlayed: false
                    };
                    saveLastKnownTrack(trackObj);
                    return trackObj;
                }
            } catch {
                // fallthrough to Tier 2
            }
        }

        // Nivel 2: Consulta de pista actualmente en curso (sin requerir contexto de dispositivo estricto)
        const cpRes = await spotifyFetch("/me/player/currently-playing");
        if (cpRes && cpRes.ok && cpRes.status !== 204 && cpRes.status !== 404) {
            try {
                const cpData = await cpRes.json();
                if (cpData && cpData.item) {
                    const item = cpData.item;
                    const cachedDevName = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEYS.LAST_DEVICE_NAME)) || (isIOSDevice() ? "iPhone (Spotify)" : "Dispositivo Móvil");
                    const cachedDevId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.LAST_DEVICE_ID) || undefined : undefined;

                    const trackObj: SpotifyTrack = {
                        id: item.id || "",
                        name: item.name || "Sin título",
                        artist: item.artists?.map((a: any) => a.name).join(", ") || "Artista",
                        album: item.album?.name || "",
                        albumArt: item.album?.images?.[0]?.url || item.album?.images?.[1]?.url || "",
                        durationMs: item.duration_ms || 0,
                        progressMs: cpData.progress_ms || 0,
                        isPlaying: Boolean(cpData.is_playing),
                        uri: item.uri || "",
                        deviceName: cachedDevName,
                        deviceId: cachedDevId,
                        shuffleState: false,
                        repeatState: "off",
                        volumePercent: 100,
                        isRecentlyPlayed: false
                    };
                    saveLastKnownTrack(trackObj);
                    return trackObj;
                }
            } catch {
                // fallthrough to Tier 3
            }
        }

        // Nivel 3 (Rescate iOS / Standby): Consulta la última pista reproducida recientemente
        const rpRes = await spotifyFetch("/me/player/recently-played?limit=1");
        if (rpRes && rpRes.ok && rpRes.status === 200) {
            try {
                const rpData = await rpRes.json();
                const lastItem = rpData?.items?.[0];
                if (lastItem && lastItem.track) {
                    const t = lastItem.track;
                    const cachedDevName = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEYS.LAST_DEVICE_NAME)) || (isIOSDevice() ? "iPhone (Spotify)" : "Dispositivo Móvil");
                    const cachedDevId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.LAST_DEVICE_ID) || undefined : undefined;

                    const playedAt = lastItem.played_at ? new Date(lastItem.played_at).getTime() : 0;
                    const diffMins = playedAt > 0 ? (Date.now() - playedAt) / (1000 * 60) : 999;
                    const isVeryRecent = diffMins < 45;

                    const trackObj: SpotifyTrack = {
                        id: t.id || "",
                        name: t.name || "Sin título",
                        artist: t.artists?.map((a: any) => a.name).join(", ") || "Artista",
                        album: t.album?.name || "",
                        albumArt: t.album?.images?.[0]?.url || t.album?.images?.[1]?.url || "",
                        durationMs: t.duration_ms || 0,
                        progressMs: 0,
                        isPlaying: isVeryRecent && isIOSDevice(),
                        uri: t.uri || "",
                        deviceName: cachedDevName,
                        deviceId: cachedDevId,
                        shuffleState: false,
                        repeatState: "off",
                        volumePercent: 100,
                        isRecentlyPlayed: true
                    };
                    saveLastKnownTrack(trackObj);
                    return trackObj;
                }
            } catch {
                // fallthrough to Tier 4
            }
        }

        // Nivel 4 (Memoria local): si Spotify no responde, no dejar la pantalla en negro
        const localCached = getLastKnownTrack();
        if (localCached) {
            return {
                ...localCached,
                isPlaying: false
            };
        }

        return null;
    } catch (err) {
        console.error("Error fetching Spotify playback:", err);
        return getLastKnownTrack();
    }
}

export interface AudioFeatures {
    tempo: number;
    energy: number;
    danceability?: number;
    valence?: number;
}

const audioFeaturesCache = new Map<string, AudioFeatures>();

/**
 * Obtiene las características de audio (BPM y energía) de una pista desde Spotify Web API (/v1/audio-features/{trackId}).
 * Si el endpoint devuelve 403 o restricciones de permisos por la app de Spotify, implementa un estimador
 * heurístico inteligente basado en el título de la canción, artista o género de entrenamiento.
 */
export async function getTrackAudioFeatures(
    trackId: string,
    fallbackHint?: { name?: string; artist?: string }
): Promise<AudioFeatures> {
    if (!trackId) {
        return { tempo: 135, energy: 0.85 };
    }

    if (audioFeaturesCache.has(trackId)) {
        return audioFeaturesCache.get(trackId)!;
    }

    try {
        const res = await spotifyFetch(`/audio-features/${trackId}`);
        if (res && res.ok) {
            const data = await res.json();
            if (data && typeof data.tempo === "number" && data.tempo > 0) {
                const feat: AudioFeatures = {
                    tempo: Math.round(data.tempo * 10) / 10,
                    energy: typeof data.energy === "number" ? Math.max(0.1, Math.min(1.0, data.energy)) : 0.85,
                    danceability: data.danceability,
                    valence: data.valence
                };
                audioFeaturesCache.set(trackId, feat);
                return feat;
            }
        }
    } catch (err) {
        console.warn("Spotify audio-features endpoint error, applying heuristic estimator:", err);
    }

    // Estimador heurístico inteligente si el endpoint da 403 o no está disponible
    const text = `${fallbackHint?.name || ""} ${fallbackHint?.artist || ""}`.toLowerCase();
    let tempo = 135;
    let energy = 0.82;

    if (/techno|industrial|rave|hardstyle|gabber|acid/i.test(text)) {
        tempo = 148;
        energy = 0.95;
    } else if (/phonk|drift|kordhell|giga|cowbell|interworld|playaphonk/i.test(text)) {
        tempo = 142;
        energy = 0.92;
    } else if (/metal|rock|metallica|slipknot|rammstein|linkin|korn|avenged/i.test(text)) {
        tempo = 134;
        energy = 0.88;
    } else if (/hip hop|rap|trap|beast|drake|travis|eminem|future/i.test(text)) {
        tempo = 128;
        energy = 0.84;
    } else if (/reggaeton|perreo|bad bunny|feid|urbano|anuel|karol/i.test(text)) {
        tempo = 98;
        energy = 0.78;
    } else if (/lofi|lo-fi|chill|recovery|sleep|ambient|meditation|piano/i.test(text)) {
        tempo = 82;
        energy = 0.38;
    }

    const fallbackFeat: AudioFeatures = { tempo, energy };
    audioFeaturesCache.set(trackId, fallbackFeat);
    return fallbackFeat;
}

export interface SpotifyQueueItem {
    id: string;
    name: string;
    artist: string;
    album: string;
    albumArt: string;
    durationMs: number;
    uri: string;
}

/**
 * Obtiene la lista de canciones en cola de reproducción activa de Spotify (/v1/me/player/queue).
 */
export async function getSpotifyQueue(): Promise<SpotifyQueueItem[]> {
    try {
        const res = await spotifyFetch("/me/player/queue");
        if (!res || !res.ok) return [];
        const data = await res.json();
        if (!data || !data.queue || !Array.isArray(data.queue)) return [];

        return data.queue.slice(0, 15).map((item: any) => ({
            id: item.id || "",
            name: item.name || "Sin título",
            artist: item.artists?.map((a: any) => a.name).join(", ") || "Artista",
            album: item.album?.name || "",
            albumArt: item.album?.images?.[0]?.url || item.album?.images?.[1]?.url || "",
            durationMs: item.duration_ms || 0,
            uri: item.uri || ""
        }));
    } catch (err) {
        console.warn("Error fetching Spotify queue:", err);
        return [];
    }
}

export interface PlayTrackResult {
    success: boolean;
    deviceName?: string;
    deviceId?: string;
    error?: string;
    needsAppOpen?: boolean;
}

export interface PlayPlaylistResult {
    success: boolean;
    deviceName?: string;
    deviceId?: string;
    error?: string;
    needsAppOpen?: boolean;
}

/**
 * Normaliza cualquier formato de enlace o URI de Spotify a la URI canónica de pista (spotify:track:ID)
 */
export function normalizeSpotifyTrackUri(raw: string): string {
    const trimmed = (raw || "").trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("spotify:track:")) {
        return trimmed.split("?")[0];
    }
    const match = trimmed.match(/track\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
        return `spotify:track:${match[1]}`;
    }
    if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
        return `spotify:track:${trimmed}`;
    }
    return trimmed;
}

/**
 * Salta directamente a una pista específica por su URI con soporte para despertar
 * dispositivos en reposo (iPhone / Android) y fallback inmediato a app nativa.
 */
export async function spotifyPlayTrack(
    uri: string,
    targetDeviceId?: string,
    contextUri?: string
): Promise<PlayTrackResult> {
    try {
        const canonicalUri = normalizeSpotifyTrackUri(uri);
        if (!canonicalUri) {
            return {
                success: false,
                error: "Enlace o URI de canción no válido."
            };
        }

        const devices = await spotifyGetDevices();
        let targetDev: SpotifyDevice | undefined;
        if (targetDeviceId) {
            targetDev = devices.find(d => d.id === targetDeviceId);
        }
        if (!targetDev) {
            targetDev = devices.find(d => d.is_active) || devices[0];
        }

        // Si no hay ningún dispositivo registrado (típico en iPhone con pantalla bloqueada)
        if (!targetDev) {
            openSpotifyDeepLink(canonicalUri);
            return {
                success: true,
                deviceName: "Spotify en tu dispositivo",
                needsAppOpen: false
            };
        }

        const endpoint = `/me/player/play?device_id=${encodeURIComponent(targetDev.id)}`;

        // Estrategia 1: Reproducir con uris: [canonicalUri] (o context_uri con offset si está disponible)
        let playPayload: any = { uris: [canonicalUri] };
        if (contextUri && contextUri.startsWith("spotify:")) {
            playPayload = {
                context_uri: contextUri,
                offset: { uri: canonicalUri },
                position_ms: 0
            };
        }

        let res = await spotifyFetch(endpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(playPayload)
        });

        if (res && (res.status === 204 || res.ok)) {
            return {
                success: true,
                deviceName: targetDev.name,
                deviceId: targetDev.id
            };
        }

        // Si falló con context_uri, reintentar con uris: [canonicalUri]
        if (contextUri) {
            res = await spotifyFetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uris: [canonicalUri] })
            });

            if (res && (res.status === 204 || res.ok)) {
                return {
                    success: true,
                    deviceName: targetDev.name,
                    deviceId: targetDev.id
                };
            }
        }

        let errorReason = "";
        if (res) {
            try {
                const errData = await res.json();
                errorReason = errData?.error?.message || "";
            } catch {
                // ignore
            }
        }

        // Si Spotify reporta restricción (típico en cuentas Free o modo shuffle móvil)
        if (errorReason.toLowerCase().includes("premium") || errorReason.toLowerCase().includes("restriction")) {
            openSpotifyDeepLink(canonicalUri);
            return {
                success: true,
                deviceName: targetDev.name,
                deviceId: targetDev.id,
                needsAppOpen: true
            };
        }

        // Si el dispositivo estaba en reposo o inactivo, despertarlo transfiriendo la sesión con play: true
        const transferred = await spotifyTransferPlayback(targetDev.id, true);
        if (transferred) {
            await new Promise(r => setTimeout(r, 450));
            res = await spotifyFetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uris: [canonicalUri] })
            });

            if (res && (res.status === 204 || res.ok)) {
                return {
                    success: true,
                    deviceName: targetDev.name,
                    deviceId: targetDev.id
                };
            }
        }

        // Fallback supremo: si el API remoto de Spotify falla (común en iOS en segundo plano), abrir el deep link directo
        openSpotifyDeepLink(canonicalUri);
        return {
            success: true,
            deviceName: targetDev.name,
            deviceId: targetDev.id,
            needsAppOpen: true
        };
    } catch (err: any) {
        openSpotifyDeepLink(uri);
        return {
            success: false,
            needsAppOpen: true,
            error: err?.message || "Error al conectar con Spotify Web API."
        };
    }
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
 * En iOS (Safari & Chrome) utiliza el protocolo nativo spotify:... para despertar la app sin bloqueos.
 */
export function openSpotifyDeepLink(uri: string, webUrl?: string): void {
    if (typeof window === "undefined") return;
    try {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || isIOSDevice();
        const targetUri = uri || "spotify:";

        // En móviles, el esquema nativo spotify:... despierta la app instalada sin bloquearse por popup blocker
        if (isMobile && targetUri.startsWith("spotify:")) {
            window.location.href = targetUri;
            return;
        }

        let targetUrl = webUrl;
        if (!targetUrl) {
            if (targetUri.startsWith("spotify:track:")) {
                const trackId = targetUri.replace("spotify:track:", "").split("?")[0];
                targetUrl = `https://open.spotify.com/track/${trackId}`;
            } else if (targetUri.startsWith("spotify:playlist:")) {
                const playlistId = targetUri.replace("spotify:playlist:", "").split("?")[0];
                targetUrl = `https://open.spotify.com/playlist/${playlistId}`;
            } else if (targetUri.startsWith("spotify:album:")) {
                const albumId = targetUri.replace("spotify:album:", "").split("?")[0];
                targetUrl = `https://open.spotify.com/album/${albumId}`;
            } else {
                targetUrl = "https://open.spotify.com";
            }
        }

        if (isMobile) {
            window.location.href = targetUrl;
        } else {
            window.open(targetUrl, "_blank", "noopener,noreferrer");
        }
    } catch {
        if (webUrl) {
            window.open(webUrl, "_blank", "noopener,noreferrer");
        }
    }
}

/**
 * Control: Reanudar o iniciar reproducción con targeting automático de dispositivo.
 * Si no hay dispositivo activo (muy común en iPhone cuando iOS congela Spotify en segundo plano),
 * despierta la app nativa de Spotify automáticamente con el deep link de la pista.
 */
export async function spotifyPlay(targetDeviceId?: string, trackUri?: string): Promise<boolean> {
    try {
        let devId = targetDeviceId;
        if (!devId && typeof window !== "undefined") {
            devId = localStorage.getItem(STORAGE_KEYS.LAST_DEVICE_ID) || undefined;
        }

        if (!devId) {
            const best = await getBestAvailableDevice();
            if (best) {
                devId = best.id;
                if (!best.is_active) {
                    await spotifyTransferPlayback(best.id, true);
                }
            }
        }

        // Si tenemos dispositivo identificado
        if (devId) {
            const endpoint = `/me/player/play?device_id=${encodeURIComponent(devId)}`;
            const bodyPayload = trackUri ? JSON.stringify({ uris: [trackUri] }) : undefined;
            const res = await spotifyFetch(endpoint, {
                method: "PUT",
                headers: bodyPayload ? { "Content-Type": "application/json" } : undefined,
                body: bodyPayload
            });

            if (res && (res.status === 204 || res.ok)) return true;

            const transferred = await spotifyTransferPlayback(devId, true);
            if (transferred) return true;
        }

        // Intento general a Spotify Connect
        const genRes = await spotifyFetch("/me/player/play", {
            method: "PUT",
            headers: trackUri ? { "Content-Type": "application/json" } : undefined,
            body: trackUri ? JSON.stringify({ uris: [trackUri] }) : undefined
        });

        if (genRes && (genRes.status === 204 || genRes.ok)) return true;

        // Solo como último recurso si no hay pista conocida en memoria
        if (!devId && !trackUri) {
            openSpotifyDeepLink("spotify:");
            return true;
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
 * Normaliza cualquier formato de enlace o URI de Spotify a la URI canónica (spotify:playlist:ID)
 */
export function normalizeSpotifyPlaylistUri(raw: string): string {
    const trimmed = (raw || "").trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("spotify:playlist:")) {
        return trimmed.split("?")[0];
    }
    const match = trimmed.match(/playlist\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
        return `spotify:playlist:${match[1]}`;
    }
    return trimmed;
}

/**
 * Inicia una lista de reproducción específica en el reproductor activo del usuario o en el dispositivo indicado.
 */
export async function spotifyPlayPlaylist(
    playlistUri: string,
    targetDeviceId?: string
): Promise<PlayPlaylistResult> {
    try {
        const trimmed = (playlistUri || "").trim();
        // Detección automática: si es una canción individual, delegar a spotifyPlayTrack
        if (trimmed.startsWith("spotify:track:") || trimmed.includes("/track/")) {
            return await spotifyPlayTrack(trimmed, targetDeviceId);
        }

        const canonicalUri = normalizeSpotifyPlaylistUri(playlistUri);
        if (!canonicalUri) {
            return {
                success: false,
                error: "Enlace o URI de playlist no válido."
            };
        }

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
            if (isIOSDevice()) {
                openSpotifyDeepLink(canonicalUri);
                return {
                    success: true,
                    deviceName: "Spotify en tu iPhone",
                    needsAppOpen: false
                };
            }
            return {
                success: false,
                needsAppOpen: true,
                error: "No se detectó ningún dispositivo con Spotify activo. Abre Spotify en tu teléfono o computadora y vuelve a presionar Reproducir."
            };
        }

        // Comando oficial de Spotify para reproducir contexto completo desde el primer track (offset: 0)
        const endpoint = `/me/player/play?device_id=${encodeURIComponent(targetDev.id)}`;
        const playPayload = {
            context_uri: canonicalUri,
            offset: { position: 0 },
            position_ms: 0
        };

        let res = await spotifyFetch(endpoint, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(playPayload)
        });

        if (res && (res.status === 204 || res.ok)) {
            return {
                success: true,
                deviceName: targetDev.name,
                deviceId: targetDev.id
            };
        }

        let errorReason = "";
        if (res) {
            try {
                const errData = await res.json();
                errorReason = errData?.error?.message || "";
            } catch {
                // ignore
            }
        }

        // Si Spotify reporta que se requiere Premium
        if (errorReason.toLowerCase().includes("premium")) {
            return {
                success: false,
                deviceName: targetDev.name,
                deviceId: targetDev.id,
                needsAppOpen: true,
                error: "El control remoto directo de Spotify requiere cuenta Premium. Usa el botón 'Abrir en la App' para reproducir gratis directamente en tu Spotify."
            };
        }

        // Si el dispositivo estaba en reposo o inactivo, despertarlo transfiriendo la sesión con play: true
        const transferred = await spotifyTransferPlayback(targetDev.id, true);
        if (transferred) {
            await new Promise(r => setTimeout(r, 450));
            res = await spotifyFetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(playPayload)
            });

            if (res && (res.status === 204 || res.ok)) {
                return {
                    success: true,
                    deviceName: targetDev.name,
                    deviceId: targetDev.id
                };
            }
        }

        return {
            success: false,
            deviceName: targetDev.name,
            deviceId: targetDev.id,
            needsAppOpen: true,
            error: errorReason || "Spotify no pudo iniciar la playlist en este dispositivo. Abre la app de Spotify en tu dispositivo y pulsa 'Abrir en la App'."
        };
    } catch (err: any) {
        return {
            success: false,
            needsAppOpen: true,
            error: err?.message || "Error al conectar con Spotify Web API."
        };
    }
}
