// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from '../../App'
import { actions } from '../store'

/** jsdom ships no matchMedia; the theme bootstrap probes for it. */
beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
  // Aislamiento: volver al estado por defecto y entrar a la app.
  actions.reset()
  actions.completeIntro()
})

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const ROUTES = ['dashboard', 'focus', 'music', 'planner', 'calculator', 'cards', 'garden'] as const

describe('Intro', () => {
  it('opens with the story and enters the app on Empezar', () => {
    actions.replayIntro()
    window.location.hash = '#/dashboard'
    render(<App />)

    expect(screen.getByText(/el origen/i)).toBeTruthy()
    // El dashboard todavía no existe: la historia es la puerta de entrada.
    expect(screen.queryByText('Tu día')).toBeNull()

    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    }

    fireEvent.click(screen.getByRole('button', { name: /^empezar$/i }))
    expect(screen.getByText('Tu día')).toBeTruthy()
  })

  it('can be skipped straight into the app', () => {
    actions.replayIntro()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /saltar/i }))
    expect(screen.getByText('Tu día')).toBeTruthy()
  })

  it('walks backwards between scenes', () => {
    actions.replayIntro()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    fireEvent.click(screen.getByRole('button', { name: /atrás/i }))
    expect(screen.getByText(/el origen/i)).toBeTruthy()
  })
})

describe('App smoke', () => {
  it('mounts the dashboard without throwing', () => {
    window.location.hash = '#/dashboard'
    render(<App />)
    expect(screen.getByText('Tu día')).toBeTruthy()
    expect(screen.getByRole('button', { name: /empezar un bloque/i })).toBeTruthy()
  })

  it('renders every route with real content', () => {
    for (const route of ROUTES) {
      window.location.hash = `#/${route}`
      const { container, unmount } = render(<App />)
      const heading = container.querySelector('h1')
      expect(heading, `route "${route}" rendered no heading`).not.toBeNull()
      expect((heading?.textContent ?? '').trim().length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('toggles the theme class on the document root', () => {
    window.location.hash = '#/dashboard'
    render(<App />)

    const before = document.documentElement.classList.contains('dark')
    fireEvent.click(screen.getByLabelText(/cambiar a modo/i))
    expect(document.documentElement.classList.contains('dark')).toBe(!before)
  })

  it('starts every gamification metric at zero with no sessions', () => {
    window.location.hash = '#/dashboard'
    render(<App />)
    // Racha, XP y jardín se derivan de `sessions`: sin sesiones, todo en cero.
    expect(screen.getByText(/arrancá hoy/i)).toBeTruthy()
  })
})

describe('Enfoque: dos capas', () => {
  it('opens in the normal focus view, inside the shell', () => {
    window.location.hash = '#/focus'
    render(<App />)

    expect(screen.getByRole('button', { name: /pantalla completa/i })).toBeTruthy()
    // jsdom no aplica CSS, así que las dos navs (escritorio y móvil) cuentan.
    expect(screen.getAllByRole('button', { name: /^dashboard$/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
  })

  it('enters the immersive layer and leaves it with Escape', () => {
    window.location.hash = '#/focus'
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /pantalla completa/i }))
    const close = screen.getByRole('button', { name: /volver al enfoque normal/i })
    expect(close).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })

    // Vuelve al enfoque normal: la capa se cerró y seguimos en la sección.
    expect(screen.queryByRole('button', { name: /volver al enfoque normal/i })).toBeNull()
    expect(screen.getByRole('button', { name: /pantalla completa/i })).toBeTruthy()
  })

  it('does not leave the focus view when Escape is pressed in the normal layer', () => {
    window.location.hash = '#/focus'
    render(<App />)

    fireEvent.keyDown(window, { key: 'Escape' })

    // Seguimos en Enfoque: Esc solo cierra la capa inmersiva.
    expect(screen.getByRole('button', { name: /pantalla completa/i })).toBeTruthy()
    expect(screen.queryByText('Tu día')).toBeNull()
  })

  it('toggles the countdown with Space', () => {
    window.location.hash = '#/focus'
    render(<App />)

    expect(screen.getByRole('button', { name: /empezar/i })).toBeTruthy()
    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    expect(screen.getByRole('button', { name: /pausar/i })).toBeTruthy()
  })
})
