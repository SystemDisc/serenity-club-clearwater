'use client'

import React, { createContext, useCallback, use, useSyncExternalStore } from 'react'
import type { Theme, ThemeContextType } from './types'
import { defaultTheme, getImplicitPreference, themeLocalStorageKey } from './shared'
import { readTheme, subscribeTheme } from './store'
const ThemeContext = createContext<ThemeContextType>({ setTheme: () => null, theme: undefined })
const serverTheme = () => undefined

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, serverTheme)
  const setTheme = useCallback((value: Theme | null) => {
    if (value === null) window.localStorage.removeItem(themeLocalStorageKey)
    else window.localStorage.setItem(themeLocalStorageKey, value)
    document.documentElement.setAttribute(
      'data-theme',
      value || getImplicitPreference() || defaultTheme,
    )
    window.dispatchEvent(new Event('serenity-theme'))
  }, [])
  return <ThemeContext value={{ setTheme, theme }}>{children}</ThemeContext>
}
export const useTheme = (): ThemeContextType => use(ThemeContext)
