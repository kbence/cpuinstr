import { describe, expect, it } from 'vitest'
import set from '../data/sets/m6502.json'
import type { Category, InstructionSet, ModeName } from './types'

const m6502 = set as InstructionSet

const CATEGORIES: readonly Category[] = [
  'load_store', 'transfer', 'stack', 'arithmetic', 'logic',
  'shift', 'branch', 'jump', 'flag', 'system',
]

// mode -> instruction length, from plan/05-6502.md
const MODE_BYTES: Record<ModeName, number> = {
  implicit: 1, accumulator: 1, immediate: 2, zero_page: 2, zero_page_x: 2,
  zero_page_y: 2, relative: 2, absolute: 3, absolute_x: 3, absolute_y: 3,
  indirect: 3, indexed_indirect: 2, indirect_indexed: 2,
}

describe('m6502 dataset invariants', () => {
  it('has 56 mnemonics and 151 documented opcodes', () => {
    expect(m6502.instructions).toHaveLength(56)
    const opcodes = m6502.instructions.flatMap((i) => i.modes.map((m) => m.opcode))
    expect(opcodes).toHaveLength(151)
  })

  it('has unique mnemonics and set-wide unique opcodes', () => {
    const mnemonics = m6502.instructions.map((i) => i.mnemonic)
    expect(new Set(mnemonics).size).toBe(mnemonics.length)
    const opcodes = m6502.instructions.flatMap((i) => i.modes.map((m) => m.opcode))
    expect(new Set(opcodes).size).toBe(opcodes.length)
  })

  it('uses uppercase two-digit hex opcodes', () => {
    for (const i of m6502.instructions) {
      for (const m of i.modes) expect(m.opcode).toMatch(/^[0-9A-F]{2}$/)
    }
  })

  it('gives every instruction a canonical id and no aliases', () => {
    for (const i of m6502.instructions) {
      expect(i.id).toBe(`m6502.${i.mnemonic.toLowerCase()}`)
      expect(i.aliases).toEqual([])
    }
  })

  it('uses only the fixed category vocabulary', () => {
    for (const i of m6502.instructions) expect(CATEGORIES).toContain(i.category)
  })

  it('matches bytes to the addressing mode, and stays within 1–3', () => {
    for (const i of m6502.instructions) {
      for (const m of i.modes) {
        expect(m.bytes).toBe(MODE_BYTES[m.name])
        expect(m.bytes).toBeGreaterThanOrEqual(1)
        expect(m.bytes).toBeLessThanOrEqual(3)
      }
    }
  })

  it('starts every cycles string with an integer', () => {
    for (const i of m6502.instructions) {
      for (const m of i.modes) expect(Number.parseInt(m.cycles, 10)).toBeGreaterThan(0)
    }
  })

  it('never lists B as an affected flag, and only uses real flag letters', () => {
    for (const i of m6502.instructions) {
      expect(i.flags).not.toContain('B')
      for (const f of i.flags) expect('NVDIZC').toContain(f)
    }
  })

  it('gives every instruction a summary, description and at least one example', () => {
    for (const i of m6502.instructions) {
      expect(i.summary.length).toBeGreaterThan(10)
      expect(i.description.length).toBeGreaterThan(40)
      expect(i.examples.length).toBeGreaterThan(0)
    }
  })
})

