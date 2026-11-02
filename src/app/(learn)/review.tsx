import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { PrimaryButton } from '@/components/buttons'
import { Quiz } from '@/components/quiz'
import { C, s } from '@/components/ui'
import { dueKeys, getState, learnedLetters, parseKey } from '@/lib/store'

const MAX_REVIEWS = 30

/** Fällige Karten wiederholen – höchstens 30 pro Runde. */
export default function Review() {
  const [queue] = useState(() => dueKeys(getState()).slice(0, MAX_REVIEWS).map(parseKey))
  const [pool] = useState(() => learnedLetters(getState()))
  const [done, setDone] = useState<{ correct: number; total: number } | null>(null)

  if (queue.length === 0 || done) {
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.content} contentInsetAdjustmentBehavior="automatic">
        <View style={[s.card, styles.card]}>
          <Text style={styles.title}>{done ? 'Runde fertig' : 'Gerade ist nichts fällig 👍'}</Text>
          {done && <Text style={styles.body}>{done.correct} von {done.total} richtig.</Text>}
        </View>
        <View style={{ marginTop: 22 }}>
          <PrimaryButton title="Zur Übersicht" onPress={() => router.back()} />
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
      <Quiz queue={queue} pool={pool} onDone={setDone} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  card: { padding: 20, gap: 8, marginTop: 8, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: C.label, textAlign: 'center' },
  body: { fontSize: 17, color: C.label },
})
