// Generates src/data/sets/m6502.json from the transcribed opcode table plus prose.
// Derived here rather than hand-written so `bytes` and `operand` cannot drift from `mode`.
// Run with: npm run build:data
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { CATEGORY, TEXT } from './m6502-text.mjs'

const here = dirname(fileURLToPath(import.meta.url))

// mode -> [operand syntax, instruction length]
const MODE = {
  implicit: ['', 1],
  accumulator: ['A', 1],
  immediate: ['#<imm8>', 2],
  zero_page: ['<zp>', 2],
  zero_page_x: ['<zp>,X', 2],
  zero_page_y: ['<zp>,Y', 2],
  relative: ['<label>', 2],
  absolute: ['<abs16>', 3],
  absolute_x: ['<abs16>,X', 3],
  absolute_y: ['<abs16>,Y', 3],
  indirect: ['(<abs16>)', 3],
  indexed_indirect: ['(<zp>,X)', 2],
  indirect_indexed: ['(<zp>),Y', 2],
}

const categoryOf = Object.fromEntries(
  Object.entries(CATEGORY).flatMap(([cat, list]) => list.split(' ').map((m) => [m, cat])),
)

/** Turn the source table's `4` / `4*` / `2*` into the documented cycles string. */
function cycles(raw, mode) {
  const base = Number.parseInt(raw, 10)
  const starred = raw.includes('*')
  if (mode === 'relative') return `${base} (${base + 1} if taken, ${base + 2} if taken across a page)`
  return starred ? `${base} (${base + 1} on page cross)` : String(base)
}

const lines = readFileSync(join(here, 'm6502-opcodes.txt'), 'utf8').split('\n')
const flags = {}
const byMnemonic = new Map()

for (const line of lines) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  if (t.startsWith('@')) {
    const [, mnemonic, f] = t.split(/\s+/)
    flags[mnemonic] = f === '-' ? [] : [...f]
    continue
  }
  const [op, mnemonic, mode, cyc] = t.split(/\s+/)
  const spec = MODE[mode]
  if (!spec) throw new Error(`unknown mode ${mode} on opcode ${op}`)
  if (!byMnemonic.has(mnemonic)) byMnemonic.set(mnemonic, [])
  byMnemonic.get(mnemonic).push({
    name: mode,
    opcode: op,
    operand: spec[0],
    bytes: spec[1],
    cycles: cycles(cyc, mode),
  })
}

const instructions = [...byMnemonic.keys()].sort().map((mnemonic) => {
  const text = TEXT[mnemonic]
  const category = categoryOf[mnemonic]
  if (!text) throw new Error(`no prose for ${mnemonic}`)
  if (!category) throw new Error(`no category for ${mnemonic}`)
  if (!flags[mnemonic]) throw new Error(`no flags for ${mnemonic}`)
  return {
    id: `m6502.${mnemonic.toLowerCase()}`,
    mnemonic,
    aliases: [],
    category,
    summary: text.summary,
    description: text.description,
    examples: text.examples,
    flags: flags[mnemonic],
    modes: byMnemonic.get(mnemonic),
  }
})

const opcodeCount = instructions.reduce((n, i) => n + i.modes.length, 0)
if (instructions.length !== 56) throw new Error(`expected 56 mnemonics, got ${instructions.length}`)
if (opcodeCount !== 151) throw new Error(`expected 151 opcodes, got ${opcodeCount}`)

const out = {
  set: 'm6502',
  name: '6502 (1975)',
  flagBits: 'NV-BDIZC',
  source:
    'Transcribed from http://www.oxyron.de/html/opcodes02.html and cross-checked against https://www.masswerk.at/6502/6502_instruction_set.html',
  instructions,
}
writeFileSync(join(here, '../src/data/sets/m6502.json'), JSON.stringify(out, null, 2) + '\n')
console.log(`wrote ${instructions.length} mnemonics, ${opcodeCount} opcodes`)
