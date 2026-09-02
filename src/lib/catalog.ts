import architecturesJson from '../data/architectures.json'
import type { Appendix, Architecture, InstructionSet, Variant } from './types'

export const architectures = architecturesJson.architectures as readonly Architecture[]

// import.meta.glob resolves every set at build time, so adding a variant to
// architectures.json needs no code change here. Swap this one function for a
// fetch() if the data ever moves behind an API.
const sets = import.meta.glob<{ default: InstructionSet }>('../data/sets/*.json', { eager: true })

export function loadSet(variant: Variant): InstructionSet {
  const key = `../data/${variant.file}`
  const mod = sets[key]
  if (!mod) throw new Error(`instruction set not found: ${variant.file}`)
  return mod.default
}

const appendices = import.meta.glob<{ default: Appendix }>('../data/undocumented/*.json', {
  eager: true,
})

/** The undocumented-opcode appendix for a set, when one exists. */
export function loadAppendix(setId: string): Appendix | null {
  return appendices[`../data/undocumented/${setId}.json`]?.default ?? null
}

/** First architecture and its first variant — the preselected pair. */
export function firstPair(): { arch: Architecture; variant: Variant } {
  const arch = architectures[0]
  const variant = arch?.variants[0]
  if (!arch || !variant) throw new Error('catalog is empty')
  return { arch, variant }
}

export function findArch(id: string): Architecture | undefined {
  return architectures.find((a) => a.id === id)
}
