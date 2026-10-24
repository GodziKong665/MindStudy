// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from '../../App'
import { actions } from '../store'
import type { Route } from '../router'

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
})

const ROUTES: Route[] = [
  'dashboard',
  'focus',
  'music',
  'planner',
  'calculator',
  'cards',
  'garden',
]

describe('Intro', () => {
  it('opens with the story and enters the app on Empezar', () => {
    actions.replayIntro()
    render(<App initialRoute="dashboard" />)

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
    render(<App initialRoute="dashboard" />)
    fireEvent.click(screen.getByRole('button', { name: /saltar/i }))
    expect(screen.getByText('Tu día')).toBeTruthy()
  })

  it('walks backwards between scenes', () => {
    actions.replayIntro()
    render(<App initialRoute="dashboard" />)
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    fireEvent.click(screen.getByRole('button', { name: /atrás/i }))
    expect(screen.getByText(/el origen/i)).toBeTruthy()
  })
})

describe('App smoke', () => {
  it('mounts the dashboard without throwing', () => {
    render(<App initialRoute="dashboard" />)
    expect(screen.getByText('Tu día')).toBeTruthy()
    expect(screen.getByRole('button', { name: /empezar un bloque/i })).toBeTruthy()
  })

  it('renders every page with real content', () => {
    for (const route of ROUTES) {
      const { container, unmount } = render(<App initialRoute={route} />)
      const heading = container.querySelector('h1')
      expect(heading, `route "${route}" rendered no heading`).not.toBeNull()
      expect((heading?.textContent ?? '').trim().length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('exposes the menu as real links between pages', () => {
    render(<App initialRoute="dashboard" />)
    // jsdom no aplica CSS, así que las dos navs (escritorio y móvil) cuentan.
    const focusLinks = screen.getAllByRole('link', { name: /enfoque/i })
    expect(focusLinks.length).toBeGreaterThan(0)
    expect(focusLinks[0].getAttribute('href')).toBe('enfoque.html')
  })

  it('toggles the theme class on the document root', () => {
    render(<App initialRoute="dashboard" />)

    const before = document.documentElement.classList.contains('dark')
    fireEvent.click(screen.getByLabelText(/cambiar a modo/i))
    expect(document.documentElement.classList.contains('dark')).toBe(!before)
  })

  it('starts every gamification metric at zero with no sessions', () => {
    render(<App initialRoute="dashboard" />)
    // Racha, XP y jardín se derivan de `sessions`: sin sesiones, todo en cero.
    expect(screen.getByText(/arrancá hoy/i)).toBeTruthy()
  })
})

describe('Enfoque: dos capas', () => {
  it('opens in the normal focus view, inside the shell', () => {
    render(<App initialRoute="focus" />)

    expect(screen.getByRole('button', { name: /pantalla completa/i })).toBeTruthy()
    expect(screen.getAllByRole('link', { name: /dashboard/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
  })

  it('enters the immersive layer and leaves it with Escape', () => {
    render(<App initialRoute="focus" />)

    fireEvent.click(screen.getByRole('button', { name: /pantalla completa/i }))
    expect(screen.getByRole('button', { name: /volver al enfoque normal/i })).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })

    // Vuelve al enfoque normal: la capa se cerró y seguimos en la sección.
    expect(screen.queryByRole('button', { name: /volver al enfoque normal/i })).toBeNull()
    expect(screen.getByRole('button', { name: /pantalla completa/i })).toBeTruthy()
  })

  it('does not leave the focus view when Escape is pressed in the normal layer', () => {
    render(<App initialRoute="focus" />)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.getByRole('button', { name: /pantalla completa/i })).toBeTruthy()
    expect(screen.queryByText('Tu día')).toBeNull()
  })

  it('toggles the countdown with Space', () => {
    render(<App initialRoute="focus" />)

    expect(screen.getByRole('button', { name: /empezar/i })).toBeTruthy()
    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    expect(screen.getByRole('button', { name: /pausar/i })).toBeTruthy()
  })
})
