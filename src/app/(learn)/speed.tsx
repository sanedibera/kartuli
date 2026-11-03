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
  const [flash, setFlash] = useState<{ id: string; correct: boolean } | null>(null)
  const shownAt = useRef(0)
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (phase !== 'run') return
    const t = setInterval(() => setLeft(l => l - 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'run' && left <= 0) {
      setSpeedBest(score)
      setPhase('done')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }, [left, phase, score])

  useEffect(() => () => clearTimeout(flashTimer.current), [])

  function nextTarget(prev?: Letter) {
    const n = randomLetter(pool, prev)
    setTarget(n)
    setOptions(shuffle([n, ...distractors(getState(), n, pool)]))
    shownAt.current = performance.now()
  }

  function start() {
    setPrevBest(getState().speedBest)
    setScore(0)
    setLeft(SECONDS)
    nextTarget()
    setPhase('run')
  }

  function pick(o: Letter) {
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
    Haptics.impactAsync(correct ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy)
    if (correct) setScore(sc => sc + 1)
    setFlash({ id: o.id, correct })
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(null), 180)
    nextTarget(target)
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
                So viele Buchstaben wie möglich. Fehler kosten Zeit, nicht Punkte – flüssiges Lesen heißt: schnell und richtig.
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
        <Text style={styles.status}>{left} s</Text>
        <Text style={styles.status}>✓ {score}</Text>
      </View>
      <View style={[s.card, styles.prompt]}>
        <Text style={styles.glyph}>{target.glyph}</Text>
      </View>
      <View style={styles.options}>
        {options.map(o => {
          const tint = flash?.id === o.id ? (flash.correct ? GREEN : RED) : undefined
          return (
            <GlassButton key={o.id} onPress={() => pick(o)} tint={tint} style={styles.option} glassStyle={styles.optionGlass}>
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
  status: { fontSize: 17, fontWeight: '600', color: C.label, fontVariant: ['tabular-nums'] },
  prompt: { alignItems: 'center', paddingVertical: 24 },
  glyph: { fontSize: 110, lineHeight: 150, color: C.label },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: { width: '48%', flexGrow: 1 },
  optionGlass: { borderRadius: 24, minHeight: 72 },
  optionText: { fontSize: 24, fontWeight: '500', color: C.label },
})
