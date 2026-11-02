import { useEffect, useMemo, useRef, useState } from 'react'
import { BY_GLYPH, LETTERS, transliterate } from '../data/letters'
import { WORDS, type Word } from '../data/words'
import { distractors, shuffle } from '../lib/quiz'
import { speak } from '../lib/speech'
import {
  dueKeys, getState, learnedLetters, mastery, nextGroup, parseKey, recordAnswer, resetAll, setSpeedBest, useAppState,
  type Mastery,
} from '../lib/store'
import { Quiz } from './Quiz'

export type Screen = 'home' | 'learn' | 'review' | 'words' | 'speed' | 'progress'
export const TITLES: Record<Screen, string> = {
  home: 'Lernen', learn: 'Neue Buchstaben', review: 'Wiederholen', words: 'Wörter lesen', speed: 'Schnellrunde', progress: 'Fortschritt',
}
type Nav = { go: (s: Screen) => void }

const MAX_REVIEWS = 30
const knownWords = (glyphs: Set<string>) => WORDS.filter(w => [...w.ka].every(c => glyphs.has(c)))

// --- Start -----------------------------------------------------------------

export function Home({ go }: Nav) {
  const s = useAppState()
  const due = dueKeys(s).length
  const group = nextGroup(s)
  const learned = learnedLetters(s)
  const words = knownWords(new Set(learned.map(l => l.glyph)))
  const secure = LETTERS.filter(l => mastery(s, l.id) === 'sicher').length

  return (
    <div className="stack">
      <div className="card stats-row">
        <div><strong>{learned.length}</strong><span>von 33 gelernt</span></div>
        <div><strong>{secure}</strong><span>sicher</span></div>
        <div><strong>{s.streak.days}</strong><span>Tage in Folge</span></div>
      </div>

      <section>
        <h3 className="section-title">Heute</h3>
        <div className="list">
          <Row icon="↻" color="blue" title="Wiederholen" disabled={due === 0} onClick={() => go('review')}
            subtitle={due ? `${due} Karten fällig${due > MAX_REVIEWS ? ` · ${MAX_REVIEWS} pro Runde` : ''}` : 'Gerade nichts fällig'}
            badge={due || undefined} />
          {group !== undefined ? (
            <Row icon="＋" color="green" title={`Neue Buchstaben · Gruppe ${group}`} onClick={() => go('learn')}
              subtitle={due >= 10 ? 'Tipp: erst die fälligen Karten wiederholen' : undefined}
              detail={<span className="glyph">{LETTERS.filter(l => l.group === group).map(l => l.glyph).join(' ')}</span>} />
          ) : (
            <Row icon="✓" color="green" title="Alle 33 Buchstaben eingeführt" subtitle="Jetzt wiederholen und lesen" disabled />
          )}
        </div>
      </section>

      <section>
        <h3 className="section-title">Üben</h3>
        <div className="list">
          <Row icon="Aa" color="orange" title="Wörter lesen" disabled={words.length === 0} onClick={() => go('words')}
            subtitle={words.length ? `${words.length} Wörter mit deinen Buchstaben` : 'Ab der ersten Gruppe'} />
          <Row icon="⏱" color="red" title="Schnellrunde" disabled={learned.length === 0} onClick={() => go('speed')}
            subtitle={`60 Sekunden · Rekord ${s.speedBest}`} />
        </div>
      </section>
    </div>
  )
}

function Row(props: {
  icon: string; color: string; title: string; subtitle?: string; detail?: React.ReactNode
  badge?: number; disabled?: boolean; onClick?: () => void
}) {
  return (
    <button className="list-row" disabled={props.disabled} onClick={props.onClick}>
      <span className={`row-icon bg-${props.color}`}>{props.icon}</span>
      <span className="row-text">
        <span className="row-title">{props.title}</span>
        {props.subtitle && <span className="row-subtitle">{props.subtitle}</span>}
        {props.detail && <span className="row-subtitle">{props.detail}</span>}
      </span>
      {props.badge !== undefined && <span className="badge">{props.badge}</span>}
      {!props.disabled && <span className="chevron">›</span>}
    </button>
  )
}

