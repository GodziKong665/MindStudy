import { useCallback } from 'react'

export const ROUTES = [
  'dashboard',
  'focus',
  'music',
  'planner',
  'calculator',
  'cards',
  'garden',
] as const

export type Route = (typeof ROUTES)[number]

/**
 * Sitio multipágina: cada sección es un documento HTML propio, con su <title>,
 * su meta description y su URL. La navegación es un enlace real, no un cambio
 * de estado en memoria.
 */
export const ROUTE_TO_PAGE: Record<Route, string> = {
  dashboard: 'index.html',
  focus: 'enfoque.html',
  music: 'musica.html',
  planner: 'planificador.html',
  calculator: 'calculadora.html',
  cards: 'tarjetas.html',
  garden: 'jardin.html',
}

/** La página declara qué vista monta mediante data-route en #root. */
export function routeFromDocument(): Route {
  if (typeof document === 'undefined') return 'dashboard'
  const raw = document.getElementById('root')?.dataset.route
  return (ROUTES as readonly string[]).includes(raw ?? '') ? (raw as Route) : 'dashboard'
}

/** La ruta no cambia dentro de un documento: cambiar de sección recarga la página. */
export function useRouter(initial: Route): [Route, (route: Route) => void] {
  const navigate = useCallback((next: Route) => {
    window.location.assign(ROUTE_TO_PAGE[next])
  }, [])
  return [initial, navigate]
}
