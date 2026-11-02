import { useEffect, useState } from 'react'
import { Learn } from './components/Learn'
import { Home, Progress, Review, Speed, TITLES, Words, type Screen } from './components/Screens'
import { getState, nextGroup } from './lib/store'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [learnGroup, setLearnGroup] = useState<number>()
  const isRoot = screen === 'home' || screen === 'progress'

  function go(s: Screen) {
    if (s === 'learn') setLearnGroup(nextGroup(getState()))
    setScreen(s)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  return (
    <div className="app">
      <header className={`navbar ${isRoot ? 'large' : ''}`}>
        {!isRoot && (
          <button className="nav-back" onClick={() => go('home')} aria-label="Zurück">
            <span className="nav-chevron">‹</span> Lernen
          </button>
        )}
        <h1>{TITLES[screen]}</h1>
      </header>

      <main key={screen}>
        {screen === 'home' && <Home go={go} />}
        {screen === 'learn' && learnGroup !== undefined && <Learn group={learnGroup} onExit={() => go('home')} />}
        {screen === 'review' && <Review go={go} />}
        {screen === 'words' && <Words go={go} />}
        {screen === 'speed' && <Speed go={go} />}
        {screen === 'progress' && <Progress />}
      </main>

      {isRoot && (
        <nav className="tabbar">
          <button className={screen === 'home' ? 'active' : ''} onClick={() => go('home')}>
            <span className="tab-icon">ა</span>Lernen
          </button>
          <button className={screen === 'progress' ? 'active' : ''} onClick={() => go('progress')}>
            <span className="tab-icon">▦</span>Fortschritt
          </button>
        </nav>
      )}
    </div>
  )
}
