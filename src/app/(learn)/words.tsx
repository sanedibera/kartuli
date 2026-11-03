import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { GlassButton, PrimaryButton } from '@/components/buttons'
import { C, s } from '@/components/ui'
import { BY_GLYPH, transliterate } from '@/lib/letters'
import { shuffle } from '@/lib/quiz'
import { getState, learnedLetters } from '@/lib/store'
import { WORDS, type Word } from '@/lib/words'

const GREEN = 'rgba(52,199,89,0.85)'
const RED = 'rgba(255,59,48,0.85)'

function optionsFor(word: Word, words: Word[]) {
  return shuffle([word, ...shuffle(words.filter(w => w !== word)).slice(0, 3)])
}

/**
 * Ganze Wörter lesen: Buchstaben zusammenziehen statt einzeln erkennen.
 * Antippen eines Buchstabens zeigt seine Umschrift als Hinweis.
 */
export default function Words() {
  const [words] = useState(() => {
    const known = new Set(learnedLetters(getState()).map(l => l.glyph))
    return shuffle(WORDS.filter(w => [...w.ka].every(c => known.has(c))))
  })
  const [i, setI] = useState(0)
  const [options, setOptions] = useState(() => (words[0] ? optionsFor(words[0], words) : []))
  const [hints, setHints] = useState<Set<number>>(new Set())
  const [chosen, setChosen] = useState<Word | null>(null)
  const [score, setScore] = useState({ unaided: 0, total: 0 })

  const word = words[i % words.length]
  if (!word) return null

  function pick(o: Word) {
    const right = o === word
    setChosen(o)
    setScore(sc => ({ unaided: sc.unaided + (right && hints.size === 0 ? 1 : 0), total: sc.total + 1 }))
    Haptics.notificationAsync(right ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error)
  }

  function next() {
    const n = words[(i + 1) % words.length]
    setChosen(null)
    setHints(new Set())
    setOptions(optionsFor(n, words))
    setI(i + 1)
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={[s.content, { gap: 14 }]} contentInsetAdjustmentBehavior="automatic">
      <View style={[s.card, styles.wordCard]}>
        <View style={styles.letters}>
          {[...word.ka].map((c, k) => (
            <Pressable
              key={k}
              onPress={() => {
                Haptics.selectionAsync()
                setHints(h => new Set(h).add(k))
              }}
              style={styles.letter}
            >
              <Text style={styles.glyph}>{c}</Text>
              <Text style={styles.hint}>{hints.has(k) || chosen ? BY_GLYPH.get(c)?.translit : ' '}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.instruction}>Lies das Wort. Tippe auf einen Buchstaben für einen Hinweis.</Text>
      </View>

      <View style={styles.options}>
        {options.map(o => {
          const isRight = chosen && o === word
          const isWrong = chosen && chosen !== word && o === chosen
          return (
            <GlassButton
              key={o.ka}
              disabled={!!chosen}
              onPress={() => pick(o)}
              tint={isRight ? GREEN : isWrong ? RED : undefined}
              style={styles.option}
              glassStyle={styles.optionGlass}
            >
              <Text style={[styles.optionText, (isRight || isWrong) && { color: 'white' }]}>{transliterate(o.ka)}</Text>
            </GlassButton>
          )
        })}
      </View>

      {chosen && (
        <View style={[s.card, styles.feedback]}>
          <Text style={styles.feedbackTitle}>
            {word.ka} · {transliterate(word.ka)}
          </Text>
          <Text style={styles.meaning}>{word.de}</Text>
          <PrimaryButton title="Nächstes Wort" onPress={next} />
        </View>
      )}

      <Text style={styles.score}>
        {score.unaided} von {score.total} ohne Hilfe gelesen
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wordCard: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 12, gap: 12, marginTop: 8 },
  letters: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  letter: { alignItems: 'center', minWidth: 30, paddingHorizontal: 1 },
  glyph: { fontSize: 56, lineHeight: 78, color: C.label },
  hint: { fontSize: 15, fontWeight: '600', color: C.blue, minHeight: 20 },
  instruction: { fontSize: 13, color: C.label2, textAlign: 'center' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: { width: '48%', flexGrow: 1 },
  optionGlass: { borderRadius: 24, minHeight: 64 },
  optionText: { fontSize: 20, fontWeight: '500', color: C.label },
  feedback: { padding: 16, gap: 10 },
  feedbackTitle: { fontSize: 20, fontWeight: '600', color: C.label },
  meaning: { fontSize: 17, color: C.label2 },
  score: { textAlign: 'center', fontSize: 13, color: C.label2 },
})
