import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'

import { GlassButton, PrimaryButton } from './buttons'
import { C } from './ui'
import type { Letter } from '@/lib/letters'
import { makeQuestion, matchesTranslit } from '@/lib/quiz'
import { getState, recordAnswer, type Direction } from '@/lib/store'

export type QueueItem = { letterId: string; dir: Direction }
type Feedback = { correct: boolean; chosen?: Letter }

const GREEN = 'rgba(52,199,89,0.85)'
const RED = 'rgba(255,59,48,0.85)'

/**
 * Abfrage-Runde. Falsche Antworten kommen drei Karten später noch einmal dran.
 * Jede Antwort geht mit Richtigkeit und Reaktionszeit in die Wiederholungsplanung (FSRS).
 */
export function Quiz({ queue: initialQueue, pool, onDone }: {
  queue: QueueItem[]
  pool: Letter[]
  onDone: (result: { correct: number; total: number }) => void
}) {
  const [queue, setQueue] = useState(initialQueue)
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [typed, setTyped] = useState('')
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const scoreRef = useRef(score)
  const shownAt = useRef(0)
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const item = queue[index]
  const q = useMemo(() => (item ? makeQuestion(getState(), item.letterId, item.dir, pool) : undefined), [item, index, pool])

  useEffect(() => {
    shownAt.current = performance.now()
    setTyped('')
  }, [q])
  useEffect(() => () => clearTimeout(advanceTimer.current), [])

  if (!q) return null
  const mnemonic = getState().mnemonics[q.letter.id] || q.letter.mnemonic

  function next() {
    setFeedback(null)
    if (index + 1 >= queue.length) onDone(scoreRef.current)
    else setIndex(i => i + 1)
  }

  function answer(correct: boolean, chosen?: Letter) {
    if (feedback || !q) return
    recordAnswer({
      letterId: q.letter.id,
      dir: q.dir,
      correct,
      rtMs: performance.now() - shownAt.current,
      typed: q.mode === 'type',
      targetGlyph: q.letter.glyph,
      chosenGlyph: chosen?.glyph,
      schedule: true,
    })
    scoreRef.current = { correct: scoreRef.current.correct + (correct ? 1 : 0), total: scoreRef.current.total + 1 }
    setScore(scoreRef.current)
    setFeedback({ correct, chosen })
    Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error)
    if (correct) {
      advanceTimer.current = setTimeout(next, 650)
    } else {
      setQueue(qu => {
        const copy = [...qu]
        copy.splice(Math.min(index + 3, copy.length), 0, item)
        return copy
      })
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.progress}>
        <View style={[styles.progressFill, { width: `${(index / queue.length) * 100}%` }]} />
      </View>

      <View style={styles.prompt}>
        {q.dir === 'rec' ? (
          <>
            <Text style={styles.glyph}>{q.letter.glyph}</Text>
            <Text style={styles.hint}>{q.mode === 'type' ? 'Tippe die Umschrift' : 'Wie klingt dieser Buchstabe?'}</Text>
          </>
        ) : (
          <>
            <Text style={styles.translit}>{q.letter.translit}</Text>
            <Text style={styles.hint}>{q.letter.sound}</Text>
            <Text style={[styles.hint, { marginTop: 10 }]}>Welcher Buchstabe ist das?</Text>
          </>
        )}
      </View>

      {q.mode === 'choice' ? (
        <View style={styles.options}>
          {q.options.map(o => {
            const isRight = feedback && o.id === q.letter.id
            const isWrong = feedback && !feedback.correct && feedback.chosen?.id === o.id
            return (
              <GlassButton
                key={o.id}
                disabled={!!feedback}
                onPress={() => answer(o.id === q.letter.id, o)}
                tint={isRight ? GREEN : isWrong ? RED : undefined}
                style={styles.option}
                glassStyle={styles.optionGlass}
              >
                <Text style={[q.dir === 'rec' ? styles.optionText : styles.optionGlyph, (isRight || isWrong) && { color: 'white' }]}>
                  {q.dir === 'rec' ? o.translit : o.glyph}
                </Text>
              </GlassButton>
            )
          })}
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            editable={!feedback}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            placeholder="z. B. sh oder k'"
            placeholderTextColor={C.label3}
            returnKeyType="done"
            onSubmitEditing={() => typed.trim() && answer(matchesTranslit(typed, q.letter))}
            style={[styles.input, feedback && { backgroundColor: feedback.correct ? GREEN : RED, color: 'white' }]}
          />
          {!feedback && (
            <PrimaryButton title="Prüfen" disabled={!typed.trim()} onPress={() => answer(matchesTranslit(typed, q.letter))} />
          )}
        </View>
      )}

      {feedback && !feedback.correct && (
        <View style={styles.feedback}>
          <View style={styles.feedbackRow}>
            <Text style={styles.feedbackGlyph}>{q.letter.glyph}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.feedbackTitle}>{q.letter.translit} · <Text style={styles.feedbackSound}>{q.letter.sound}</Text></Text>
              {feedback.chosen && feedback.chosen.id !== q.letter.id && (
                <Text style={styles.feedbackSound}>Du hast {feedback.chosen.glyph} ({feedback.chosen.translit}) gewählt.</Text>
              )}
            </View>
          </View>
          <Text style={styles.mnemonic}>💡 {mnemonic}</Text>
          <PrimaryButton title="Weiter" onPress={next} />
        </View>
      )}

      <Text style={styles.score}>{score.correct} / {score.total} richtig</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  progress: { height: 5, borderRadius: 3, backgroundColor: C.fill, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', backgroundColor: C.blue, borderRadius: 3 },
  prompt: { backgroundColor: C.card, borderRadius: 28, borderCurve: 'continuous', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  glyph: { fontSize: 110, lineHeight: 150, color: C.label },
  translit: { fontSize: 52, fontWeight: '700', color: C.label },
  hint: { fontSize: 15, color: C.label2, textAlign: 'center' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: { width: '48%', flexGrow: 1 },
  optionGlass: { borderRadius: 24, minHeight: 72 },
  optionText: { fontSize: 24, fontWeight: '500', color: C.label },
  optionGlyph: { fontSize: 44, lineHeight: 60, color: C.label },
  input: { backgroundColor: C.card, borderRadius: 24, borderCurve: 'continuous', fontSize: 26, textAlign: 'center', paddingVertical: 16, color: C.label },
  feedback: { backgroundColor: C.card, borderRadius: 26, borderCurve: 'continuous', padding: 16, gap: 12 },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  feedbackGlyph: { fontSize: 48, lineHeight: 66, color: C.label },
  feedbackTitle: { fontSize: 17, fontWeight: '600', color: C.label },
  feedbackSound: { fontSize: 15, fontWeight: '400', color: C.label2 },
  mnemonic: { backgroundColor: C.fill, borderRadius: 14, padding: 12, fontSize: 15, color: C.label, overflow: 'hidden' },
  score: { textAlign: 'center', fontSize: 13, color: C.label2 },
})
