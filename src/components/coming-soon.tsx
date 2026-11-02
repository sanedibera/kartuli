import { SymbolView } from 'expo-symbols'
import { Text, View } from 'react-native'

import { C, s } from './ui'

/** Platzhalter für Bildschirme, die in der nächsten Ausbaustufe kommen. */
export function ComingSoon({ what }: { what: string }) {
  return (
    <View style={[s.screen, { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }]}>
      <SymbolView name="hammer" tintColor={C.label3} size={44} />
      <Text style={{ fontSize: 20, fontWeight: '600', color: C.label }}>{what}</Text>
      <Text style={{ fontSize: 15, color: C.label2, textAlign: 'center' }}>Kommt in der nächsten Ausbaustufe.</Text>
    </View>
  )
}
