import { isLiquidGlassSupported, LiquidGlassView } from '@callstack/liquid-glass'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { C, s, Section } from '@/components/ui'
import { BY_GLYPH, LETTERS } from '@/lib/letters'
import { mastery, resetAll, useAppState, type Mastery } from '@/lib/store'

const LEVELS: { key: Mastery; label: string; color: string; tint: string }[] = [
  { key: 'neu', label: 'neu', color: '#8e8e93', tint: 'rgba(142,142,147,0.14)' },
  { key: 'lernend', label: 'lernend', color: '#ff9500', tint: 'rgba(255,149,0,0.22)' },
  { key: 'gefestigt', label: 'gefestigt', color: '#007aff', tint: 'rgba(0,122,255,0.2)' },
  { key: 'sicher', label: 'sicher', color: '#34c759', tint: 'rgba(52,199,89,0.24)' },
]
const LEVEL = Object.fromEntries(LEVELS.map(l => [l.key, l]))

export default function Progress() {
  const st = useAppState()
  const confusions = Object.entries(st.confusions).sort(([, a], [, b]) => b - a).slice(0, 8)

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} contentInsetAdjustmentBehavior="automatic">
      {/* Zusammenfassung als echte Liquid-Glass-Kacheln (iOS 26) */}
      <View style={styles.summary}>
        {LEVELS.map(l => (
          <LiquidGlassView
            key={l.key}
            interactive
            effect="regular"
            tintColor={l.tint}
            style={[styles.chip, !isLiquidGlassSupported && { backgroundColor: l.tint }]}
          >
            <Text style={styles.chipValue}>{LETTERS.filter(x => mastery(st, x.id) === l.key).length}</Text>
            <View style={styles.chipLabelRow}>
              <View style={[styles.dot, { backgroundColor: l.color }]} />
              <Text style={styles.chipLabel}>{l.label}</Text>
            </View>
          </LiquidGlassView>
        ))}
      </View>

      <Section title="Alle Buchstaben" footer="Prozent = Trefferquote, Sekunden = durchschnittliche Reaktionszeit. Ziel: unter 1 s.">
        <View style={styles.grid}>
          {LETTERS.map(l => {
            const stat = st.stats[l.id]
            return (
              <View key={l.id} style={[styles.cell, { backgroundColor: LEVEL[mastery(st, l.id)].tint }]}>
                <Text style={styles.cellGlyph}>{l.glyph}</Text>
                <Text style={styles.cellTranslit}>{l.translit}</Text>
                <Text style={styles.cellStat}>
                  {stat?.seen ? `${Math.round((stat.correct / stat.seen) * 100)}% · ${(stat.rtAvg / 1000).toFixed(1)}s` : '–'}
                </Text>
              </View>
            )
          })}
        </View>
      </Section>

      <Section title="Häufigste Verwechslungen" footer="Diese Paare tauchen in Abfragen bevorzugt als Antwortmöglichkeiten auf.">
        {confusions.length === 0 ? (
          <Text style={styles.empty}>Noch keine – weiter so.</Text>
        ) : (
          confusions.map(([k, n], i) => {
            const [a, b] = k.split('>')
            return (
              <View key={k} style={[styles.confusion, i > 0 && styles.divider]}>
                <Text style={styles.confusionText}>
                  <Text style={styles.confusionGlyph}>{a}</Text> ({BY_GLYPH.get(a)?.translit}) für{' '}
                  <Text style={styles.confusionGlyph}>{b}</Text> ({BY_GLYPH.get(b)?.translit}) gehalten
                </Text>
                <Text style={styles.confusionCount}>{n}×</Text>
              </View>
            )
          })
        )}
      </Section>

      <Section>
        <Pressable
          style={({ pressed }) => [styles.reset, pressed && { backgroundColor: C.fill }]}
          onPress={() =>
            Alert.alert('Fortschritt zurücksetzen?', 'Alle gelernten Buchstaben und Statistiken werden gelöscht.', [
              { text: 'Abbrechen', style: 'cancel' },
              { text: 'Zurücksetzen', style: 'destructive', onPress: resetAll },
            ])
          }
        >
          <Text style={styles.resetText}>Fortschritt zurücksetzen</Text>
        </Pressable>
      </Section>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 22, borderCurve: 'continuous' },
  chipValue: { fontSize: 24, fontWeight: '700', color: C.label, fontVariant: ['tabular-nums'] },
  chipLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  chipLabel: { fontSize: 12, color: C.label2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 10 },
  cell: { width: '23%', flexGrow: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 16, borderCurve: 'continuous' },
  cellGlyph: { fontSize: 28, color: C.label },
  cellTranslit: { fontSize: 14, color: C.label },
  cellStat: { fontSize: 10, color: C.label2, marginTop: 2, fontVariant: ['tabular-nums'] },
  empty: { padding: 16, color: C.label2, fontSize: 15 },
  confusion: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator },
  confusionText: { flex: 1, fontSize: 15, color: C.label },
  confusionGlyph: { fontSize: 20 },
  confusionCount: { fontSize: 15, color: C.label2 },
  reset: { padding: 14, alignItems: 'center' },
  resetText: { fontSize: 17, color: C.red },
})
