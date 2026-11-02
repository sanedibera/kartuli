import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router'
import { NativeTabs } from 'expo-router/native-tabs'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'

import { loadState } from '@/lib/store'

SplashScreen.preventAutoHideAsync()

// Systemeigene Tab-Leiste: auf iOS 26 zeichnet das System sie automatisch in Liquid Glass.
export default function RootLayout() {
  const scheme = useColorScheme()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadState().finally(() => {
      setReady(true)
      SplashScreen.hideAsync()
    })
  }, [])

  if (!ready) return null

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <NativeTabs minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger name="(learn)">
          <NativeTabs.Trigger.Label>Lernen</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="progress">
          <NativeTabs.Trigger.Label>Fortschritt</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="chart.bar.fill" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  )
}