// --- Wiederholen -------------------------------------------------------------

export function Review({ go }: Nav) {
  const [queue] = useState(() => dueKeys(getState()).slice(0, MAX_REVIEWS).map(parseKey))
  const [pool] = useState(() => learnedLetters(getState()))
  const [done, setDone] = useState<{ correct: number; total: number } | null>(null)

  if (queue.length === 0) return <div className="card center"><p>Gerade ist nichts fällig. 👍</p><button className="primary" onClick={() => go('home')}>Zurück</button></div>
  if (done)
    return (
      <div className="card center">
        <h2>Runde fertig</h2>
        <p>{done.correct} von {done.total} richtig.</p>
        <button className="primary" onClick={() => go('home')}>Zur Übersicht</button>
      </div>
    )
  return <Quiz queue={queue} pool={pool} onDone={setDone} />
}

// --- Wörter lesen --------------------------------------------------------------

export function Words({ go }: Nav) {
  const [words] = useState(() => shuffle(knownWords(new Set(learnedLetters(getState()).map(l => l.glyph)))))
  const [i, setI] = useState(0)
  const [hints, setHints] = useState<Set<number>>(new Set())
  const [chosen, setChosen] = useState<Word | null>(null)
  const [score, setScore] = useState(0)

  const word = words[i % words.length]
  const options = useMemo(
    () => shuffle([word, ...shuffle(words.filter(w => w !== word)).slice(0, 3)]),
    [word, words],
  )
  if (!word) return null

  function next() {
    setChosen(null)
    setHints(new Set())
    setI(i + 1)
  }

  return (
    <div className="card">
      <p className="muted small">Lies das Wort. Tippe auf einen Buchstaben für einen Hinweis.</p>
      <div className="word-display">
        {[...word.ka].map((c, k) => (
          <button key={k} className="word-letter" onClick={() => setHints(h => new Set(h).add(k))}>
            <span className="glyph">{c}</span>
            <span className="hint">{hints.has(k) || chosen ? BY_GLYPH.get(c)?.translit : ' '}</span>
          </button>
        ))}
      </div>
      <div className="options">
        {options.map(o => {
          let cls = 'option'
          if (chosen) cls += o === word ? ' right' : o === chosen ? ' wrong' : ''
          return (
            <button key={o.ka} className={cls} disabled={!!chosen} onClick={() => {
              setChosen(o)
              if (o === word && hints.size === 0) setScore(score + 1)
            }}>
              {transliterate(o.ka)}
            </button>
          )
        })}
      </div>
      {chosen && (
        <div className="feedback">
          <p><strong>{transliterate(word.ka)}</strong> – {word.de} <button className="ghost small" onClick={() => speak(word.ka)}>🔊</button></p>
          <button className="primary" onClick={next} autoFocus>Nächstes Wort</button>
        </div>
      )}
      <p className="muted center small">{score} ohne Hilfe gelesen · <button className="link" onClick={() => go('home')}>Beenden</button></p>
    </div>
  )
}

// --- Schnellrunde ------------------------------------------------------------

