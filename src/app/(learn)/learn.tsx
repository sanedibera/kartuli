import { router, Stack } from 'expo-router'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { GlassButton, PrimaryButton } from '@/components/buttons'
import { Quiz } from '@/components/quiz'
import { TraceCanvas } from '@/components/trace-canvas'
import { C, s } from '@/components/ui'
import { LETTERS, transliterate } from '@/lib/letters'
import { shuffle } from '@/lib/quiz'
import { getState, learnedLetters, markGroupLearned, nextGroup, setMnemonic, useAppState } from '@/lib/store'
import { WORDS } from '@/lib/words'

/** Neue Gruppe: jeden Buchstaben vorstellen (Form, Laut, Eselsbrücke), dann sofort abfragen. */
export default function Learn() {
  const st = useAppState()
  // Gruppe, Ablenker-Pool und Abfrage einmal beim Öffnen festlegen
  const [group] = useState(() => nextGroup(getState()))
  const [letters] = useState(() => LETTERS.filter(l => l.group === group))
  const [pool] = useState(() => [...learnedLetters(getState()), ...letters])
  const [queue] = useState(() => [
    ...shuffle(letters.map(l => ({ letterId: l.id, dir: 'rec' as const }))),
    ...shuffle(letters.map(l => ({ letterId: l.id, dir: 'prod' as const }))),
  ])
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'done'>('intro')
  const [result, setResult] = useState({ correct: 0, total: 0 })
  const [drawing, setDrawing] = useState(false)

  if (group === undefined) {
    return (
      <View style={[s.screen, styles.center]}>
        <Text style={styles.doneTitle}>Alle 33 Buchstaben eingeführt 🇬🇪</Text>
      </View>
    )
  }

  if (phase === 'quiz') {
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: `Gruppe ${group} üben` }} />
        <Quiz
          queue={queue}
          pool={pool}
          onDone={r => {
            markGroupLearned(group)
            setResult(r)
            setPhase('done')
          }}
        />
      </ScrollView>
    )
  }

  if (phase === 'done') {
    const known = new Set(pool.map(l => l.glyph))
    const words = WORDS.filter(w => [...w.ka].every(c => known.has(c))).slice(0, 6)
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.content} contentInsetAdjustmentBehavior="automatic">
        <Stack.Screen options={{ title: 'Geschafft' }} />
        <View style={[s.card, styles.doneCard]}>
          <Text style={styles.doneTitle}>Gruppe {group} geschafft 🎉</Text>
          <Text style={styles.body}>{result.correct} von {result.total} Antworten richtig.</Text>
          <Text style={styles.muted}>
            Die neuen Buchstaben kommen ab jetzt in deinen Wiederholungen – kurz nach dem Lernen öfter, dann in wachsenden Abständen.
          </Text>
        </View>
        {words.length > 0 && (
          <>
            <Text style={[s.sectionTitle, styles.gapTop]}>Das kannst du jetzt schon lesen</Text>
            <View style={s.card}>
              {words.map((w, i) => (
                <View key={w.ka} style={[styles.wordRow, i > 0 && styles.divider]}>
                  <Text style={styles.wordKa}>{w.ka}</Text>
                  <Text style={styles.muted}>{transliterate(w.ka)} – {w.de}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        <View style={{ marginTop: 22 }}>
          <PrimaryButton title="Zur Übersicht" onPress={() => router.back()} />
        </View>
      </ScrollView>
    )
  }

  const l = letters[step]
  const example = WORDS.find(w => w.ka.includes(l.glyph))
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} contentInsetAdjustmentBehavior="automatic" keyboardDismissMode="interactive" scrollEnabled={!drawing}>
      <Stack.Screen options={{ title: `Gruppe ${group} · ${step + 1} von ${letters.length}` }} />

      <View style={[s.card, styles.hero]}>
        <Text style={styles.heroGlyph}>{l.glyph}</Text>
        <View>
          <Text style={styles.heroTranslit}>{l.translit}</Text>
          <Text style={styles.muted}>[{l.ipa}]</Text>
        </View>
      </View>

      <Text style={[s.sectionTitle, styles.gapTop]}>Aussprache</Text>
      <View style={[s.card, styles.pad]}>
        <Text style={styles.body}>{l.sound}</Text>
      </View>

      <Text style={[s.sectionTitle, styles.gapTop]}>Nachzeichnen</Text>
      <TraceCanvas glyph={l.glyph} onDrawingChange={setDrawing} />
      <Text style={s.sectionFooter}>Mit dem Finger nachfahren – Schreiben prägt die Form besser ein als nur Ansehen.</Text>

      <Text style={[s.sectionTitle, styles.gapTop]}>Eselsbrücke</Text>
      <View style={[s.card, styles.pad, { gap: 12 }]}>
        <Text style={styles.body}>💡 {l.mnemonic}</Text>
        <TextInput
          value={st.mnemonics[l.id] ?? ''}
          onChangeText={t => setMnemonic(l.id, t)}
          placeholder="Eigene Eselsbrücke – woran erinnert dich die Form?"
          placeholderTextColor={C.label3}
          multiline
          style={styles.input}
        />
      </View>
      <Text style={s.sectionFooter}>Selbst ausgedachte Eselsbrücken merkt man sich oft besser.</Text>

      {example && (
        <>
          <Text style={[s.sectionTitle, styles.gapTop]}>Beispiel</Text>
          <View style={[s.card, styles.pad, styles.exampleRow]}>
            <Text style={styles.wordKa}>{example.ka}</Text>
            <Text style={styles.muted}>{transliterate(example.ka)} – {example.de}</Text>
          </View>
        </>
      )}

      <View style={styles.nav}>
        <GlassButton disabled={step === 0} onPress={() => setStep(step - 1)} style={{ opacity: step === 0 ? 0.4 : 1 }}>
          <Text style={styles.backText}>Zurück</Text>
        </GlassButton>
        <View style={{ flex: 1 }}>
          {step < letters.length - 1 ? (
            <PrimaryButton title="Nächster Buchstabe" onPress={() => setStep(step + 1)} />
          ) : (
            <PrimaryButton title="Jetzt üben" onPress={() => setPhase('quiz')} />
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  gapTop: { marginTop: 22 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, paddingVertical: 20, marginTop: 8 },
  heroGlyph: { fontSize: 110, lineHeight: 150, color: C.label },
  heroTranslit: { fontSize: 48, fontWeight: '700', color: C.label },
  pad: { padding: 16 },
  body: { fontSize: 17, color: C.label },
  muted: { fontSize: 15, color: C.label2 },
  input: { backgroundColor: C.fill, borderRadius: 14, padding: 12, fontSize: 16, color: C.label, minHeight: 64 },
  exampleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  wordRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingHorizontal: 16, paddingVertical: 11 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator },
  wordKa: { fontSize: 22, color: C.label },
  nav: { flexDirection: 'row', gap: 10, marginTop: 24 },
  backText: { fontSize: 17, color: C.blue, fontWeight: '500' },
  doneCard: { padding: 20, gap: 8, marginTop: 8, alignItems: 'center' },
  doneTitle: { fontSize: 22, fontWeight: '700', color: C.label, textAlign: 'center' },
})
