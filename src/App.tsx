import { useEffect } from 'react'
import { AppShell } from './components/AppShell'
import { useRoute } from './lib/router'
import { actions, useAppState } from './lib/store'
import { Intro } from './views/Intro'
import { DashboardView } from './views/Dashboard'
import { FocusView } from './views/Focus'
import { MusicView } from './views/Music'
import { PlannerView } from './views/Planner'
import { CalculatorView } from './views/Calculator'
import { CardsView } from './views/Cards'
import { GardenView } from './views/Garden'

export default function App() {
  const [route, navigate] = useRoute()
  const state = useAppState()
  const { theme } = state

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  /**
   * Spotify vuelve a `/` con `?code=…`, así que aterrizaríamos en el dashboard.
   * Si hay un callback pendiente, mandamos al usuario a Música, donde el panel
   * completa el intercambio.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('code') || params.has('error')) navigate('music')
  }, [navigate])

  // La historia es la puerta de entrada: nadie debería aterrizar en un dashboard
  // sin saber qué es lo que está mirando.
  if (!state.introSeen) {
    return <Intro onFinish={actions.completeIntro} />
  }

  return (
    <AppShell route={route} navigate={navigate}>
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
