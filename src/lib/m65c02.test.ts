import { describe, expect, it } from 'vitest'
import nmos from '../data/sets/m6502.json'
import cmos from '../data/sets/m65c02.json'
import { instructionToMarkdown } from './markdown'
import type { InstructionSet, ModeName } from './types'

const m6502 = nmos as InstructionSet
const m65c02 = cmos as InstructionSet

const byMnemonic = new Map(m65c02.instructions.map((i) => [i.mnemonic, i]))
const get = (m: string) => {
  const i = byMnemonic.get(m)
  if (!i) throw new Error(`${m} missing`)
  return i
}
const opcodeFor = (m: string, mode: ModeName) => get(m).modes.find((x) => x.name === mode)?.opcode
const cyclesFor = (m: string, mode: ModeName) => get(m).modes.find((x) => x.name === mode)?.cycles
const users = (mode: ModeName) =>
  m65c02.instructions.filter((i) => i.modes.some((m) => m.name === mode)).map((i) => i.mnemonic)

describe('m65c02 dataset invariants', () => {
  it('has 64 mnemonics and 178 documented opcodes', () => {
    expect(m65c02.instructions).toHaveLength(64)
    expect(m65c02.instructions.flatMap((i) => i.modes)).toHaveLength(178)
  })

  it('has set-wide unique opcodes', () => {
    const ops = m65c02.instructions.flatMap((i) => i.modes.map((m) => m.opcode))
    expect(new Set(ops).size).toBe(ops.length)
  })

  it('gives every instruction a canonical id in its own namespace', () => {
    for (const i of m65c02.instructions) expect(i.id).toBe(`m65c02.${i.mnemonic.toLowerCase()}`)
  })

  it('never lists B as an affected flag', () => {
    for (const i of m65c02.instructions) {
      expect(i.flags).not.toContain('B')
      for (const m of i.modes) expect(m.flags ?? []).not.toContain('B')
    }
  })
})

describe('m65c02 relative to the NMOS 6502', () => {
  it('keeps every NMOS mnemonic and adds exactly 8', () => {
    const nmosNames = m6502.instructions.map((i) => i.mnemonic)
    const cmosNames = m65c02.instructions.map((i) => i.mnemonic)
    expect(nmosNames.filter((n) => !cmosNames.includes(n))).toEqual([])
    expect(cmosNames.filter((n) => !nmosNames.includes(n)).sort()).toEqual(
      ['BRA', 'PHX', 'PHY', 'PLX', 'PLY', 'STZ', 'TRB', 'TSB'],
    )
  })

  it('keeps every NMOS opcode assigned to the same mnemonic and mode', () => {
    const cmosByOpcode = new Map(
      m65c02.instructions.flatMap((i) => i.modes.map((m) => [m.opcode, `${i.mnemonic} ${m.name}`])),
    )
    for (const i of m6502.instructions) {
      for (const m of i.modes) {
        expect(cmosByOpcode.get(m.opcode)).toBe(`${i.mnemonic} ${m.name}`)
      }
    }
  })

  it('adds 27 opcodes over the NMOS 151', () => {
    expect(178 - 151).toBe(27)
    const nmosOps = new Set(m6502.instructions.flatMap((i) => i.modes.map((m) => m.opcode)))
    const added = m65c02.instructions
      .flatMap((i) => i.modes.map((m) => m.opcode))
      .filter((o) => !nmosOps.has(o))
    expect(added).toHaveLength(27)
  })
})

describe('m65c02 new addressing modes', () => {
  it('adds (zp) to the eight accumulator-operand instructions', () => {
    expect(users('indirect_zero_page').sort()).toEqual(
      ['ADC', 'AND', 'CMP', 'EOR', 'LDA', 'ORA', 'SBC', 'STA'],
    )
  })

  it('adds JMP (abs,X) at $7C only', () => {
    expect(users('absolute_indexed_indirect')).toEqual(['JMP'])
    expect(opcodeFor('JMP', 'absolute_indexed_indirect')).toBe('7C')
  })

  it('adds accumulator mode to INC and DEC', () => {
    expect(users('accumulator').sort()).toEqual(['ASL', 'DEC', 'INC', 'LSR', 'ROL', 'ROR'])
    expect(opcodeFor('INC', 'accumulator')).toBe('1A')
    expect(opcodeFor('DEC', 'accumulator')).toBe('3A')
  })

  it('gives BIT three new modes, for five in total', () => {
    expect(get('BIT').modes.map((m) => m.name).sort()).toEqual(
      ['absolute', 'absolute_x', 'immediate', 'zero_page', 'zero_page_x'],
    )
    expect(opcodeFor('BIT', 'immediate')).toBe('89')
  })

  it('still restricts zero_page_y to LDX and STX', () => {
    expect(users('zero_page_y').sort()).toEqual(['LDX', 'STX'])
  })
})

