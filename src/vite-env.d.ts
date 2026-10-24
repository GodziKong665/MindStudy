/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Client ID de la app creada en developer.spotify.com. Sin esto, Spotify queda deshabilitado. */
  readonly VITE_SPOTIFY_CLIENT_ID?: string
  /** Debe coincidir EXACTAMENTE con el Redirect URI registrado en el dashboard de Spotify. */
  readonly VITE_SPOTIFY_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
