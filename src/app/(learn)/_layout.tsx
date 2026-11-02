import { Stack } from 'expo-router'

// Systemeigene Navigation: großer Titel, Zurück-Wischgeste, iOS-26-Glasleiste
export default function LearnLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Lernen', headerLargeTitle: true }} />
      <Stack.Screen name="learn" options={{ title: 'Neue Buchstaben' }} />
      <Stack.Screen name="review" options={{ title: 'Wiederholen' }} />
      <Stack.Screen name="words" options={{ title: 'Wörter lesen' }} />
      <Stack.Screen name="speed" options={{ title: 'Schnellrunde' }} />
    </Stack>
  )
}
