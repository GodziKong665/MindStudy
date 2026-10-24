import { useCallback, useEffect, useState } from 'react'

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

function readHash(): Route {
  const raw = window.location.hash.replace('#/', '').replace('#', '')
  return (ROUTES as readonly string[]).includes(raw) ? (raw as Route) : 'dashboard'
}

/**
 * The hash is a mirror, not the source of truth. Navigating updates React state
 * synchronously and *then* writes the hash, so leaving full-screen focus never
 * depends on an async `hashchange` event arriving.
 */
export function useRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(readHash)

  useEffect(() => {
    const onChange = () => setRoute(readHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((next: Route) => {
    setRoute(next)
    const target = `#/${next}`
    if (window.location.hash !== target) window.location.hash = target
  }, [])

  return [route, navigate]
}