describe('m6502 facts verified against external sources', () => {
  const byMnemonic = new Map(m6502.instructions.map((i) => [i.mnemonic, i]))
  const get = (m: string) => {
    const i = byMnemonic.get(m)
    if (!i) throw new Error(`${m} missing`)
    return i
  }
  const opcodeFor = (m: string, mode: ModeName) =>
    get(m).modes.find((x) => x.name === mode)?.opcode
  const cyclesFor = (m: string, mode: ModeName) =>
    get(m).modes.find((x) => x.name === mode)?.cycles

  it('LDA has all 8 modes with the documented opcodes', () => {
    expect(get('LDA').modes.map((m) => m.opcode).sort()).toEqual(
      ['A1', 'A5', 'A9', 'AD', 'B1', 'B5', 'B9', 'BD'],
    )
  })

  it('LDX has 5 modes including zero_page_y', () => {
    expect(get('LDX').modes.map((m) => m.opcode).sort()).toEqual(['A2', 'A6', 'AE', 'B6', 'BE'])
    expect(opcodeFor('LDX', 'zero_page_y')).toBe('B6')
  })

  it('restricts zero_page_y to LDX and STX', () => {
    const users = m6502.instructions
      .filter((i) => i.modes.some((m) => m.name === 'zero_page_y'))
      .map((i) => i.mnemonic)
    expect(users.sort()).toEqual(['LDX', 'STX'])
  })

  it('restricts accumulator mode to the four shift instructions', () => {
    const users = m6502.instructions
      .filter((i) => i.modes.some((m) => m.name === 'accumulator'))
      .map((i) => i.mnemonic)
    expect(users.sort()).toEqual(['ASL', 'LSR', 'ROL', 'ROR'])
  })

  it('restricts indirect mode to JMP', () => {
    const users = m6502.instructions
      .filter((i) => i.modes.some((m) => m.name === 'indirect'))
      .map((i) => i.mnemonic)
    expect(users).toEqual(['JMP'])
  })

  it('penalises indexed reads but never indexed stores or RMW', () => {
    expect(cyclesFor('LDA', 'absolute_x')).toBe('4 (5 on page cross)')
    expect(cyclesFor('LDA', 'indirect_indexed')).toBe('5 (6 on page cross)')
    // stores always pay the fixup, so they are flat
    expect(cyclesFor('STA', 'absolute_x')).toBe('5')
    expect(cyclesFor('STA', 'absolute_y')).toBe('5')
    expect(cyclesFor('STA', 'indirect_indexed')).toBe('6')
    // (zp,X) is never penalised
    expect(cyclesFor('LDA', 'indexed_indirect')).toBe('6')
    // read-modify-write absolute,X is a flat 7
    for (const m of ['ASL', 'LSR', 'ROL', 'ROR', 'INC', 'DEC']) {
      expect(cyclesFor(m, 'absolute_x')).toBe('7')
    }
  })

  it('spells out the branch cycle rule', () => {
    expect(cyclesFor('BNE', 'relative')).toBe('2 (3 if taken, 4 if taken across a page)')
    const branches = m6502.instructions.filter((i) => i.category === 'branch')
    expect(branches).toHaveLength(8)
    for (const b of branches) {
      expect(b.modes).toHaveLength(1)
      expect(b.modes[0]?.name).toBe('relative')
      expect(b.flags).toEqual([])
    }
  })

  it('gets the documented flag sets right', () => {
    expect(get('ADC').flags).toEqual(['N', 'V', 'Z', 'C'])
    expect(get('SBC').flags).toEqual(['N', 'V', 'Z', 'C'])
    expect(get('AND').flags).toEqual(['N', 'Z'])
    expect(get('CMP').flags).toEqual(['N', 'Z', 'C'])
    expect(get('ASL').flags).toEqual(['N', 'Z', 'C'])
    expect(get('BIT').flags).toEqual(['N', 'V', 'Z'])
    expect(get('PLP').flags).toEqual(['N', 'V', 'D', 'I', 'Z', 'C'])
    expect(get('RTI').flags).toEqual(['N', 'V', 'D', 'I', 'Z', 'C'])
    expect(get('TXS').flags).toEqual([])
    expect(get('STA').flags).toEqual([])
  })

  it('documents BRK without inventing a B flag', () => {
    expect(get('BRK').flags).toEqual(['I'])
    expect(get('BRK').description).toMatch(/not a real register flag/)
  })

  it('describes BIT as bit 7 to N and bit 6 to V', () => {
    expect(get('BIT').description).toMatch(/bit 7/)
    expect(get('BIT').description).toMatch(/bit 6/)
  })

  it('warns that decimal mode invalidates N, V and Z on the NMOS part', () => {
    for (const m of ['ADC', 'SBC']) {
      expect(get(m).description).toMatch(/NMOS 6502 the N, V and Z flags are then invalid/)
    }
  })

  it('records the NMOS JMP indirect page-wrap bug', () => {
    expect(get('JMP').description).toMatch(/\$12FF/)
    expect(opcodeFor('JMP', 'indirect')).toBe('6C')
  })

  it('has NOP only as the documented implied $EA', () => {
    expect(get('NOP').modes).toHaveLength(1)
    expect(get('NOP').modes[0]?.opcode).toBe('EA')
    expect(get('NOP').modes[0]?.name).toBe('implicit')
  })

  it('declares the 6502 status register layout', () => {
    expect(m6502.flagBits).toBe('NV-BDIZC')
  })
})
