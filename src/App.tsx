import { useEffect, useMemo, useState } from 'react'
import { ArchPicker } from './components/ArchPicker'
import { CompareBar } from './components/CompareBar'
import { FilterBar } from './components/FilterBar'
import { InstructionTable } from './components/InstructionTable'
import { UndocumentedAppendix } from './components/UndocumentedAppendix'
import { architectures, findArch, firstPair, loadAppendix, loadSet } from './lib/catalog'
import { diffSets } from './lib/diff'
import { countOpcodes, filterInstructions, sortInstructions, type SortMode } from './lib/filter'
import { readUrl, writeUrl } from './lib/urlState'

export function App() {
  const initial = firstPair()
  // Ids arrive from the query string, so they are resolved against the catalog
  // below rather than trusted; an unknown id falls back to the default pair.
  const fromUrl = readUrl(window.location.search)
  const [archId, setArchId] = useState(fromUrl.archId ?? initial.arch.id)
  const [variantId, setVariantId] = useState(fromUrl.variantId ?? initial.variant.id)
  const [query, setQuery] = useState(fromUrl.query)
  const [sort, setSort] = useState<SortMode>('mnemonic')
  const [compareId, setCompareId] = useState<string | null>(null)

  const arch = findArch(archId) ?? initial.arch
  const variant = arch.variants.find((v) => v.id === variantId) ?? arch.variants[0] ?? initial.variant
  const set = useMemo(() => loadSet(variant), [variant])

  const isDefaultPair = arch.id === initial.arch.id && variant.id === initial.variant.id

  // replaceState, not pushState: filtering should not fill the back button.
  useEffect(() => {
    const qs = writeUrl({ archId: arch.id, variantId: variant.id, query }, isDefaultPair)
    window.history.replaceState(null, '', qs || window.location.pathname)
  }, [arch.id, variant.id, query, isDefaultPair])

  // Other variants of the same architecture are the only sensible comparisons.
  const others = arch.variants.filter((v) => v.id !== variant.id)
  const compareVariant = others.find((v) => v.id === compareId) ?? null
  const compareSet = useMemo(
    () => (compareVariant ? loadSet(compareVariant) : null),
    [compareVariant],
  )
  const diff = useMemo(
    () => (compareSet ? diffSets(set, compareSet) : null),
    [set, compareSet],
  )

  const shown = useMemo(() => {
    const base = diff
      ? set.instructions.filter((i) => diff.touchedMnemonics.has(i.mnemonic))
      : set.instructions
    return sortInstructions(filterInstructions(base, query), sort)
  }, [set, query, sort, diff])

  const appendix = useMemo(() => loadAppendix(set.set), [set.set])
  const total = { mnemonics: set.instructions.length, opcodes: countOpcodes(set.instructions) }
  const filtering = query.trim().length > 0

  return (
    <div className="app">
      <header className="header">
        <h1 className="header__title">cpuinstr</h1>
        <p className="header__sub">instruction set browser</p>
        <p className="header__counts">
          {filtering ? (
            <>
              <strong>{shown.length}</strong> of {total.mnemonics} mnemonics ·{' '}
              <strong>{countOpcodes(shown)}</strong> of {total.opcodes} opcodes
            </>
          ) : (
            <>
              <strong>{total.mnemonics}</strong> mnemonics · <strong>{total.opcodes}</strong> opcodes
            </>
          )}
        </p>
        <p className="header__legend">
          Status register <code className="mono">{set.flagBits}</code> — the <code>B</code> bit is not a
          real flag, so no instruction lists it.
        </p>
      </header>

      <ArchPicker
        architectures={architectures}
        arch={arch}
        variant={variant}
        onChange={(a, v) => {
          setArchId(a)
          setVariantId(v)
          setQuery('')
          setCompareId(null)
        }}
      />

      <CompareBar
        others={others}
        compareId={compareId}
        onCompare={setCompareId}
        diff={diff}
        compareName={compareVariant?.name}
      />

      <FilterBar query={query} onQuery={setQuery} sort={sort} onSort={setSort} />

      <InstructionTable
        instructions={shown}
        query={query}
        setName={set.name}
        onClearQuery={() => setQuery('')}
      />

      {appendix && <UndocumentedAppendix appendix={appendix} />}

      {set.source && <footer className="footer">Data: {set.source}</footer>}
    </div>
  )
}