export function Speed({ go }: Nav) {
  const [pool] = useState(() => learnedLetters(getState()))
  const [phase, setPhase] = useState<'ready' | 'run' | 'done'>('ready')
  const [left, setLeft] = useState(60)
  const [score, setScore] = useState(0)
  const [target, setTarget] = useState(() => pool[Math.floor(Math.random() * pool.length)])
  const [flash, setFlash] = useState<'right' | 'wrong' | ''>('')
  const shownAt = useRef(0)
  const best = useAppState().speedBest

  const options = useMemo(() => shuffle([target, ...distractors(getState(), target, pool)]), [target, pool])

  useEffect(() => {
    if (phase !== 'run') return
    const t = setInterval(() => setLeft(l => l - 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'run' && left <= 0) {
      setSpeedBest(score)
      setPhase('done')
    }
  }, [left, phase, score])

  useEffect(() => {
    shownAt.current = performance.now()
  }, [target])

  function pick(id: string) {
    const correct = id === target.id
    recordAnswer({
      letterId: target.id, dir: 'rec', correct, rtMs: performance.now() - shownAt.current, typed: false,
      targetGlyph: target.glyph, chosenGlyph: pool.find(l => l.id === id)?.glyph, schedule: false,
    })
    setFlash(correct ? 'right' : 'wrong')
    setTimeout(() => setFlash(''), 200)
    if (correct) setScore(s => s + 1)
    let n = target
    while (pool.length > 1 && n === target) n = pool[Math.floor(Math.random() * pool.length)]
    setTarget(n)
  }

  if (phase === 'ready')
    return (
      <div className="card center">
        <h2>Schnellrunde</h2>
        <p>60 Sekunden, so viele Buchstaben wie möglich. Fehler kosten Zeit, nicht Punkte – aber Geläufigkeit heißt: schnell <em>und</em> richtig.</p>
        <p className="muted">Rekord: {best}</p>
        <button className="primary" onClick={() => setPhase('run')}>Los!</button>
      </div>
    )
  if (phase === 'done')
    return (
      <div className="card center">
        <h2>{score} richtig</h2>
        <p>{score > best ? 'Neuer Rekord! 🎉' : `Rekord: ${best}`}</p>
        <div className="row gap center">
          <button className="ghost" onClick={() => go('home')}>Übersicht</button>
          <button className="primary" onClick={() => { setScore(0); setLeft(60); setPhase('run') }}>Nochmal</button>
        </div>
      </div>
    )
  return (
    <div className={`quiz speed ${flash}`}>
      <div className="row between"><span>⏱ {left}s</span><span>✓ {score}</span></div>
      <div className="prompt"><div className="glyph huge">{target.glyph}</div></div>
      <div className="options">
        {options.map(o => <button key={o.id} className="option" onClick={() => pick(o.id)}>{o.translit}</button>)}
      </div>
    </div>
  )
}

// --- Fortschritt ---------------------------------------------------------------

const MASTERY_LABEL: Record<Mastery, string> = { neu: 'neu', lernend: 'lernend', gefestigt: 'gefestigt', sicher: 'sicher' }

export function Progress() {
  const s = useAppState()
  const confusions = Object.entries(s.confusions).sort(([, a], [, b]) => b - a).slice(0, 8)

  return (
    <div className="stack">
      <h3 className="section-title">Alle Buchstaben</h3>
      <div className="card">
        <div className="legend small">
          {(Object.keys(MASTERY_LABEL) as Mastery[]).map(m => <span key={m} className={`dot m-${m}`}>{MASTERY_LABEL[m]}</span>)}
        </div>
        <div className="letter-grid">
          {LETTERS.map(l => {
            const st = s.stats[l.id]
            const m = mastery(s, l.id)
            return (
              <div key={l.id} className={`letter-cell m-${m}`} title={l.sound}>
                <span className="glyph">{l.glyph}</span>
                <span className="small">{l.translit}</span>
                <span className="tiny">{st?.seen ? `${Math.round((st.correct / st.seen) * 100)}% · ${(st.rtAvg / 1000).toFixed(1)}s` : '–'}</span>
              </div>
            )
          })}
        </div>
        <p className="tiny muted">Prozent = Trefferquote, Sekunden = durchschnittliche Reaktionszeit. Ziel: unter 1 s.</p>
      </div>

      <h3 className="section-title">Häufigste Verwechslungen</h3>
      <div className="card">
        {confusions.length === 0 ? <p className="muted">Noch keine – weiter so.</p> : (
          <ul className="wordlist">
            {confusions.map(([k, n]) => {
              const [a, b] = k.split('>')
              return (
                <li key={k}>
                  <span className="glyph">{a}</span> ({BY_GLYPH.get(a)?.translit}) für <span className="glyph">{b}</span> ({BY_GLYPH.get(b)?.translit}) gehalten – {n}×
                </li>
              )
            })}
          </ul>
        )}
        <p className="tiny muted">Diese Paare tauchen in Abfragen bevorzugt als Antwortmöglichkeiten auf.</p>
      </div>

      <button className="list-button danger" onClick={() => { if (confirm('Wirklich den gesamten Fortschritt löschen?')) resetAll() }}>
        Fortschritt zurücksetzen
      </button>
    </div>
  )
}
