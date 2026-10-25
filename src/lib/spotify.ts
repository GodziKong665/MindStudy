/**
 * Spotify — Authorization Code con PKCE.
 *
 * Sin client secret: esto es una SPA, cualquier secreto en el bundle es público.
 * PKCE resuelve exactamente eso, y es el flujo que Spotify recomienda para apps
 * del navegador.
 *
 * LÍMITES REALES (verificados en la doc oficial, feb/jul 2026):
 *  · Modo desarrollo: 5 usuarios por app, allowlisted a mano por email.
 *  · El dueño de la app necesita Premium activo.
 *  · Acceso público: sólo organizaciones registradas con ≥250k MAU.
 *  · La reproducción exige Premium en el usuario final.
 */

const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const API_BASE = 'https://api.spotify.com/v1'

const TOKEN_KEY = 'mindstudy:spotify:v1'
const PKCE_KEY = 'mindstudy:spotify:pkce'
const RETURN_KEY = 'mindstudy:spotify:return'

export const SCOPES = [
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'streaming',
]

export interface TokenSet {
  accessToken: string
  refreshToken: string | null
  expiresAt: number
  scope: string
}

export interface SpotifyProfile {
  id: string
  displayName: string
  imageUrl: string | null
}

export function clientId(): string | null {
  const value = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  return value && value.trim().length > 0 ? value.trim() : null
}

export function redirectUri(): string {
  const configured = import.meta.env.VITE_SPOTIFY_REDIRECT_URI
  if (configured && configured.trim().length > 0) return configured.trim()
  return `${window.location.origin}/`
}

export function isConfigured(): boolean {
  return clientId() !== null
}

/* ------------------------------- PKCE ---------------------------------- */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

/** RFC 7636 §4.1: entre 43 y 128 caracteres del set no reservado. */
export function randomString(length = 64): string {
  const values = crypto.getRandomValues(new Uint8Array(length))
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[values[i] % ALPHABET.length]
  return out
}

function base64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

/** SHA-256 del verifier, en base64url. S256 es el único método que acepta Spotify. */
export async function challengeFor(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64Url(digest)
}

export function buildAuthorizeUrl(params: {
  clientId: string
  redirectUri: string
  challenge: string
  state: string
}): string {
  const url = new URL(AUTH_ENDPOINT)
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: params.challenge,
    state: params.state,
  }).toString()
  return url.toString()
}

export function parseCallback(search: string): {
  code: string | null
  state: string | null
  error: string | null
} {
  const params = new URLSearchParams(search)
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
  }
}

/* ------------------------------ Tokens --------------------------------- */

export function loadTokens(): TokenSet | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TokenSet>
    if (!parsed.accessToken || typeof parsed.expiresAt !== 'number') return null
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken ?? null,
      expiresAt: parsed.expiresAt,
      scope: parsed.scope ?? '',
    }
  } catch {
    return null
  }
}

export function saveTokens(tokens: TokenSet): void {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
  } catch {
    /* modo privado o cuota llena: la sesión vive en memoria */
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(PKCE_KEY)
  } catch {
    /* nada que limpiar */
  }
}

function normalizeTokenResponse(json: {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
}, previousRefresh: string | null = null): TokenSet {
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? previousRefresh,
    // 60s de margen: mejor refrescar temprano que fallar en el request.
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
    scope: json.scope ?? '',
  }
}

/* ------------------------------ Flujo ---------------------------------- */

export async function beginAuth(returnTo: string): Promise<void> {
  const id = clientId()
  if (!id) throw new Error('Falta VITE_SPOTIFY_CLIENT_ID')

  const verifier = randomString(64)
  const state = randomString(16)
  const challenge = await challengeFor(verifier)

  sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state, returnTo }))
  window.location.href = buildAuthorizeUrl({
    clientId: id,
    redirectUri: redirectUri(),
    challenge,
    state,
  })
}

export async function exchangeCode(code: string): Promise<TokenSet> {
  const id = clientId()
  if (!id) throw new Error('Falta VITE_SPOTIFY_CLIENT_ID')

  const stored = sessionStorage.getItem(PKCE_KEY)
  const verifier = stored ? (JSON.parse(stored) as { verifier: string }).verifier : null
  if (!verifier) throw new Error('No hay code_verifier: reiniciá el login')

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: id,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      code_verifier: verifier,
    }),
  })

  if (!response.ok) throw new Error(`Spotify rechazó el código (${response.status})`)

  const tokens = normalizeTokenResponse(await response.json())
  saveTokens(tokens)
  sessionStorage.removeItem(PKCE_KEY)
  return tokens
}

