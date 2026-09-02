// Shared by every instruction set: the addressing-mode table and the generator.
// bytes and operand syntax are derived from the mode so they cannot drift.
import { readFileSync, writeFileSync } from 'node:fs'

// mode -> [operand syntax, instruction length]
export const MODE = {
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
  // 65C02 additions
  indirect_zero_page: ['(<zp>)', 2],
  absolute_indexed_indirect: ['(<abs16>,X)', 3],
}

/** Turn the source table's `4` / `4*` / `2*` into the documented cycles string. */
export function cycles(raw, mode) {
  const base = Number.parseInt(raw, 10)
  const starred = raw.includes('*')
  if (mode === 'relative') return `${base} (${base + 1} if taken, ${base + 2} if taken across a page)`
  return starred ? `${base} (${base + 1} on page cross)` : String(base)
}

/** Parse an `OP MNEMONIC mode cycles` table plus its `@ MNEMONIC FLAGS` lines. */
export function parseOpcodeTable(path) {
  const flags = {}
  const byMnemonic = new Map()
  for (const line of readFileSync(path, 'utf8').split('\n')) {
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
  return { flags, byMnemonic }
}

export function categoryIndex(category) {
  return Object.fromEntries(
    Object.entries(category).flatMap(([cat, list]) => list.split(' ').map((m) => [m, cat])),
  )
}

/**
 * @param opts.modeFlags per-mnemonic, per-mode flag overrides — the 65C02 needs
 *   this for `BIT #imm`, which affects Z alone unlike every other BIT mode.
 */
export function buildSet(opts) {
  const { id, name, flagBits, opcodesFile, text, category, modeFlags = {}, flags: extraFlags = {}, expect, source, out } = opts
  const parsed = parseOpcodeTable(opcodesFile)
  const flags = { ...extraFlags, ...parsed.flags }
  const categoryOf = categoryIndex(category)

  const instructions = [...parsed.byMnemonic.keys()].sort().map((mnemonic) => {
    const t = text[mnemonic]
    if (!t) throw new Error(`${id}: no prose for ${mnemonic}`)
    if (!categoryOf[mnemonic]) throw new Error(`${id}: no category for ${mnemonic}`)
    if (!flags[mnemonic]) throw new Error(`${id}: no flags for ${mnemonic}`)

    const perMode = modeFlags[mnemonic] ?? {}
    const modes = parsed.byMnemonic.get(mnemonic).map((m) =>
      perMode[m.name] ? { ...m, flags: perMode[m.name] } : m,
    )
    return {
      id: `${id}.${mnemonic.toLowerCase()}`,
      mnemonic,
      aliases: [],
      category: categoryOf[mnemonic],
      summary: t.summary,
      description: t.description,
      examples: t.examples,
      flags: flags[mnemonic],
      modes,
    }
  })

  const opcodeCount = instructions.reduce((n, i) => n + i.modes.length, 0)
  if (instructions.length !== expect.mnemonics) {
    throw new Error(`${id}: expected ${expect.mnemonics} mnemonics, got ${instructions.length}`)
  }
  if (opcodeCount !== expect.opcodes) {
    throw new Error(`${id}: expected ${expect.opcodes} opcodes, got ${opcodeCount}`)
  }

  writeFileSync(out, JSON.stringify({ set: id, name, flagBits, source, instructions }, null, 2) + '\n')
  console.log(`${id}: ${instructions.length} mnemonics, ${opcodeCount} opcodes -> ${out}`)
}

/**
 * Read-only appendix of undocumented opcodes. Deliberately a different shape
 * from an instruction set: these are opcodes, not instructions — no summary, no
 * examples, and a per-opcode stability rating instead of flags.
 */
export function buildAppendix({ id, opcodesFile, note, expect, source, out }) {
  const rows = []
  const fn = {}
  for (const line of readFileSync(opcodesFile, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    if (t.startsWith('@')) {
      const [, mnemonic, ...rest] = t.split(/\s+/)
      fn[mnemonic] = rest.join(' ')
      continue
    }
    const [opcode, mnemonic, mode, cyc, stability] = t.split(/\s+/)
    const spec = MODE[mode]
    if (!spec) throw new Error(`unknown mode ${mode} on opcode ${opcode}`)
    rows.push({
      opcode,
      mnemonic,
      mode,
      operand: spec[0],
      bytes: spec[1],
      cycles: cyc === '-' ? null : cyc,
      stability,
    })
  }
  for (const r of rows) {
    if (!fn[r.mnemonic]) throw new Error(`${id}: no function text for ${r.mnemonic}`)
    r.function = fn[r.mnemonic]
  }
  if (rows.length !== expect.opcodes) {
    throw new Error(`${id}: expected ${expect.opcodes} opcodes, got ${rows.length}`)
  }
  if (new Set(rows.map((r) => r.opcode)).size !== rows.length) {
    throw new Error(`${id}: duplicate opcode in appendix`)
  }
  writeFileSync(out, JSON.stringify({ set: id, note, source, opcodes: rows }, null, 2) + '\n')
  console.log(`${id} appendix: ${rows.length} undocumented opcodes -> ${out}`)
}
