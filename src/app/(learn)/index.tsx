import { router } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { C, Row, s, Section } from '@/components/ui'
import { LETTERS } from '@/lib/letters'
import { dueKeys, learnedLetters, mastery, nextGroup, useAppState } from '@/lib/store'
import { WORDS } from '@/lib/words'

const MAX_REVIEWS = 30

export default function Home() {
  const st = useAppState()
  const due = dueKeys(st).length
  const group = nextGroup(st)
  const learned = learnedLetters(st)
  const glyphs = new Set(learned.map(l => l.glyph))
  const words = WORDS.filter(w => [...w.ka].every(c => glyphs.has(c)))
  const secure = LETTERS.filter(l => mastery(st, l.id) === 'sicher').length

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} contentInsetAdjustmentBehavior="automatic">
      <View style={[s.card, styles.stats]}>
        <Stat value={learned.length} label="von 33 gelernt" />
        <Stat value={secure} label="sicher" />
        <Stat value={st.streak.days} label="Tage in Folge" />
      </View>

      <Section title="Heute">
        <Row
          first
          icon="arrow.trianglehead.2.clockwise"
          color="blue"
          title="Wiederholen"
          subtitle={due ? `${due} Karten fällig${due > MAX_REVIEWS ? ` · ${MAX_REVIEWS} pro Runde` : ''}` : 'Gerade nichts fällig'}
          badge={due || undefined}
          disabled={due === 0}
          onPress={() => router.push('/review')}
        />
        {group !== undefined ? (
          <Row
            icon="plus"
            color="green"
            title={`Neue Buchstaben · Gruppe ${group}`}
            subtitle={due >= 10 ? 'Tipp: erst die fälligen Karten wiederholen' : undefined}
            detail={LETTERS.filter(l => l.group === group).map(l => l.glyph).join(' ')}
            onPress={() => router.push('/learn')}
          />
        ) : (
          <Row icon="checkmark" color="green" title="Alle 33 Buchstaben eingeführt" subtitle="Jetzt wiederholen und lesen" disabled />
        )}
      </Section>

      <Section title="Üben">
        <Row
          first
          icon="textformat"
          color="orange"
          title="Wörter lesen"
          subtitle={words.length ? `${words.length} Wörter mit deinen Buchstaben` : 'Ab der ersten Gruppe'}
          disabled={words.length === 0}
          onPress={() => router.push('/words')}
        />
        <Row
          icon="stopwatch"
          color="red"
          title="Schnellrunde"
          subtitle={`60 Sekunden · Rekord ${st.speedBest}`}
          disabled={learned.length === 0}
          onPress={() => router.push('/speed')}
        />
      </Section>
    </ScrollView>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, marginTop: 8 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700', color: C.label, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 13, color: C.label2 },
})
