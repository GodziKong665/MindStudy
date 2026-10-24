import { useEffect } from 'react'
import { AppShell } from './components/AppShell'
import { routeFromDocument, useRouter, type Route } from './lib/router'
import { actions, useAppState } from './lib/store'
import { Intro } from './views/Intro'
import { DashboardView } from './views/Dashboard'
import { FocusView } from './views/Focus'
import { MusicView } from './views/Music'
import { PlannerView } from './views/Planner'
import { CalculatorView } from './views/Calculator'
import { CardsView } from './views/Cards'
import { GardenView } from './views/Garden'

export default function App({ initialRoute }: { initialRoute?: Route }) {
  const [route, navigate] = useRouter(initialRoute ?? routeFromDocument())
  const state = useAppState()
  const { theme } = state

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  /**
   * Spotify vuelve con `?code=…` sobre la página donde se inició el login.
   * Si el callback cae en otra sección, lo llevamos a Música conservando la query.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has('code') && !params.has('error')) return
    if (route === 'music') return
    window.location.replace(`musica.html${window.location.search}`)
  }, [route])

  // La historia es la puerta de entrada: nadie debería aterrizar en el dashboard
  // sin saber qué es lo que está mirando.
  if (!state.introSeen) {
    return <Intro onFinish={actions.completeIntro} />
  }

  return (
    <AppShell route={route}>
      {route === 'dashboard' && <DashboardView navigate={navigate} />}
      {route === 'focus' && <FocusView />}
      {route === 'music' && <MusicView />}
      {route === 'planner' && <PlannerView />}
      {route === 'calculator' && <CalculatorView />}
      {route === 'cards' && <CardsView />}
      {route === 'garden' && <GardenView />}
    </AppShell>
  )
}
