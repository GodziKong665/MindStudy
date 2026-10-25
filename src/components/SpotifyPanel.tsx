import { useEffect, useRef, useState } from 'react'
import { ExternalLink, LogOut, Music4, Plug } from 'lucide-react'
import {
  FEATURED_PLAYLIST,
  SPOTIFY_SEARCHES,
  beginAuth,
  cleanCallbackUrl,
  clearTokens,
  exchangeCode,
  getProfile,
  isConfigured,
  loadTokens,
  openSpotifySearch,
  parseCallback,
  playlistEmbedUrl,
  startPlayback,
  validAccessToken,
  type SpotifyProfile,
} from '../lib/spotify'
import { useAppState } from '../lib/store'
import { Card, SectionHead } from './ui'

type Status = 'idle' | 'working' | 'connected' | 'error'

/**
 * Deliberadamente silencioso: cuatro accesos directos, nada más.
 * El login sólo aparece si hay un Client ID configurado — sin él no se muestra
 * ni una advertencia, porque esto está al lado de un lugar para descansar.
 */
export function SpotifyPanel() {
  const { theme } = useAppState()
  const configured = isConfigured()
  const [status, setStatus] = useState<Status>('idle')
  const [profile, setProfile] = useState<SpotifyProfile | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const handled = useRef(false)

  useEffect(() => {
    if (!configured || handled.current) return

    const params = parseCallback(window.location.search)

    if (params.error) {
      handled.current = true
      setStatus('error')
      setMessage(
        params.error === 'access_denied'
          ? 'Cancelaste el permiso en Spotify.'
          : `Spotify devolvió un error: ${params.error}`,
      )
      cleanCallbackUrl()
      return
    }

    if (params.code) {
      handled.current = true
      setStatus('working')
      exchangeCode(params.code)
        .then(async () => {
          cleanCallbackUrl()
          const token = await validAccessToken()
          if (!token) throw new Error('No quedó un token válido')
          setProfile(await getProfile(token))
          setStatus('connected')
        })
        .catch((error: unknown) => {
          setStatus('error')
          setMessage(error instanceof Error ? error.message : 'Falló la conexión')
        })
      return
    }

    if (!loadTokens()) return
    handled.current = true
    setStatus('working')
    validAccessToken()
      .then(async (token) => {
        if (!token) throw new Error('La sesión venció')
        setProfile(await getProfile(token))
        setStatus('connected')
      })
      .catch((error: unknown) => {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'La sesión venció')
      })
  }, [configured])

  const connect = () => {
    setStatus('working')
    setMessage(null)
    beginAuth('music').catch((error: unknown) => {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar el login')
    })
  }

  const disconnect = () => {
    clearTokens()
    setProfile(null)
    setStatus('idle')
    setMessage(null)
  }

  const play = async () => {
    setMessage(null)
    try {
      const token = await validAccessToken()
      if (!token) throw new Error('Reconectá Spotify primero')
      await startPlayback(token)
      setMessage('Reproduciendo en tu dispositivo activo.')
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'No se pudo reproducir')
    }
  }

  return (
    <Card>
      <SectionHead
        title="Spotify"
        subtitle="Una playlist destacada para empezar, y accesos rápidos."
        action={
          configured && !profile ? (
            <button
              type="button"
              onClick={connect}
              disabled={status === 'working'}
              className="btn btn-ghost text-xs"
            >
              <Plug className="size-3.5" />
              {status === 'working' ? 'Conectando…' : 'Conectar cuenta'}
            </button>
          ) : undefined
        }
      />

      {/* Sólo existe si alguien configuró credenciales. */}
      {configured && profile && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface-3 px-2.5 py-2">
          {profile.imageUrl ? (
            <img src={profile.imageUrl} alt="" className="size-6 rounded-full object-cover" />
          ) : (
            <span className="grid size-6 place-items-center rounded-full bg-surface-2 text-ink-2">
              <Music4 className="size-3" />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
            {profile.displayName}
          </span>
          <button
            type="button"
            onClick={() => void play()}
            className="rounded-sm px-1.5 py-1 text-[0.6875rem] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            Reproducir
          </button>
          <button
            type="button"
            onClick={disconnect}
            className="rounded-sm p-1 text-ink-3 hover:bg-surface-2 hover:text-ink"
            aria-label="Desconectar Spotify"
            title="Desconectar"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      )}

      {/* Reproductor oficial de Spotify: sin API, sin token, sin login propio. */}
      <div className="mb-4">
        <div className="mb-2 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <p className="text-[0.8125rem] font-semibold text-ink">{FEATURED_PLAYLIST.name}</p>
            <p className="text-[0.625rem] text-ink-3">
              {FEATURED_PLAYLIST.author} · {FEATURED_PLAYLIST.tracks} canciones · música relajante de Minecraft
            </p>
          </div>
          {/* La esquina: abre la playlist en la app o la web de Spotify, donde
              la reproducción sí continúa mientras navegás MindStudy. */}
          <a
            href={FEATURED_PLAYLIST.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline shrink-0 gap-1.5 px-2.5 py-1 text-[0.6875rem]"
            title="Seguí escuchando mientras navegás el sitio"
          >
            <ExternalLink className="size-3" />
            Abrir en Spotify
          </a>
        </div>
        <iframe
          title={`Spotify: ${FEATURED_PLAYLIST.name}`}
          src={playlistEmbedUrl(FEATURED_PLAYLIST.id, theme === 'dark')}
          width="100%"
          height={352}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="rounded-[6px] border border-line"
        />
        <p className="mt-2 text-[0.625rem] leading-relaxed text-ink-3">
          Para que la música siga sonando al cambiar de sección, abrila en Spotify: el
          reproductor incrustado se detiene cuando la página se recarga.
        </p>
      </div>

      <div className="border-t border-line pt-3">
        <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
          Abrir en tu Spotify · funciona con cuenta gratuita
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {SPOTIFY_SEARCHES.map((search) => (
          <button
            key={search.query}
            type="button"
            onClick={() => openSpotifySearch(search.query)}
            className="group flex items-center gap-2.5 rounded-md border border-line bg-surface-3 px-2.5 py-2 text-left transition-colors duration-200 hover:border-line-strong hover:bg-surface-2"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-surface-2 text-ink-2 transition-colors group-hover:bg-primary-soft group-hover:text-primary-text">
              <ExternalLink className="size-3" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[0.8125rem] font-medium text-ink">
                {search.label}
              </span>
              <span className="block truncate text-[0.625rem] text-ink-3">{search.hint}</span>
            </span>
          </button>
        ))}
        </div>
      </div>

      {message && (
        <p className="mt-3 text-[0.6875rem] leading-relaxed text-ink-3">{message}</p>
      )}
    </Card>
  )
}