describe('m65c02 per-mode flags', () => {
  it('makes BIT #imm affect Z alone, unlike every other BIT mode', () => {
    const bit = get('BIT')
    expect(bit.flags).toEqual(['N', 'V', 'Z'])
    const imm = bit.modes.find((m) => m.name === 'immediate')
    expect(imm?.flags).toEqual(['Z'])
    for (const m of bit.modes.filter((m) => m.name !== 'immediate')) {
      expect(m.flags).toBeUndefined()
    }
  })

  it('is the only instruction in the set with a per-mode override', () => {
    const overridden = m65c02.instructions
      .filter((i) => i.modes.some((m) => m.flags))
      .map((i) => i.mnemonic)
    expect(overridden).toEqual(['BIT'])
  })

  it('renders the divergence as a Flags column in the markdown export', () => {
    const md = instructionToMarkdown(get('BIT'), m65c02.name)
    expect(md).toContain('| Mode | Syntax | Opcode | Bytes | Cycles | Flags |')
    expect(md).toContain('| immediate | `BIT #<imm8>` | `$89` | 2 | 2 | Z |')
    expect(md).toContain('| zero page | `BIT <zp>` | `$24` | 2 | 3 | N V Z |')
  })

  it('omits the Flags column for an instruction with uniform flags', () => {
    expect(instructionToMarkdown(get('LDA'), m65c02.name)).not.toContain('| Flags |')
  })
})

describe('m65c02 documented cycle and behaviour changes', () => {
  it('charges the fixed JMP indirect bug an extra cycle', () => {
    expect(cyclesFor('JMP', 'indirect')).toBe('6')
    const nmosJmp = m6502.instructions.find((i) => i.mnemonic === 'JMP')!
    expect(nmosJmp.modes.find((m) => m.name === 'indirect')?.cycles).toBe('5')
    expect(get('JMP').description).toMatch(/is fixed here/)
  })

  it('optimises read-modify-write absolute,X from a flat 7 to 6 plus a page cross', () => {
    for (const m of ['ASL', 'LSR', 'ROL', 'ROR']) {
      expect(cyclesFor(m, 'absolute_x')).toBe('6 (7 on page cross)')
    }
  })

  it('says the decimal-mode flags are now valid, unlike the NMOS part', () => {
    for (const m of ['ADC', 'SBC']) {
      expect(get(m).description).toMatch(/N and Z flags are valid in decimal mode/)
      expect(get(m).description).not.toMatch(/are then invalid/)
    }
  })

  it('categorises the new mnemonics', () => {
    expect(get('BRA').category).toBe('branch')
    expect(get('STZ').category).toBe('load_store')
    expect(get('TRB').category).toBe('logic')
    expect(get('TSB').category).toBe('logic')
    for (const m of ['PHX', 'PHY', 'PLX', 'PLY']) expect(get(m).category).toBe('stack')
  })

  it('gets the new mnemonics’ flags right', () => {
    expect(get('BRA').flags).toEqual([])
    expect(get('PHX').flags).toEqual([])
    expect(get('PLX').flags).toEqual(['N', 'Z'])
    expect(get('PLY').flags).toEqual(['N', 'Z'])
    expect(get('STZ').flags).toEqual([])
    expect(get('TRB').flags).toEqual(['Z'])
    expect(get('TSB').flags).toEqual(['Z'])
  })

  it('excludes the WDC and Rockwell vendor extensions', () => {
    const names = m65c02.instructions.map((i) => i.mnemonic)
    for (const m of ['STP', 'WAI', 'RMB0', 'SMB0', 'BBR0', 'BBS0']) {
      expect(names).not.toContain(m)
    }
  })
})
