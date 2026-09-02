import { describe, expect, it } from 'vitest'
import nmos from '../data/sets/m6502.json'
import cmos from '../data/sets/m65c02.json'
import { diffSets } from './diff'
import type { InstructionSet } from './types'

const m6502 = nmos as InstructionSet
const m65c02 = cmos as InstructionSet

describe('diffSets — 65C02 against the NMOS 6502', () => {
  const d = diffSets(m65c02, m6502)

  it('reports the 8 added mnemonics and nothing removed', () => {
    expect(d.addedMnemonics).toEqual(['BRA', 'PHX', 'PHY', 'PLX', 'PLY', 'STZ', 'TRB', 'TSB'])
    expect(d.removedMnemonics).toEqual([])
  })

  it('reports 27 added opcodes and none removed', () => {
    expect(d.addedOpcodes).toHaveLength(27)
    expect(d.removedOpcodes).toEqual([])
    expect(d.addedOpcodes).toContain('89') // BIT #imm
    expect(d.addedOpcodes).toContain('7C') // JMP (abs,X)
    expect(d.addedOpcodes).toContain('1A') // INC A
  })

  it('flags the JMP indirect cycle change caused by the bug fix', () => {
    const c = d.changedOpcodes.find((x) => x.opcode === '6C')
    expect(c?.fields).toEqual(['cycles'])
    expect(c?.from.mode.cycles).toBe('6')
    expect(c?.to.mode.cycles).toBe('5')
  })

  it('flags the read-modify-write absolute,X optimisation', () => {
    for (const opcode of ['1E', '5E', '3E', '7E']) {
      const c = d.changedOpcodes.find((x) => x.opcode === opcode)
      expect(c?.fields).toEqual(['cycles'])
      expect(c?.to.mode.cycles).toBe('7')
      expect(c?.from.mode.cycles).toBe('6 (7 on page cross)')
    }
  })

  it('marks every affected mnemonic as touched, and leaves untouched ones alone', () => {
    expect(d.touchedMnemonics.has('BIT')).toBe(true)
    expect(d.touchedMnemonics.has('JMP')).toBe(true)
    expect(d.touchedMnemonics.has('BRA')).toBe(true)
    expect(d.touchedMnemonics.has('TAX')).toBe(false)
    expect(d.touchedMnemonics.has('SEI')).toBe(false)
  })
})

describe('diffSets — the other direction', () => {
  const d = diffSets(m6502, m65c02)

  it('mirrors added and removed', () => {
    expect(d.addedMnemonics).toEqual([])
    expect(d.removedMnemonics).toEqual(
      ['BRA', 'PHX', 'PHY', 'PLX', 'PLY', 'STZ', 'TRB', 'TSB'],
    )
    expect(d.addedOpcodes).toEqual([])
    expect(d.removedOpcodes).toHaveLength(27)
  })

  it('reports the same changed opcodes, with from and to swapped', () => {
    const c = d.changedOpcodes.find((x) => x.opcode === '6C')
    expect(c?.from.mode.cycles).toBe('5')
    expect(c?.to.mode.cycles).toBe('6')
  })
})

describe('diffSets — a set against itself', () => {
  it('finds nothing', () => {
    const d = diffSets(m6502, m6502)
    expect(d.addedMnemonics).toEqual([])
    expect(d.removedMnemonics).toEqual([])
    expect(d.addedOpcodes).toEqual([])
    expect(d.removedOpcodes).toEqual([])
    expect(d.changedOpcodes).toEqual([])
    expect(d.touchedMnemonics.size).toBe(0)
  })
})
