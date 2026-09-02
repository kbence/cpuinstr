// Generates every instruction set JSON. Run with: npm run build:data
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { buildAppendix, buildSet } from './sets-common.mjs'
import { CATEGORY as CAT_6502, TEXT as TEXT_6502 } from './m6502-text.mjs'
import { CATEGORY as CAT_65C02, MODE_FLAGS, TEXT as TEXT_65C02 } from './m65c02-text.mjs'
import { parseOpcodeTable } from './sets-common.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const p = (...s) => join(here, ...s)

buildSet({
  id: 'm6502',
  name: '6502 (1975)',
  flagBits: 'NV-BDIZC',
  opcodesFile: p('m6502-opcodes.txt'),
  text: TEXT_6502,
  category: CAT_6502,
  expect: { mnemonics: 56, opcodes: 151 },
  source:
    'Transcribed from http://www.oxyron.de/html/opcodes02.html and cross-checked against https://www.masswerk.at/6502/6502_instruction_set.html',
  out: p('../src/data/sets/m6502.json'),
})

// The 65C02 keeps all 56 NMOS mnemonics, so it inherits their flags and only
// declares the 8 new ones in its own opcode table.
const inherited = parseOpcodeTable(p('m6502-opcodes.txt')).flags

buildSet({
  id: 'm65c02',
  name: '65C02 (1983)',
  flagBits: 'NV-BDIZC',
  opcodesFile: p('m65c02-opcodes.txt'),
  text: TEXT_65C02,
  category: CAT_65C02,
  modeFlags: MODE_FLAGS,
  flags: inherited,
  expect: { mnemonics: 64, opcodes: 178 },
  source:
    'Transcribed from https://www.oxyron.de/html/opcodesc02.html (base CMOS 65C02; the 34 WDC/Rockwell-only opcodes and the 44 defined-as-NOP cells are excluded) and cross-checked against https://6502.org/tutorials/65c02opcodes.html',
  out: p('../src/data/sets/m65c02.json'),
})

buildAppendix({
  id: 'm6502',
  opcodesFile: p('m6502-undocumented.txt'),
  note:
    'The 105 opcodes of 256 that MOS never documented. They are not part of the instruction set: behaviour varies by chip and batch, seven are explicitly unstable, and the twelve KIL opcodes hang the processor until reset. Listed for disassembly and emulator work only.',
  expect: { opcodes: 105 },
  source:
    'Transcribed from the shaded cells of http://www.oxyron.de/html/opcodes02.html, with that page\'s per-mnemonic function column and per-opcode stability markers',
  out: p('../src/data/undocumented/m6502.json'),
})
