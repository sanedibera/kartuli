import { Stack } from 'expo-router'

export default function ProgressLayout() {
  return (
    <Stack screenOptions={{ headerTransparent: true, headerShadowVisible: false, headerLargeTitleShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: 'Fortschritt', headerLargeTitle: true }} />
    </Stack>
  )
}
