import type { PhotoBatch, PhotoBatchItem } from '@/payload-types'
export type BatchSnapshot = { batch: PhotoBatch; items: PhotoBatchItem[] }
export const idOf = (value: number | { id: number } | null | undefined) =>
  typeof value === 'object' ? value?.id : value
export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const data = await response.json().catch(() => null)
  if (!response.ok)
    throw new Error(
      response.status === 401 || response.status === 403
        ? 'Your session ended or access changed. Sign in again; your saved photos are safe.'
        : data?.errors?.[0]?.message ||
            data?.message ||
            'This step did not finish. Try again; saved photos are safe.',
    )
  return data as T
}
export const jsonPost = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
