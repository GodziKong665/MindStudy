import { useEffect, useRef, useState } from 'react'
import { ExternalLink, LogOut, Music4, Plug } from 'lucide-react'
import {
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
  startPlayback,
  validAccessToken,
  type SpotifyProfile,
} from '../lib/spotify'
import { Card, SectionHead } from './ui'

type Status = 'idle' | 'working' | 'connected' | 'error'

/**
 * Deliberadamente silencioso: cuatro accesos directos, nada más.
 * El login sólo aparece si hay un Client ID configurado — sin él no se muestra
 * ni una advertencia, porque esto está al lado de un lugar para descansar.
 */
export function SpotifyPanel() {
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
        title="Abrir en Spotify"
        subtitle="Funciona con cuenta gratuita: abre la búsqueda en tu app o en la web."
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

      {message && (
        <p className="mt-3 text-[0.6875rem] leading-relaxed text-ink-3">{message}</p>
      )}
    </Card>
  )
}
