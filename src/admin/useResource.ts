'use client'

import { useEffect, useState } from 'react'

/** Abort superseded reads and never show the previous request's data as the new selection. */
export function useResource<T>(url: string | null) {
  const [result, setResult] = useState<{ url: string; value?: T; error?: string }>()
  useEffect(() => {
    if (!url) return
    const controller = new AbortController()
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? 'Your session ended. Sign in again to continue.'
              : 'This content could not be loaded. Close this window and try again.',
          )
        return response.json() as Promise<T>
      })
      .then((value) => setResult({ url, value }))
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setResult({ url, error: error.message })
      })
    return () => controller.abort()
  }, [url])
  return {
    value: url && result?.url === url ? result.value : undefined,
    error: url && result?.url === url ? result.error : undefined,
    loading: !!url && result?.url !== url,
  }
}
