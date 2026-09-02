import { useEffect, useRef } from 'react'
import type { SortMode } from '../lib/filter'

interface Props {
  query: string
  onQuery: (q: string) => void
  sort: SortMode
  onSort: (s: SortMode) => void
}

export function FilterBar({ query, onQuery, sort, onSort }: Props) {
  const input = useRef<HTMLInputElement>(null)

  // `/` focuses the search box, unless the user is already typing in a field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (e.key !== '/' || t instanceof HTMLInputElement || t instanceof HTMLSelectElement) return
      e.preventDefault()
      input.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="filterbar">
      <input
        ref={input}
        className="filterbar__input"
        type="search"
        value={query}
        placeholder="Filter mnemonic, description, operands…  (press /)"
        aria-label="Filter instructions"
        onChange={(e) => onQuery(e.target.value)}
      />
      <label className="filterbar__sort">
        <span>Sort</span>
        <select value={sort} onChange={(e) => onSort(e.target.value as SortMode)}>
          <option value="mnemonic">Mnemonic</option>
          <option value="category">Category</option>
        </select>
      </label>
    </div>
  )
}
