// Base CMOS 65C02. The 56 NMOS mnemonics inherit their prose from m6502-text.mjs;
// OVERRIDE replaces the ones whose behaviour actually changed, and NEW_TEXT adds
// the 8 mnemonics the CMOS part introduces.
import { CATEGORY as CATEGORY_6502, TEXT as TEXT_6502 } from './m6502-text.mjs'

export const CATEGORY = {
  ...CATEGORY_6502,
  load_store: `${CATEGORY_6502.load_store} STZ`,
  stack: `${CATEGORY_6502.stack} PHX PHY PLX PLY`,
  logic: `${CATEGORY_6502.logic} TRB TSB`,
  branch: `${CATEGORY_6502.branch} BRA`,
}

/** Flags inherited unchanged; the 8 new mnemonics come from the opcode table. */
export const FLAGS_INHERITED = {}

const NEW_TEXT = {
  BRA: {
    summary: 'Branch always.',
    description:
      'Adds the signed 8-bit offset to the program counter unconditionally. Unlike JMP it is relocatable and one byte shorter, which is why position-independent CMOS code prefers it; the trade-off is the ±127-byte reach. No flags change.',
    examples: ['BRA loop     ; unconditional, relative'],
  },
  PHX: {
    summary: 'Push the X register onto the stack.',
    description:
      'Writes X to the stack page and decrements the stack pointer. On the NMOS 6502 this needed TXA/PHA, which clobbered A. No flags change.',
    examples: ['PHX\nPHY         ; save both index registers'],
  },
  PHY: {
    summary: 'Push the Y register onto the stack.',
    description:
      'Writes Y to the stack page and decrements the stack pointer, without going through A as the NMOS part had to. No flags change.',
    examples: ['PHY'],
  },
  PLX: {
    summary: 'Pull the X register from the stack.',
    description:
      'Increments the stack pointer and loads X from the stack. N and Z are set from the pulled byte.',
    examples: ['PLY\nPLX         ; restore in reverse order'],
  },
  PLY: {
    summary: 'Pull the Y register from the stack.',
    description:
      'Increments the stack pointer and loads Y from the stack. N and Z are set from the pulled byte.',
    examples: ['PLY'],
  },
  STZ: {
    summary: 'Store zero into memory.',
    description:
      'Writes $00 to the addressed location without needing a register held at zero, so clearing memory no longer costs an LDA #$00 or disturbs A. No flags change.',
    examples: ['STZ $0400', 'STZ $0400,X  ; clear a table without touching A'],
  },
  TRB: {
    summary: 'Test and reset bits in memory.',
    description:
      'Clears every bit of the addressed byte that is set in A, writing the result back — a read-modify-write AND with the complement of A. Z is set from the AND of A and the *original* value, so it reports whether any of the tested bits had been set. N and V are unaffected, unlike BIT.',
    examples: ['LDA #$80\nTRB $D011    ; clear bit 7, Z says whether it was set'],
  },
  TSB: {
    summary: 'Test and set bits in memory.',
    description:
      'Sets every bit of the addressed byte that is set in A, writing the result back — a read-modify-write OR with A. As with TRB, Z is set from the AND of A and the original value, so one instruction both sets a flag bit and reports its previous state.',
    examples: ['LDA #$01\nTSB $0300    ; claim a lock bit, Z says if it was free'],
  },
}

const DECIMAL_CMOS =
  'On the 65C02 the N and Z flags are valid in decimal mode (unlike the NMOS part, where they are undefined), and the instruction takes one extra cycle when D is set. V still has no useful meaning in BCD, which is unsigned.'

const OVERRIDE = {
  ADC: {
    summary: TEXT_6502.ADC.summary,
    description:
      'Adds the operand and the current carry flag to A and stores the result in A. Carry is read in before the addition and written out from the result, so chained ADCs form multi-byte addition. V is set when the signed result overflows (both inputs same sign, result the other). ' +
      DECIMAL_CMOS,
    examples: [...TEXT_6502.ADC.examples, 'ADC ($10)    ; new zero-page indirect mode'],
  },
  SBC: {
    summary: TEXT_6502.SBC.summary,
    description:
      'Computes A minus the operand minus the complement of the carry flag. Carry acts as not-borrow: with C set, SBC subtracts just the operand, so SEC precedes the first SBC of a subtraction. V is set on signed overflow. ' +
      DECIMAL_CMOS,
    examples: TEXT_6502.SBC.examples,
  },
  BIT: {
    summary: TEXT_6502.BIT.summary,
    description:
      'Sets Z from A AND the operand, but discards the result — A is not modified. N is loaded from bit 7 of the operand and V from bit 6, independently of A. The 65C02 adds zero page,X, absolute,X and immediate modes; BIT #imm is the one exception to the rule that a mnemonic affects the same flags in every mode — it sets Z alone, leaving N and V untouched, because an immediate operand has no meaningful status bits to report.',
    examples: [
      'BIT $D011    ; N = bit 7, V = bit 6, Z = (A & value) == 0',
      'BIT #$03     ; 65C02 only: sets Z alone',
    ],
  },
  JMP: {
    summary: TEXT_6502.JMP.summary,
    description:
      'Loads the program counter with the target address. The NMOS bug where JMP ($12FF) fetched its high byte from $1200 is fixed here, at the cost of one extra cycle (indirect JMP is 6 cycles, not 5). The 65C02 also adds an absolute indexed indirect mode, JMP ($nnnn,X), which reads the target from a jump table indexed by X.',
    examples: ['JMP $C000', 'JMP ($0300)    ; page-boundary safe on CMOS', 'JMP ($0300,X)  ; jump table'],
  },
  INC: {
    summary: TEXT_6502.INC.summary,
    description:
      'Adds one to the operand and writes it back, wrapping $FF to $00. N and Z reflect the new value; C is not affected. The 65C02 adds accumulator mode, so INC A increments A directly instead of needing CLC/ADC #$01.',
    examples: ['INC $10', 'INC A        ; 65C02 only'],
  },
  DEC: {
    summary: TEXT_6502.DEC.summary,
    description:
      'Subtracts one from the operand and writes it back, wrapping $00 to $FF. N and Z reflect the new value; C is untouched, so DEC cannot report the borrow. The 65C02 adds accumulator mode, so DEC A decrements A directly.',
    examples: ['DEC $10', 'DEC A        ; 65C02 only'],
  },
  NOP: {
    summary: TEXT_6502.NOP.summary,
    description:
      'Does nothing for two cycles and affects no register or flag. $EA is the documented NOP. The CMOS part also guarantees that the 44 opcodes left unused by this variant behave as NOPs rather than as the NMOS undocumented instructions, but they are not part of the documented set and are excluded here.',
    examples: ['NOP'],
  },
  ASL: {
    summary: TEXT_6502.ASL.summary,
    description:
      'Shifts the operand left by one bit. Bit 7 moves into C and bit 0 becomes 0, so the operation is an unsigned multiply by two. The CMOS part optimises read-modify-write absolute,X: it costs 6 cycles rather than the NMOS flat 7, plus one when the address crosses a page.',
    examples: TEXT_6502.ASL.examples,
  },
}

export const TEXT = { ...TEXT_6502, ...OVERRIDE, ...NEW_TEXT }

/**
 * Per-mode flag overrides. BIT is the only instruction in the family that does
 * not affect the same flags in all of its addressing modes.
 */
export const MODE_FLAGS = {
  BIT: { immediate: ['Z'] },
}
