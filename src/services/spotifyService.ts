// src/services/spotifyService.ts

/**
 * Spotify PKCE OAuth & Web API Service para APEX Hypertrophy OS.
 * Implementa el flujo OAuth 2.0 PKCE directamente en el cliente (sin backend ni client_secret).
 */

const STORAGE_KEYS = {
    CLIENT_ID: "apex_spotify_client_id",
    ACCESS_TOKEN: "apex_spotify_access_token",
    REFRESH_TOKEN: "apex_spotify_refresh_token",
    EXPIRES_AT: "apex_spotify_expires_at",
    CODE_VERIFIER: "apex_spotify_code_verifier",
    STATE: "apex_spotify_state"
};

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
}

export interface WorkoutPlaylist {
    id: string;
    name: string;
    genre: string;
    bpm: string;
    description: string;
    spotifyUri: string;
    accentColor: string;
}

export const CURATED_WORKOUT_PLAYLISTS: WorkoutPlaylist[] = [
    {
        id: "techno-140",
        name: "Peak Cadence Techno",
        genre: "Techno / Industrial",
        bpm: "140 BPM",
        description: "BPM sostenido para series efectivas y máxima activación neuromuscular.",
        spotifyUri: "spotify:playlist:37i9dQZF1DXdLEN7aqioXM", // Workout Techno oficial
        accentColor: "#10B981"
    },
    {
        id: "hard-rock",
        name: "Heavy Duty Strength",
        genre: "Heavy Metal / Hard Rock",
        bpm: "135-150 BPM",
        description: "Distorsión pesada y energía para series pesadas en sentadilla y banca.",
        spotifyUri: "spotify:playlist:37i9dQZF1DXdFESNN9TzQT", // Rock Hard Workout
        accentColor: "#FF2A2A"
    },
    {
        id: "hiphop-pump",
        name: "Beast Mode Hip-Hop",
        genre: "Trap / Dark Hip-Hop",
        bpm: "130-145 BPM",
        description: "Bajos profundos y concentración mental para hipertrofia con RIR 1.",
        spotifyUri: "spotify:playlist:37i9dQZF1DX76t638V64Cr", // Beast Mode oficial
        accentColor: "#F59E0B"
    },
    {
        id: "lofi-recovery",
        name: "Recovery & Stretch",
        genre: "Lo-Fi Beats",
        bpm: "80-95 BPM",
        description: "Baja frecuencia cardíaca para pausas entre series y movilidad final.",
        spotifyUri: "spotify:playlist:37i9dQZF1DWWQRwui0ExPn", // Lo-Fi Cafe
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

export const DEFAULT_SPOTIFY_CLIENT_ID = "26c08add7afa417bb1da14684cca1b02";

export function getStoredSpotifyClientId(): string {
    if (typeof window === "undefined") return DEFAULT_SPOTIFY_CLIENT_ID;
    return (
        localStorage.getItem(STORAGE_KEYS.CLIENT_ID) ||
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ||
        DEFAULT_SPOTIFY_CLIENT_ID
    );
}

export function setStoredSpotifyClientId(clientId: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, clientId.trim());
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
 * Inicia el flujo de autorización Spotify PKCE OAuth en el navegador.
 */
export async function initiateSpotifyLogin(customClientId?: string): Promise<void> {
    if (typeof window === "undefined") return;

    const clientId = customClientId || getStoredSpotifyClientId();
    if (!clientId) {
        throw new Error("No se ha configurado un Spotify Client ID.");
    }

    setStoredSpotifyClientId(clientId);

    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64UrlEncode(hashed);
    const state = generateRandomString(16);

    localStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
    localStorage.setItem(STORAGE_KEYS.STATE, state);

    // Redirect URI limpia sin query params
    const redirectUri = `${window.location.origin}${window.location.pathname}`;

    const scope = [
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
 * Devuelve true si procesó la autenticación con éxito.
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
    const clientId = getStoredSpotifyClientId();

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

        // Limpiar verifiers
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
    const clientId = getStoredSpotifyClientId();

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
            return null; // Nada reproduciéndose en este momento
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
            deviceName: data.device?.name
        };
    } catch (err) {
        console.error("Error fetching Spotify playback:", err);
        return null;
    }
}

/**
 * Control: Reanudar o iniciar reproducción.
 */
export async function spotifyPlay(): Promise<boolean> {
    try {
        const res = await spotifyFetch("/me/player/play", { method: "PUT" });
        return Boolean(res && (res.status === 204 || res.ok));
    } catch {
        return false;
    }
}

/**
 * Control: Pausar reproducción.
 */
export async function spotifyPause(): Promise<boolean> {
    try {
        const res = await spotifyFetch("/me/player/pause", { method: "PUT" });
        return Boolean(res && (res.status === 204 || res.ok));
    } catch {
        return false;
    }
}

/**
 * Control: Siguiente pista.
 */
export async function spotifyNext(): Promise<boolean> {
    try {
        const res = await spotifyFetch("/me/player/next", { method: "POST" });
        return Boolean(res && (res.status === 204 || res.ok));
    } catch {
        return false;
    }
}

/**
 * Control: Pista anterior.
 */
export async function spotifyPrevious(): Promise<boolean> {
    try {
        const res = await spotifyFetch("/me/player/previous", { method: "POST" });
        return Boolean(res && (res.status === 204 || res.ok));
    } catch {
        return false;
    }
}

/**
 * Inicia una lista de reproducción específica en el reproductor activo del usuario.
 */
export async function spotifyPlayPlaylist(playlistUri: string): Promise<boolean> {
    try {
        const res = await spotifyFetch("/me/player/play", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                context_uri: playlistUri
            })
        });
        return Boolean(res && (res.status === 204 || res.ok));
    } catch {
        return false;
    }
}
