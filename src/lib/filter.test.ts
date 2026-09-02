import { describe, expect, it } from 'vitest'
import set from '../data/sets/m6502.json'
import { countOpcodes, filterInstructions, matches, sortInstructions } from './filter'
import type { Instruction, InstructionSet } from './types'

const all = (set as InstructionSet).instructions
const names = (list: readonly Instruction[]) => list.map((i) => i.mnemonic)
const find = (q: string) => names(filterInstructions(all, q)).sort()

describe('filterInstructions', () => {
  it('returns everything for an empty or whitespace query', () => {
    expect(filterInstructions(all, '')).toHaveLength(56)
    expect(filterInstructions(all, '   ')).toHaveLength(56)
  })

  it('matches mnemonics case-insensitively', () => {
    expect(find('lda')).toEqual(['LDA'])
    expect(find('LDA')).toEqual(['LDA'])
  })

  it('matches on opcode byte', () => {
    expect(find('a9')).toContain('LDA')
    expect(find('6c')).toContain('JMP')
  })

  it('matches on addressing mode, with or without underscores', () => {
    expect(find('zero_page_y')).toEqual(['LDX', 'STX'])
    expect(find('zero page y')).toEqual(['LDX', 'STX'])
    expect(find('indexed_indirect')).toEqual(
      ['ADC', 'AND', 'CMP', 'EOR', 'LDA', 'ORA', 'SBC', 'STA'],
    )
    expect(find('indexed indirect')).toEqual(find('indexed_indirect'))
  })

  it('searches descriptions too, so prose words match more widely than mode names', () => {
    // "accumulator" is a mode name on 4 instructions but appears in the prose of
    // many more. Matching description text is the specified behaviour.
    expect(find('accumulator').length).toBeGreaterThan(4)
    expect(find('accumulator')).toContain('ASL')
    expect(find('accumulator')).toContain('LDA')
  })

  it('matches on operand syntax in both spellings', () => {
    expect(find('(<zp>),Y')).toEqual(find('($nn),Y'))
    expect(find('($nn),Y')).toEqual(
      ['ADC', 'AND', 'CMP', 'EOR', 'LDA', 'ORA', 'SBC', 'STA'],
    )
    expect(find('#<imm8>')).toContain('LDA')
  })

  it('matches on description text', () => {
    expect(find('bit 6')).toEqual(['BIT'])
    expect(find('carry')).toContain('ADC')
    expect(find('carry')).toContain('CLC')
    expect(find('not-borrow')).toEqual(['SBC', 'SEC'])
  })

  it('matches on category', () => {
    expect(find('load_store')).toEqual(['LDA', 'LDX', 'LDY', 'STA', 'STX', 'STY'])
    expect(find('load store')).toEqual(['LDA', 'LDX', 'LDY', 'STA', 'STX', 'STY'])
  })

  it('returns nothing for a query that matches nothing', () => {
    expect(find('zzzz')).toEqual([])
    // ASR is not a 6502 mnemonic and must not have crept in as an alias
    expect(find('asr')).toEqual([])
  })

  it('never lists B as a searchable flag hit via the flags field', () => {
    for (const i of all) expect(i.flags).not.toContain('B')
  })
})

describe('matches', () => {
  it('is the single-instruction form of the filter', () => {
    const lda = all.find((i) => i.mnemonic === 'LDA')!
    expect(matches(lda, 'lda')).toBe(true)
    expect(matches(lda, 'indexed_indirect')).toBe(true)
    expect(matches(lda, 'zero_page_y')).toBe(false)
    expect(matches(lda, 'zzzz')).toBe(false)
    expect(matches(lda, '')).toBe(true)
  })
})

describe('sortInstructions', () => {
  it('sorts by mnemonic A→Z by default', () => {
    const sorted = names(sortInstructions(all, 'mnemonic'))
    expect(sorted[0]).toBe('ADC')
    expect(sorted.at(-1)).toBe('TYA')
    expect(sorted).toEqual([...sorted].sort())
  })

  it('sorts by category, then mnemonic within a category', () => {
    const sorted = sortInstructions(all, 'category')
    const cats = sorted.map((i) => i.category)
    expect(cats).toEqual([...cats].sort())
    const branch = sorted.filter((i) => i.category === 'branch').map((i) => i.mnemonic)
    expect(branch).toEqual(['BCC', 'BCS', 'BEQ', 'BMI', 'BNE', 'BPL', 'BVC', 'BVS'])
  })

  it('does not mutate its input', () => {
    const before = names(all)
    sortInstructions(all, 'category')
    expect(names(all)).toEqual(before)
  })
})

describe('countOpcodes', () => {
  it('counts every mode of every instruction', () => {
    expect(countOpcodes(all)).toBe(151)
    expect(countOpcodes(filterInstructions(all, 'lda'))).toBe(8)
    expect(countOpcodes([])).toBe(0)
  })
})
