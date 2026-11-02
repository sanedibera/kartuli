import { useMemo, useState } from 'react'
import { LETTERS, transliterate } from '../data/letters'
import { WORDS } from '../data/words'
import { shuffle } from '../lib/quiz'
import { speak } from '../lib/speech'
import { getState, learnedLetters, markGroupLearned, setMnemonic, useAppState } from '../lib/store'
import { Quiz } from './Quiz'
import { TraceCanvas } from './TraceCanvas'

/** Neue Gruppe: jeden Buchstaben vorstellen (Form, Laut, Eselsbrücke, Nachzeichnen), dann sofort abfragen. */
export function Learn({ group, onExit }: { group: number; onExit: () => void }) {
  const s = useAppState()
  const letters = useMemo(() => LETTERS.filter(l => l.group === group), [group])
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'done'>('intro')
  const [result, setResult] = useState({ correct: 0, total: 0 })

  // Ablenker-Pool beim Start festlegen: alles bisher Gelernte plus die neue Gruppe
  const [pool] = useState(() => [...learnedLetters(getState()), ...letters])
  const queue = useMemo(
    () => [
      ...shuffle(letters.map(l => ({ letterId: l.id, dir: 'rec' as const }))),
      ...shuffle(letters.map(l => ({ letterId: l.id, dir: 'prod' as const }))),
    ],
    [letters],
  )

  if (phase === 'quiz')
    return (
      <Quiz
        queue={queue}
        pool={pool}
        onDone={r => {
          markGroupLearned(group)
          setResult(r)
          setPhase('done')
        }}
      />
    )

  if (phase === 'done') {
    const known = new Set(pool.map(l => l.glyph))
    const newWords = WORDS.filter(w => [...w.ka].every(c => known.has(c))).slice(0, 6)
    return (
      <div className="card center">
        <h2>Gruppe {group} geschafft 🎉</h2>
        <p>{result.correct} von {result.total} Antworten richtig.</p>
        <p className="muted">Die neuen Buchstaben kommen ab jetzt in deinen Wiederholungen – kurz nach dem Lernen öfter, dann in wachsenden Abständen.</p>
        {newWords.length > 0 && (
          <>
            <h3>Das kannst du jetzt schon lesen:</h3>
            <ul className="wordlist">
              {newWords.map(w => (
                <li key={w.ka}><span className="glyph">{w.ka}</span> <span className="muted">{transliterate(w.ka)} – {w.de}</span></li>
              ))}
            </ul>
          </>
        )}
        <button className="primary" onClick={onExit}>Zur Übersicht</button>
      </div>
    )
  }

  const l = letters[step]
  const own = s.mnemonics[l.id] ?? ''
  const example = WORDS.find(w => w.ka.includes(l.glyph))
  return (
    <div className="card">
      <p className="muted small">Gruppe {group} · Buchstabe {step + 1} von {letters.length}</p>
      <div className="intro-head">
        <div className="glyph huge">{l.glyph}</div>
        <div>
          <div className="translit-big">{l.translit}</div>
          <div className="muted">[{l.ipa}]</div>
          <button className="ghost small" onClick={() => speak(l.glyph)}>🔊 Anhören</button>
        </div>
      </div>
      <p><strong>Aussprache:</strong> {l.sound}</p>
      <p className="mnemonic">💡 {l.mnemonic}</p>
      <label className="small muted">
        Eigene Eselsbrücke (selbst ausgedachte merkt man sich oft besser):
        <textarea value={own} onChange={e => setMnemonic(l.id, e.target.value)} rows={2} placeholder="Woran erinnert dich die Form?" />
      </label>
      {example && (
        <p className="small">
          Beispiel: <span className="glyph">{example.ka}</span> <span className="muted">({transliterate(example.ka)}, {example.de})</span>
        </p>
      )}
      <p className="small muted">Zeichne den Buchstaben 2–3 Mal nach:</p>
      <TraceCanvas glyph={l.glyph} />
      <div className="row between">
        <button className="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Zurück</button>
        {step < letters.length - 1 ? (
          <button className="primary" onClick={() => setStep(step + 1)}>Nächster Buchstabe</button>
        ) : (
          <button className="primary" onClick={() => setPhase('quiz')}>Jetzt üben</button>
        )}
      </div>
    </div>
  )
}
