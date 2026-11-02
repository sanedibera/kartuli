import { SymbolView, type SFSymbol } from 'expo-symbols'
import * as Haptics from 'expo-haptics'
import type { ReactNode } from 'react'
import { PlatformColor, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'

// Systemfarben: passen sich Hell-/Dunkelmodus und Kontrast-Einstellungen automatisch an
export const C = {
  bg: PlatformColor('systemGroupedBackground'),
  card: PlatformColor('secondarySystemGroupedBackground'),
  label: PlatformColor('label'),
  label2: PlatformColor('secondaryLabel'),
  label3: PlatformColor('tertiaryLabel'),
  separator: PlatformColor('separator'),
  fill: PlatformColor('tertiarySystemFill'),
  blue: PlatformColor('systemBlue'),
  green: PlatformColor('systemGreen'),
  orange: PlatformColor('systemOrange'),
  red: PlatformColor('systemRed'),
  gray: PlatformColor('systemGray'),
}

export function Section({ title, footer, children, style }: { title?: string; footer?: string; children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[s.section, style]}>
      {title && <Text style={s.sectionTitle}>{title}</Text>}
      <View style={s.card}>{children}</View>
      {footer && <Text style={s.sectionFooter}>{footer}</Text>}
    </View>
  )
}

export function Row(props: {
  icon: SFSymbol
  color: keyof typeof C
  title: string
  subtitle?: string
  detail?: string
  badge?: number
  disabled?: boolean
  first?: boolean
  onPress?: () => void
}) {
  return (
    <Pressable
      disabled={props.disabled}
      onPress={() => {
        Haptics.selectionAsync()
        props.onPress?.()
      }}
      style={({ pressed }) => [s.row, pressed && { backgroundColor: C.fill }, props.disabled && { opacity: 0.4 }]}
    >
      <View style={[s.rowIcon, { backgroundColor: C[props.color] }]}>
        <SymbolView name={props.icon} tintColor="white" size={17} weight="semibold" />
      </View>
      <View style={[s.rowBody, !props.first && s.rowDivider]}>
        <View style={{ flex: 1 }}>
          <Text style={s.rowTitle}>{props.title}</Text>
          {props.subtitle && <Text style={s.rowSubtitle}>{props.subtitle}</Text>}
          {props.detail && <Text style={[s.rowSubtitle, { letterSpacing: 1 }]}>{props.detail}</Text>}
        </View>
        {props.badge !== undefined && (
          <View style={s.badge}><Text style={s.badgeText}>{props.badge}</Text></View>
        )}
        {!props.disabled && <SymbolView name="chevron.right" tintColor={C.label3} size={13} weight="semibold" />}
      </View>
    </Pressable>
  )
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  section: { marginTop: 22 },
  sectionTitle: { fontSize: 13, color: C.label2, textTransform: 'uppercase', marginLeft: 16, marginBottom: 7 },
  sectionFooter: { fontSize: 13, color: C.label2, marginHorizontal: 16, marginTop: 7 },
  card: { backgroundColor: C.card, borderRadius: 26, borderCurve: 'continuous', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, minHeight: 60 },
  rowIcon: { width: 30, height: 30, borderRadius: 8, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 14, paddingRight: 16, paddingVertical: 11, alignSelf: 'stretch' },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator },
  rowTitle: { fontSize: 17, color: C.label },
  rowSubtitle: { fontSize: 15, color: C.label2, marginTop: 1 },
  badge: { backgroundColor: C.red, borderRadius: 11, minWidth: 22, height: 22, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: 'white', fontSize: 14, fontWeight: '600' },
})
