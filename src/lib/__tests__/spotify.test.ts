// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  SCOPES,
  FEATURED_PLAYLIST,
  buildAuthorizeUrl,
  challengeFor,
  loadTokens,
  parseCallback,
  randomString,
  saveTokens,
  clearTokens,
} from '../spotify'

const hasSubtle = typeof globalThis.crypto?.subtle?.digest === 'function'

beforeEach(() => {
  localStorage.clear()
})

describe('randomString (code_verifier)', () => {
  it('generates a value inside the RFC 7636 length range', () => {
    const verifier = randomString(64)
    expect(verifier.length).toBeGreaterThanOrEqual(43)
    expect(verifier.length).toBeLessThanOrEqual(128)
  })

  it('uses only the unreserved character set', () => {
    expect(randomString(128)).toMatch(/^[A-Za-z0-9\-._~]+$/)
  })

  it('does not repeat across calls', () => {
    const a = randomString(64)
    const b = randomString(64)
    expect(a).not.toBe(b)
  })
})

describe('challengeFor', () => {
  // Vector publicado en el RFC 7636, Apéndice B.
  it.skipIf(!hasSubtle)('matches the RFC 7636 appendix B vector', async () => {
    const challenge = await challengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })

  it.skipIf(!hasSubtle)('produces a base64url SHA-256 digest (43 chars)', async () => {
    const challenge = await challengeFor('a'.repeat(64))
    expect(challenge).toHaveLength(43)
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/)
  })
})

describe('buildAuthorizeUrl', () => {
  it('includes every parameter Spotify requires', () => {
    const url = new URL(
      buildAuthorizeUrl({
        clientId: 'abc123',
        redirectUri: 'http://127.0.0.1:5173/',
        challenge: 'challenge-value',
        state: 'state-value',
      }),
    )

    expect(url.origin + url.pathname).toBe('https://accounts.spotify.com/authorize')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('client_id')).toBe('abc123')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('code_challenge')).toBe('challenge-value')
    expect(url.searchParams.get('state')).toBe('state-value')
    expect(url.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:5173/')
    expect(url.searchParams.get('scope')).toBe(SCOPES.join(' '))
  })
})

describe('playlist destacada', () => {
  it('apunta a Relaxing Minecraft Music con su portada oficial', () => {
    expect(FEATURED_PLAYLIST.id).toBe('7H8fXJlcrJ4fxL8eJwT0nm')
    expect(FEATURED_PLAYLIST.name).toBe('Relaxing Minecraft Music')
    expect(FEATURED_PLAYLIST.tracks).toBe(300)
    expect(FEATURED_PLAYLIST.url).toBe(
      'https://open.spotify.com/playlist/7H8fXJlcrJ4fxL8eJwT0nm',
    )
    expect(FEATURED_PLAYLIST.cover.startsWith('https://')).toBe(true)
  })
})

describe('parseCallback', () => {
  it('reads the authorization code and state', () => {
    expect(parseCallback('?code=xyz&state=abc')).toEqual({
      code: 'xyz',
      state: 'abc',
      error: null,
    })
  })

  it('reads a denial without a code', () => {
    expect(parseCallback('?error=access_denied&state=abc')).toEqual({
      code: null,
      state: 'abc',
      error: 'access_denied',
    })
  })

  it('returns nulls when there is nothing to parse', () => {
    expect(parseCallback('')).toEqual({ code: null, state: null, error: null })
  })
})

describe('token storage', () => {
  const tokens = {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    expiresAt: Date.now() + 3600_000,
    scope: 'user-read-private',
  }

  it('round-trips a token set', () => {
    saveTokens(tokens)
    expect(loadTokens()).toEqual(tokens)
  })

  it('returns null for a corrupt payload instead of throwing', () => {
    localStorage.setItem('mindstudy:spotify:v1', '{not json')
    expect(loadTokens()).toBeNull()
  })

  it('returns null when the payload is missing required fields', () => {
    localStorage.setItem('mindstudy:spotify:v1', JSON.stringify({ accessToken: 'x' }))
    expect(loadTokens()).toBeNull()
  })

  it('clears on demand', () => {
    saveTokens(tokens)
    clearTokens()
    expect(loadTokens()).toBeNull()
  })
})

describe('validAccessToken refresh window', () => {
  it.skipIf(typeof globalThis.fetch !== 'function')(
    'does not refresh while the token is still valid',
    async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
      saveTokens({
        accessToken: 'fresh',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 60_000,
        scope: '',
      })
      const { validAccessToken } = await import('../spotify')
      await expect(validAccessToken()).resolves.toBe('fresh')
      expect(fetchSpy).not.toHaveBeenCalled()
      fetchSpy.mockRestore()
    },
  )
})
