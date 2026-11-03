import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { GlassButton, PrimaryButton } from '@/components/buttons'
import { C, s } from '@/components/ui'
import type { Letter } from '@/lib/letters'
import { distractors, shuffle } from '@/lib/quiz'
import { getState, learnedLetters, recordAnswer, setSpeedBest } from '@/lib/store'

const SECONDS = 60
const PENALTY = 3
const GREEN = 'rgba(52,199,89,0.85)'
const RED = 'rgba(255,59,48,0.85)'

const randomLetter = (pool: Letter[], not?: Letter) => {
  let n = pool[Math.floor(Math.random() * pool.length)]
  while (pool.length > 1 && n === not) n = pool[Math.floor(Math.random() * pool.length)]
  return n
}

/**
 * 60 Sekunden so viele Buchstaben wie möglich: trainiert Geläufigkeit (schnell und richtig).
 * Zählt nur für die Statistik, nicht für die Wiederholungsplanung.
 */
export default function Speed() {
  const [pool] = useState(() => learnedLetters(getState()))
  const [phase, setPhase] = useState<'ready' | 'run' | 'done'>('ready')
  const [left, setLeft] = useState(SECONDS)
  const [score, setScore] = useState(0)
  const [prevBest, setPrevBest] = useState(() => getState().speedBest)
  const [target, setTarget] = useState(() => randomLetter(pool))
  const [options, setOptions] = useState(() => shuffle([target, ...distractors(getState(), target, pool)]))
  const [feedback, setFeedback] = useState<{ chosenId: string; correct: boolean } | null>(null)
  const [penaltyShown, setPenaltyShown] = useState(false)
  const shownAt = useRef(0)
  const endAt = useRef(0)
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const penaltyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Restzeit aus einem festen Endzeitpunkt berechnen, damit Strafsekunden sofort wirken
  useEffect(() => {
    if (phase !== 'run') return
    const t = setInterval(() => setLeft(Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000))), 100)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'run' && left <= 0) {
      clearTimeout(advanceTimer.current)
      setFeedback(null)
      setSpeedBest(score)
      setPhase('done')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }, [left, phase, score])

  useEffect(
    () => () => {
      clearTimeout(advanceTimer.current)
      clearTimeout(penaltyTimer.current)
    },
    [],
  )

  function nextTarget(prev?: Letter) {
    const n = randomLetter(pool, prev)
    setTarget(n)
    setOptions(shuffle([n, ...distractors(getState(), n, pool)]))
    setFeedback(null)
    shownAt.current = performance.now()
  }

  function start() {
    setPrevBest(getState().speedBest)
    setScore(0)
    endAt.current = Date.now() + SECONDS * 1000
    setLeft(SECONDS)
    nextTarget()
    setPhase('run')
  }

  function pick(o: Letter) {
    if (feedback) return // während der Rückmeldung keine weiteren Antworten
    const correct = o.id === target.id
    recordAnswer({
      letterId: target.id,
      dir: 'rec',
      correct,
      rtMs: performance.now() - shownAt.current,
      typed: false,
      targetGlyph: target.glyph,
      chosenGlyph: o.glyph,
      schedule: false,
    })
    setFeedback({ chosenId: o.id, correct })
    if (correct) {
      setScore(sc => sc + 1)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      // Fehler kosten Zeit: Strafsekunden abziehen und kurz anzeigen
      endAt.current -= PENALTY * 1000
      setLeft(Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000)))
      setPenaltyShown(true)
      clearTimeout(penaltyTimer.current)
      penaltyTimer.current = setTimeout(() => setPenaltyShown(false), 900)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
    // Falsch: länger stehen lassen, damit man die richtige Lösung sieht
    advanceTimer.current = setTimeout(() => nextTarget(target), correct ? 350 : 900)
  }

  if (phase !== 'run') {
    const record = phase === 'done' && score > prevBest
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.content} contentInsetAdjustmentBehavior="automatic">
        <View style={[s.card, styles.card]}>
          {phase === 'ready' ? (
            <>
              <Text style={styles.title}>{SECONDS} Sekunden</Text>
              <Text style={styles.body}>
                So viele Buchstaben wie möglich. Jeder Fehler kostet {PENALTY} Sekunden – flüssiges Lesen heißt: schnell und richtig.
              </Text>
              <Text style={styles.muted}>Rekord: {prevBest}</Text>
            </>
          ) : (
            <>
              <Text style={styles.big}>{score}</Text>
              <Text style={styles.body}>richtig</Text>
              <Text style={styles.muted}>{record ? 'Neuer Rekord! 🎉' : `Rekord: ${prevBest}`}</Text>
            </>
          )}
        </View>
        <View style={styles.nav}>
          {phase === 'done' && (
            <GlassButton onPress={() => router.back()}>
              <Text style={styles.backText}>Übersicht</Text>
            </GlassButton>
          )}
          <View style={{ flex: 1 }}>
            <PrimaryButton title={phase === 'ready' ? 'Los!' : 'Nochmal'} onPress={start} />
          </View>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={[s.content, { gap: 14 }]} contentInsetAdjustmentBehavior="automatic" scrollEnabled={false}>
      <View style={styles.timer}>
        <View style={[styles.timerFill, { width: `${(left / SECONDS) * 100}%` }, left <= 10 && { backgroundColor: C.orange }]} />
      </View>
      <View style={styles.statusRow}>
        <View style={styles.timeRow}>
          <Text style={[styles.status, left <= 10 && { color: C.orange }]}>{left} s</Text>
          {penaltyShown && <Text style={styles.penalty}>−{PENALTY} s</Text>}
        </View>
        <Text style={styles.status}>✓ {score}</Text>
      </View>
      <View style={[s.card, styles.prompt]}>
        <Text style={styles.glyph}>{target.glyph}</Text>
      </View>
      <View style={styles.options}>
        {options.map(o => {
          const tint = !feedback ? undefined : o.id === target.id ? GREEN : o.id === feedback.chosenId ? RED : undefined
          return (
            <GlassButton key={`${target.id}-${o.id}`} onPress={() => pick(o)} tint={tint} style={styles.option} glassStyle={styles.optionGlass}>
              <Text style={[styles.optionText, tint && { color: 'white' }]}>{o.translit}</Text>
            </GlassButton>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  card: { padding: 20, gap: 8, marginTop: 8, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: C.label, textAlign: 'center' },
  big: { fontSize: 64, fontWeight: '700', color: C.label },
  body: { fontSize: 17, color: C.label, textAlign: 'center' },
  muted: { fontSize: 15, color: C.label2 },
  nav: { flexDirection: 'row', gap: 10, marginTop: 22 },
  backText: { fontSize: 17, color: C.blue, fontWeight: '500' },
  timer: { height: 5, borderRadius: 3, backgroundColor: C.fill, overflow: 'hidden', marginTop: 8 },
  timerFill: { height: '100%', backgroundColor: C.blue, borderRadius: 3 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  penalty: { fontSize: 17, fontWeight: '700', color: C.red },
  status: { fontSize: 17, fontWeight: '600', color: C.label, fontVariant: ['tabular-nums'] },
  prompt: { alignItems: 'center', paddingVertical: 24 },
  glyph: { fontSize: 110, lineHeight: 150, color: C.label },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: { width: '48%', flexGrow: 1 },
  optionGlass: { borderRadius: 24, minHeight: 72 },
  optionText: { fontSize: 24, fontWeight: '500', color: C.label },
})
