/**
 * Architecture, variant and search live in the query string so a filtered view
 * is a shareable link. Pure string <-> state here; App validates the ids
 * against the catalog, since anything can arrive in a URL.
 */
export interface UrlState {
  readonly archId: string | null
  readonly variantId: string | null
  readonly query: string
}

export function readUrl(search: string): UrlState {
  const p = new URLSearchParams(search)
  return {
    archId: p.get('arch'),
    variantId: p.get('variant'),
    query: p.get('q') ?? '',
  }
}

/**
 * Only non-default values are written, so the bare URL stays clean.
 * Returns the query string alone (`''` when empty) — the caller supplies the path.
 */
export function writeUrl(state: UrlState, isDefaultPair: boolean): string {
  const p = new URLSearchParams()
  if (!isDefaultPair) {
    if (state.archId) p.set('arch', state.archId)
    if (state.variantId) p.set('variant', state.variantId)
  }
  const q = state.query.trim()
  if (q) p.set('q', q)
  const s = p.toString()
  return s ? `?${s}` : ''
}
