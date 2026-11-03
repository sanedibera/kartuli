import * as Haptics from 'expo-haptics'
import { useRef, useState } from 'react'
import { PanResponder, StyleSheet, Text, useColorScheme, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { GlassButton } from './buttons'
import { C, s } from './ui'

type Point = [number, number]

const toPath = (pts: Point[]) =>
  pts.length === 1
    ? `M${pts[0][0]} ${pts[0][1]} l0.1 0`
    : pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')

/**
 * Nachzeichnen mit dem Finger. Handschrift verbessert das Wiedererkennen neuer Zeichen.
 * `onDrawingChange` meldet Beginn und Ende eines Strichs, damit die Seite währenddessen nicht scrollt.
 */
export function TraceCanvas({ glyph, onDrawingChange }: { glyph: string; onDrawingChange?: (drawing: boolean) => void }) {
  const dark = useColorScheme() === 'dark'
  const [strokes, setStrokes] = useState<Point[][]>([])
  const [showTemplate, setShowTemplate] = useState(true)
  const current = useRef<Point[] | null>(null)
  const [, redraw] = useState(0)

  // Neuer Buchstabe → Zeichenfläche leeren
  const [shownGlyph, setShownGlyph] = useState(glyph)
  if (shownGlyph !== glyph) {
    setShownGlyph(glyph)
    setStrokes([])
  }

  const finish = () => {
    const stroke = current.current
    current.current = null
    if (stroke) setStrokes(st => [...st, stroke])
    onDrawingChange?.(false)
  }

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: e => {
        onDrawingChange?.(true)
        current.current = [[e.nativeEvent.locationX, e.nativeEvent.locationY]]
        redraw(n => n + 1)
      },
      onPanResponderMove: e => {
        current.current?.push([e.nativeEvent.locationX, e.nativeEvent.locationY])
        redraw(n => n + 1)
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    }),
  ).current

  const ink = dark ? '#FFFFFF' : '#000000'
  const all = current.current ? [...strokes, current.current] : strokes

  return (
    <View style={{ gap: 10 }}>
      <View style={[s.card, styles.area]} {...responder.panHandlers}>
        {showTemplate && (
          <Text style={styles.template} pointerEvents="none">
            {glyph}
          </Text>
        )}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {all.map((pts, i) => (
            <Path key={i} d={toPath(pts)} stroke={ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
        </Svg>
      </View>
      <View style={styles.buttons}>
        <GlassButton
          style={{ flex: 1 }}
          disabled={strokes.length === 0}
          onPress={() => {
            Haptics.selectionAsync()
            setStrokes([])
          }}
        >
          <Text style={[styles.buttonText, strokes.length === 0 && { color: C.label3 }]}>Löschen</Text>
        </GlassButton>
        <GlassButton style={{ flex: 1 }} onPress={() => setShowTemplate(v => !v)}>
          <Text style={styles.buttonText}>{showTemplate ? 'Vorlage aus' : 'Vorlage an'}</Text>
        </GlassButton>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  area: { height: 260, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  template: { fontSize: 190, lineHeight: 250, color: C.label, opacity: 0.12 },
  buttons: { flexDirection: 'row', gap: 10 },
  buttonText: { fontSize: 17, color: C.blue, fontWeight: '500' },
})
