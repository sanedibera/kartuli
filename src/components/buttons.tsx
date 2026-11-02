import { isLiquidGlassSupported, LiquidGlassView } from '@callstack/liquid-glass'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, type ColorValue, type ViewStyle } from 'react-native'

import { C } from './ui'

/** Glas-Schaltfläche wie in iOS 26 (.glass); mit `tint` getönt (.glassProminent). */
export function GlassButton({
  children,
  onPress,
  disabled,
  tint,
  style,
  glassStyle,
}: {
  children: ReactNode
  onPress?: () => void
  disabled?: boolean
  tint?: ColorValue
  style?: ViewStyle
  glassStyle?: ViewStyle
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }, style]}>
      <LiquidGlassView
        interactive
        effect="regular"
        tintColor={tint}
        style={[styles.glass, glassStyle, !isLiquidGlassSupported && { backgroundColor: tint ?? C.card }]}
      >
        {children}
      </LiquidGlassView>
    </Pressable>
  )
}

/** Hauptaktion: blau getöntes Glas mit weißer Schrift. */
export function PrimaryButton({ title, onPress, disabled }: { title: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <GlassButton onPress={onPress} disabled={disabled} tint="#007AFF" style={{ opacity: disabled ? 0.4 : 1 }}>
      <Text style={styles.primaryText}>{title}</Text>
    </GlassButton>
  )
}

const styles = StyleSheet.create({
  glass: { borderRadius: 999, minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryText: { color: 'white', fontSize: 17, fontWeight: '600' },
})
