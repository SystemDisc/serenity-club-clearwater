export type MediaRepair = {
  id: number
  changes: {
    original?: { from: string; to: string; url: string }
    sizes: Record<string, { from: string; to: string; url: string }>
  }
}

type MediaFilenames = { filename?: string | null; sizes?: Record<string, { filename?: string | null } | undefined> | null }

export function prepareMediaRepair(doc: MediaFilenames, repair: MediaRepair) {
  const data: { filename?: string; sizes?: Record<string, { filename: string }> } = {}
  const check = (actual: string | null | undefined, change: { from: string; to: string }, field: string) => {
    if (actual === change.to) return false
    if (actual !== change.from) throw new Error(`Media ${repair.id} ${field} changed since the audit; refusing to overwrite it`)
    return true
  }
  if (repair.changes.original && check(doc.filename, repair.changes.original, 'filename')) {
    data.filename = repair.changes.original.to
  }
  for (const [name, change] of Object.entries(repair.changes.sizes)) {
    if (check(doc.sizes?.[name]?.filename, change, `sizes.${name}`)) {
      data.sizes ??= {}
      data.sizes[name] = { filename: change.to }
    }
  }
  return data
}