export async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  const id = clientId()
  if (!id) throw new Error('Falta VITE_SPOTIFY_CLIENT_ID')

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: id,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) throw new Error(`No se pudo refrescar el token (${response.status})`)

  const tokens = normalizeTokenResponse(await response.json(), refreshToken)
  saveTokens(tokens)
  return tokens
}

/** Devuelve un access token válido, refrescando si está por vencer. */
export async function validAccessToken(): Promise<string | null> {
  const tokens = loadTokens()
  if (!tokens) return null
  if (Date.now() < tokens.expiresAt) return tokens.accessToken
  if (!tokens.refreshToken) return null
  try {
    const refreshed = await refreshTokens(tokens.refreshToken)
    return refreshed.accessToken
  } catch {
    return null
  }
}

/* -------------------------------- API ---------------------------------- */

/**
 * Ojo: desde febrero de 2026 `GET /me` ya NO devuelve email ni product.
 * Sólo queda id, display_name e imágenes. Spotify no sirve como registro.
 */
export async function getProfile(token: string): Promise<SpotifyProfile> {
  const response = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`Perfil no disponible (${response.status})`)

  const json = (await response.json()) as {
    id: string
    display_name?: string | null
    images?: { url: string }[]
  }
  return {
    id: json.id,
    displayName: json.display_name ?? 'Tu cuenta',
    imageUrl: json.images?.[0]?.url ?? null,
  }
}

/** 403 casi siempre significa cuenta gratuita: Spotify no deja reproducir. */
export async function startPlayback(token: string, playlistUri?: string): Promise<void> {
  const response = await fetch(`${API_BASE}/me/player/play`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(playlistUri ? { context_uri: playlistUri } : {}),
  })
  if (response.status === 401) throw new Error('La sesión de Spotify venció')
  if (response.status === 403) throw new Error('Spotify requiere Premium para reproducir')
  if (response.status === 404) throw new Error('No hay un dispositivo de Spotify activo')
  if (!response.ok) throw new Error(`No se pudo reproducir (${response.status})`)
}

export function storeReturnRoute(route: string): void {
  try {
    sessionStorage.setItem(RETURN_KEY, route)
  } catch {
    /* sin sessionStorage no hay retorno, pero el login sigue */
  }
}

export function readReturnRoute(): string | null {
  try {
    const value = sessionStorage.getItem(RETURN_KEY)
    sessionStorage.removeItem(RETURN_KEY)
    return value
  } catch {
    return null
  }
}

/** Limpia `?code=` de la barra de direcciones sin recargar. */
export function cleanCallbackUrl(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  url.searchParams.delete('error')
  window.history.replaceState({}, '', url.toString())
}

/* --------------------------- Alternativa ------------------------------- */

/**
 * Camino que funciona para todos y no necesita credenciales: abrir la búsqueda
 * de Spotify en la app nativa o web. Sirve para cuentas gratuitas y no consume
 * cuota de API.
 */
export const SPOTIFY_SEARCHES = [
  { label: 'Lofi para estudiar', query: 'lofi study', hint: 'Beats suaves, sin letra' },
  { label: 'Clásica', query: 'classical focus', hint: 'Sin voces, sin picos' },
  { label: 'Lluvia', query: 'rain sounds', hint: 'Ininterrumpida' },
  { label: 'Jazz de fondo', query: 'jazz study', hint: 'Café y trabajo' },
]

/**
 * Playlist destacada. Se muestra con el reproductor oficial de Spotify
 * (iframe de open.spotify.com), que no necesita API, ni token, ni login:
 * el usuario escucha desde su propia cuenta, gratis o Premium.
 */
export const FEATURED_PLAYLIST = {
  id: '7H8fXJlcrJ4fxL8eJwT0nm',
  name: 'Relaxing Minecraft Music',
  author: 'CNNBailey y Steve',
  tracks: 300,
  url: 'https://open.spotify.com/playlist/7H8fXJlcrJ4fxL8eJwT0nm',
}

export function playlistEmbedUrl(id: string, dark = true): string {
  // theme=0 oscuro · theme=1 claro. Es lo único que el embed permite cambiar:
  // el color de la cabecera lo fija Spotify por playlist, no se puede alterar.
  return `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=${dark ? 0 : 1}`
}

export function openSpotifySearch(query: string): void {
  window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`, '_blank', 'noopener')
}
