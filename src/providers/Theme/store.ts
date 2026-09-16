import { defaultTheme, getImplicitPreference, themeLocalStorageKey } from './shared'
import { themeIsValid } from './types'

export function readTheme() {
  const value = document.documentElement.getAttribute('data-theme')
  return themeIsValid(value) ? value : defaultTheme
}
export const readPreference = () => window.localStorage.getItem(themeLocalStorageKey) || 'auto'
export function subscribeTheme(notify: () => void) {
  const observer = new MutationObserver(notify)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const sync = () => {
    const preference = readPreference()
    document.documentElement.setAttribute(
      'data-theme',
      themeIsValid(preference) ? preference : getImplicitPreference() || defaultTheme,
    )
    notify()
  }
  window.addEventListener('storage', sync)
  window.addEventListener('serenity-theme', notify)
  media.addEventListener('change', sync)
  return () => {
    observer.disconnect()
    window.removeEventListener('storage', sync)
    window.removeEventListener('serenity-theme', notify)
    media.removeEventListener('change', sync)
  }
}
