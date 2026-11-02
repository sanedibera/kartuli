import { useEffect, useMemo, useRef, useState } from 'react'
import type { Letter } from '../data/letters'
import { makeQuestion, matchesTranslit, type Question } from '../lib/quiz'
import { speak } from '../lib/speech'
import { getState, recordAnswer, type Direction } from '../lib/store'

export type QueueItem = { letterId: string; dir: Direction }

type Props = {
  queue: QueueItem[]
  pool: Letter[]
  /** Falsch beantwortete Karten kommen in derselben Sitzung noch einmal dran. */
  requeueWrong?: boolean
  onDone: (result: { correct: number; total: number }) => void
}

type Feedback = { correct: boolean; chosen?: Letter; typed?: string }

export function Quiz({ queue: initialQueue, pool, requeueWrong = true, onDone }: Props) {
  const [queue, setQueue] = useState(initialQueue)
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [typed, setTyped] = useState('')
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const scoreRef = useRef(score)
  const shownAt = useRef(performance.now())
  const inputRef = useRef<HTMLInputElement>(null)

  const item = queue[index]
  const q: Question | undefined = useMemo(
    () => (item ? makeQuestion(getState(), item.letterId, item.dir, pool) : undefined),
    [item, index],
  )

  useEffect(() => {
    shownAt.current = performance.now()
    setTyped('')
    if (q?.mode === 'type') inputRef.current?.focus()
  }, [q])

  if (!q) return null
  const mnemonic = getState().mnemonics[q.letter.id] || q.letter.mnemonic

  function answer(correct: boolean, chosen?: Letter) {
    if (feedback || !q) return
    const rtMs = performance.now() - shownAt.current
    recordAnswer({
      letterId: q.letter.id,
      dir: q.dir,
      correct,
      rtMs,
      typed: q.mode === 'type',
      targetGlyph: q.letter.glyph,
      chosenGlyph: chosen?.glyph,
      schedule: true,
    })
    scoreRef.current = { correct: scoreRef.current.correct + (correct ? 1 : 0), total: scoreRef.current.total + 1 }
    setScore(scoreRef.current)
    setFeedback({ correct, chosen, typed: q.mode === 'type' ? typed : undefined })
    if (!correct && requeueWrong) {
      setQueue(qu => {
        const copy = [...qu]
        copy.splice(Math.min(index + 3, copy.length), 0, item)
        return copy
      })
    }
    if (correct) setTimeout(next, 650)
  }

  function next() {
    setFeedback(null)
    if (index + 1 >= queue.length) onDone(scoreRef.current)
    else setIndex(i => i + 1)
  }

  const progress = Math.round((index / queue.length) * 100)

  return (
    <div className="quiz">
      <div className="progress"><div style={{ width: `${progress}%` }} /></div>

      {q.dir === 'rec' ? (
        <div className="prompt">
          <div className="glyph huge">{q.letter.glyph}</div>
          <p className="muted">{q.mode === 'type' ? 'Tippe die Umschrift' : 'Wie klingt dieser Buchstabe?'}</p>
        </div>
      ) : (
        <div className="prompt">
          <div className="translit-big">{q.letter.translit}</div>
          <p className="muted">{q.letter.sound}</p>
          <button className="ghost small" onClick={() => speak(q.letter.glyph)} aria-label="Anhören">🔊</button>
          <p className="muted">Welcher Buchstabe ist das?</p>
        </div>
      )}

      {q.mode === 'choice' ? (
        <div className={`options ${q.dir === 'prod' ? 'glyph-options' : ''}`}>
          {q.options.map(o => {
            let cls = 'option'
            if (feedback) {
              if (o.id === q.letter.id) cls += ' right'
              else if (feedback.chosen?.id === o.id) cls += ' wrong'
            }
            return (
              <button key={o.id} className={cls} disabled={!!feedback} onClick={() => answer(o.id === q.letter.id, o)}>
                {q.dir === 'rec' ? o.translit : <span className="glyph">{o.glyph}</span>}
              </button>
            )
          })}
        </div>
      ) : (
        <form
          className="type-form"
          onSubmit={e => {
            e.preventDefault()
            if (typed.trim()) answer(matchesTranslit(typed, q.letter))
          }}
        >
          <input
            ref={inputRef}
            value={typed}
            onChange={e => setTyped(e.target.value)}
            disabled={!!feedback}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            placeholder="z. B. sh oder k'"
            className={feedback ? (feedback.correct ? 'right' : 'wrong') : ''}
          />
          {!feedback && <button className="primary">Prüfen</button>}
        </form>
      )}

      {feedback && !feedback.correct && (
        <div className="feedback">
          <div className="row">
            <span className="glyph big">{q.letter.glyph}</span>
            <div>
              <strong>{q.letter.translit}</strong> · {q.letter.sound}
              {feedback.chosen && feedback.chosen.id !== q.letter.id && (
                <div className="muted">
                  Du hast <span className="glyph">{feedback.chosen.glyph}</span> ({feedback.chosen.translit}) gewählt.
                </div>
              )}
            </div>
          </div>
          <p className="mnemonic">💡 {mnemonic}</p>
          <button className="primary" onClick={next} autoFocus>Weiter</button>
        </div>
      )}

      <p className="muted center small">{score.correct} / {score.total} richtig</p>
    </div>
  )
}
