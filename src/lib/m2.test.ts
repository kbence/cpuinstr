import { describe, expect, it } from 'vitest'
import set from '../data/sets/m6502.json'
import { instructionToMarkdown, modeLabel } from './markdown'
import { readUrl, writeUrl } from './urlState'
import type { InstructionSet } from './types'

const m6502 = set as InstructionSet
const lda = m6502.instructions.find((i) => i.mnemonic === 'LDA')!
const bne = m6502.instructions.find((i) => i.mnemonic === 'BNE')!

describe('readUrl', () => {
  it('reads an empty query string as no selection and no search', () => {
    expect(readUrl('')).toEqual({ archId: null, variantId: null, query: '' })
    expect(readUrl('?')).toEqual({ archId: null, variantId: null, query: '' })
  })

  it('reads arch, variant and q', () => {
    expect(readUrl('?arch=m6502&variant=m6502&q=lda')).toEqual({
      archId: 'm6502',
      variantId: 'm6502',
      query: 'lda',
    })
  })

  it('decodes a query containing punctuation', () => {
    expect(readUrl('?q=%28%24nn%29%2CY').query).toBe('($nn),Y')
  })

  it('tolerates unknown and duplicate params', () => {
    expect(readUrl('?bogus=1&q=bit+6').query).toBe('bit 6')
  })
})

describe('writeUrl', () => {
  const s = (query: string) => ({ archId: 'z80', variantId: 'z80a', query })

  it('omits the default pair so the bare URL stays clean', () => {
    expect(writeUrl(s(''), true)).toBe('')
    expect(writeUrl(s('lda'), true)).toBe('?q=lda')
  })

  it('writes a non-default pair', () => {
    expect(writeUrl(s(''), false)).toBe('?arch=z80&variant=z80a')
  })

  it('trims the query and drops it when blank', () => {
    expect(writeUrl(s('   '), true)).toBe('')
    expect(writeUrl(s('  lda  '), true)).toBe('?q=lda')
  })

  it('round-trips through readUrl', () => {
    const url = writeUrl(s('($nn),Y'), false)
    expect(readUrl(url)).toEqual({ archId: 'z80', variantId: 'z80a', query: '($nn),Y' })
  })
})

describe('instructionToMarkdown', () => {
  it('renders a heading, metadata, description and one table row per mode', () => {
    const md = instructionToMarkdown(lda, '6502 (1975)')
    expect(md).toContain('## LDA — Load a byte into the accumulator.')
    expect(md).toContain('*6502 (1975) · load_store · flags N Z*')
    expect(md).toContain('| Mode | Syntax | Opcode | Bytes | Cycles |')
    const bodyRows = md.split('\n').filter((l) => l.startsWith('| ') && l.includes('`$'))
    expect(bodyRows).toHaveLength(8)
    expect(md).toContain('| immediate | `LDA #<imm8>` | `$A9` | 2 | 2 |')
    expect(md).toContain('| (indirect),Y | `LDA (<zp>),Y` | `$B1` | 2 | 5 (6 on page cross) |')
  })

  it('omits the operand for single-byte modes', () => {
    const nop = m6502.instructions.find((i) => i.mnemonic === 'NOP')!
    expect(instructionToMarkdown(nop, 'x')).toContain('| implied | `NOP` | `$EA` | 1 | 2 |')
  })

  it('says "none" rather than leaving flags blank', () => {
    expect(instructionToMarkdown(bne, 'x')).toContain('flags none*')
  })

  it('fences the examples as asm', () => {
    const md = instructionToMarkdown(lda, 'x')
    expect(md).toContain('```asm')
    expect(md.trimEnd().endsWith('```')).toBe(true)
  })
})

describe('modeLabel', () => {
  it('maps the vocabulary to assembly-style names', () => {
    expect(modeLabel('indexed_indirect')).toBe('(indirect,X)')
    expect(modeLabel('indirect_indexed')).toBe('(indirect),Y')
    expect(modeLabel('implicit')).toBe('implied')
  })

  it('falls back to the raw name for anything unmapped', () => {
    expect(modeLabel('future_mode')).toBe('future_mode')
  })
})
