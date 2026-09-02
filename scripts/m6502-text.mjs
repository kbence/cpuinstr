// Per-mnemonic prose for the NMOS 6502. Opcodes/modes/cycles/flags come from
// m6502-opcodes.txt; this file only holds category + human text.
// Flag wording checked against plan/05-6502.md (in particular: `B` is not a
// register bit, and decimal mode invalidates N/V/Z on the NMOS part).

export const CATEGORY = {
  load_store: 'LDA LDX LDY STA STX STY',
  transfer: 'TAX TAY TSX TXA TXS TYA',
  stack: 'PHA PHP PLA PLP',
  arithmetic: 'ADC SBC CMP CPX CPY INC INX INY DEC DEX DEY',
  logic: 'AND ORA EOR BIT',
  shift: 'ASL LSR ROL ROR',
  branch: 'BCC BCS BEQ BMI BNE BPL BVC BVS',
  jump: 'JMP JSR RTS',
  flag: 'CLC CLD CLI CLV SEC SED SEI',
  system: 'BRK NOP RTI',
}

const DECIMAL_NOTE =
  'When the decimal flag D is set the result is computed in BCD; on the NMOS 6502 the N, V and Z flags are then invalid — Z does not reliably match the accumulator.'

export const TEXT = {
  ADC: {
    summary: 'Add memory to the accumulator with carry.',
    description:
      'Adds the operand and the current carry flag to A and stores the result in A. Carry is read *in* before the addition and written *out* from the result, so chained ADCs form multi-byte addition. V is set when the signed result overflows (both inputs same sign, result the other). ' +
      DECIMAL_NOTE,
    examples: ['CLC\nADC #$01    ; A = A + 1', 'CLC\nADC $10\nADC $11    ; 16-bit add, low byte then high'],
  },
  AND: {
    summary: 'Bitwise AND of memory into the accumulator.',
    description:
      'Replaces A with A AND the operand. Used to clear selected bits with a mask. N takes bit 7 of the result and Z is set when the result is zero; C and V are untouched.',
    examples: ['AND #$0F    ; keep the low nibble'],
  },
  ASL: {
    summary: 'Shift left one bit, into carry.',
    description:
      'Shifts the operand left by one bit. Bit 7 moves into C and bit 0 becomes 0, so the operation is an unsigned multiply by two. Operates on A in accumulator mode, otherwise read-modify-write on memory.',
    examples: ['ASL A       ; A = A * 2', 'ASL $10     ; double the byte at $10'],
  },
  BCC: { summary: 'Branch if carry clear (C = 0).', description: 'Adds the signed 8-bit offset to the program counter when C is clear. After CMP, this means "less than" for unsigned values. No flags change.', examples: ['CMP #$10\nBCC lower   ; taken if A < $10'] },
  BCS: { summary: 'Branch if carry set (C = 1).', description: 'Adds the signed 8-bit offset to the program counter when C is set. After CMP, this means "greater than or equal" for unsigned values. No flags change.', examples: ['CMP #$10\nBCS higher  ; taken if A >= $10'] },
  BEQ: { summary: 'Branch if equal (Z = 1).', description: 'Branches when the zero flag is set — typically after a comparison that matched, or an operation whose result was zero. No flags change.', examples: ['CMP #$41\nBEQ isA'] },
  BIT: {
    summary: 'Test bits in memory against the accumulator.',
    description:
      'Sets Z from A AND the operand, but discards the result — A is not modified. Independently of A, N is loaded from bit 7 of the operand and V from bit 6, which makes BIT the usual way to poll two hardware status bits in one instruction. This is the same on the NMOS 6502 and the 65C02.',
    examples: ['BIT $D011   ; N = bit 7, V = bit 6, Z = (A & value) == 0'],
  },
  BMI: { summary: 'Branch if minus (N = 1).', description: 'Branches when the negative flag is set, i.e. bit 7 of the last result was 1. No flags change.', examples: ['BMI negative'] },
  BNE: { summary: 'Branch if not equal (Z = 0).', description: 'Branches when the zero flag is clear. The standard loop-again test after a DEX/DEY/INC. No flags change.', examples: ['DEX\nBNE loop'] },
  BPL: { summary: 'Branch if plus (N = 0).', description: 'Branches when the negative flag is clear, i.e. bit 7 of the last result was 0. No flags change.', examples: ['BPL positive'] },
  BRK: {
    summary: 'Force a software interrupt.',
    description:
      'Pushes the program counter (already incremented past the padding byte that follows BRK) and then the status byte, sets I to mask further IRQs, and jumps through the IRQ vector at $FFFE/$FFFF. The status byte is pushed with the break bit set, which is how an interrupt handler distinguishes BRK from a hardware IRQ — that bit is not a real register flag, so it is not listed under the affected flags here.',
    examples: ['BRK\n.byte $00   ; BRK skips the following byte'],
  },
  BVC: { summary: 'Branch if overflow clear (V = 0).', description: 'Branches when the overflow flag is clear. No flags change.', examples: ['BVC noOverflow'] },
  BVS: { summary: 'Branch if overflow set (V = 1).', description: 'Branches when the overflow flag is set — after signed arithmetic, or from the external SO pin. No flags change.', examples: ['BVS overflowed'] },
  CLC: { summary: 'Clear the carry flag.', description: 'Sets C to 0. Required before the first ADC of an addition so no stale carry is added in.', examples: ['CLC\nADC #$01'] },
  CLD: { summary: 'Clear the decimal flag.', description: 'Sets D to 0, so ADC and SBC compute in binary. D is not defined after reset, so well-behaved code clears it during startup.', examples: ['CLD         ; binary arithmetic'] },
  CLI: { summary: 'Clear the interrupt disable flag.', description: 'Sets I to 0, allowing maskable IRQs to be serviced again.', examples: ['CLI         ; enable IRQs'] },
  CLV: { summary: 'Clear the overflow flag.', description: 'Sets V to 0. The only instruction that clears V directly; V is otherwise written by ADC, SBC, BIT, PLP and RTI, or by the SO pin.', examples: ['CLV'] },
  CMP: { summary: 'Compare memory with the accumulator.', description: 'Computes A minus the operand and sets the flags from the result, discarding it — A is unchanged. C is set when A is greater than or equal to the operand (unsigned), Z when they are equal, and N from bit 7 of the difference.', examples: ['CMP #$80\nBCS atLeast80'] },
  CPX: { summary: 'Compare memory with the X register.', description: 'Computes X minus the operand and sets N, Z and C from the result without storing it. Same flag rules as CMP.', examples: ['CPX #$10\nBNE notTen'] },
  CPY: { summary: 'Compare memory with the Y register.', description: 'Computes Y minus the operand and sets N, Z and C from the result without storing it. Same flag rules as CMP.', examples: ['CPY #$28\nBCC inRange'] },
  DEC: { summary: 'Decrement a memory location by one.', description: 'Subtracts one from the addressed byte and writes it back, wrapping $00 to $FF. N and Z reflect the new value; C is untouched, so DEC cannot be used to detect the borrow.', examples: ['DEC $10'] },
  DEX: { summary: 'Decrement the X register by one.', description: 'Subtracts one from X, wrapping $00 to $FF, and sets N and Z from the result. The usual countdown for a loop closed by BNE.', examples: ['LDX #$08\nloop: DEX\nBNE loop'] },
  DEY: { summary: 'Decrement the Y register by one.', description: 'Subtracts one from Y, wrapping $00 to $FF, and sets N and Z from the result.', examples: ['DEY\nBPL loop'] },
  EOR: { summary: 'Bitwise exclusive-OR of memory into the accumulator.', description: 'Replaces A with A XOR the operand — the standard way to flip selected bits, or to invert A entirely with EOR #$FF. N takes bit 7 of the result, Z is set when the result is zero.', examples: ['EOR #$FF    ; one’s complement of A'] },
  INC: { summary: 'Increment a memory location by one.', description: 'Adds one to the addressed byte and writes it back, wrapping $FF to $00. N and Z reflect the new value; C is not affected.', examples: ['INC $10'] },
  INX: { summary: 'Increment the X register by one.', description: 'Adds one to X, wrapping $FF to $00, and sets N and Z from the result.', examples: ['INX\nCPX #$10\nBNE loop'] },
  INY: { summary: 'Increment the Y register by one.', description: 'Adds one to Y, wrapping $FF to $00, and sets N and Z from the result.', examples: ['INY'] },
  JMP: {
    summary: 'Jump to a new address.',
    description:
      'Loads the program counter with the target address. In indirect mode the target is read from the word stored at the given address. NMOS bug: if that address ends in $FF the high byte is fetched from the start of the same page rather than the next one — JMP ($12FF) reads its high byte from $1200. Fixed on the 65C02.',
    examples: ['JMP $C000', 'JMP ($0300)  ; vectored jump'],
  },
  JSR: { summary: 'Jump to a subroutine.', description: 'Pushes the address of the last byte of the JSR instruction onto the stack, high byte first, then loads the program counter with the target. RTS pops that address and adds one to resume. No flags change.', examples: ['JSR init'] },
  LDA: { summary: 'Load a byte into the accumulator.', description: 'Loads the operand into A, overwriting the previous value. N is taken from bit 7 of the loaded byte and Z is set when it is zero; no other flag changes.', examples: ['LDA #$1A     ; load immediate 26', 'LDA ($08,X)  ; indexed indirect: pointer at $08+X in page 0', 'LDA ($08),Y  ; indirect indexed: pointer at $08, then +Y'] },
  LDX: { summary: 'Load a byte into the X index register.', description: 'Loads the operand into X. N takes bit 7 of the loaded byte and Z is set when it is zero. LDX is one of only two instructions with a zero-page,Y mode.', examples: ['LDX #$00', 'LDX $10,Y'] },
  LDY: { summary: 'Load a byte into the Y index register.', description: 'Loads the operand into Y. N takes bit 7 of the loaded byte and Z is set when it is zero.', examples: ['LDY #$FF'] },
  LSR: { summary: 'Shift right one bit, into carry.', description: 'Shifts the operand right by one bit. Bit 0 moves into C and bit 7 becomes 0, so the operation is an unsigned divide by two. N is therefore always cleared.', examples: ['LSR A       ; A = A / 2'] },
  NOP: { summary: 'No operation.', description: 'Does nothing for two cycles and affects no register or flag. Used as padding and for timing. Only $EA is the documented NOP; the other byte patterns that behave like one are undocumented opcodes and are out of scope here.', examples: ['NOP'] },
  ORA: { summary: 'Bitwise OR of memory into the accumulator.', description: 'Replaces A with A OR the operand — the usual way to set selected bits with a mask. N takes bit 7 of the result, Z is set when the result is zero.', examples: ['ORA #$80    ; force bit 7 on'] },
  PHA: { summary: 'Push the accumulator onto the stack.', description: 'Writes A to the stack page ($0100 + S) and decrements the stack pointer. No flags change.', examples: ['PHA'] },
  PHP: { summary: 'Push the status register onto the stack.', description: 'Writes the status byte to the stack and decrements the stack pointer. The break bit is pushed set, as with BRK; that bit exists only in the pushed byte, not in the register.', examples: ['PHP\nPLA         ; read the flags into A'] },
  PLA: { summary: 'Pull the accumulator from the stack.', description: 'Increments the stack pointer and loads A from the stack. N and Z are set from the pulled byte.', examples: ['PLA'] },
  PLP: { summary: 'Pull the status register from the stack.', description: 'Increments the stack pointer and restores every real flag — N, V, D, I, Z and C — from the pulled byte. The break bit in that byte has no register to be written to.', examples: ['PHP\n; ...\nPLP         ; restore the flags'] },
  ROL: { summary: 'Rotate left one bit, through carry.', description: 'Shifts the operand left by one bit; the old carry becomes bit 0 and the old bit 7 becomes the new carry. Nine bits rotate in total, so chained ROLs shift a multi-byte value left.', examples: ['ROL A', 'ASL $10\nROL $11     ; 16-bit shift left'] },
  ROR: { summary: 'Rotate right one bit, through carry.', description: 'Shifts the operand right by one bit; the old carry becomes bit 7 and the old bit 0 becomes the new carry. Chained RORs shift a multi-byte value right.', examples: ['LSR $11\nROR $10     ; 16-bit shift right'] },
  RTI: { summary: 'Return from an interrupt.', description: 'Pulls the status byte and then the program counter from the stack, restoring N, V, D, I, Z and C. Unlike RTS it does not add one to the pulled address, because the interrupt sequence pushed the address to resume at.', examples: ['RTI'] },
  RTS: { summary: 'Return from a subroutine.', description: 'Pulls a two-byte address from the stack and resumes at that address plus one, matching what JSR pushed. No flags change.', examples: ['RTS'] },
  SBC: {
    summary: 'Subtract memory from the accumulator with borrow.',
    description:
      'Computes A minus the operand minus the complement of the carry flag. Carry acts as not-borrow: with C set, SBC subtracts just the operand, so SEC precedes the first SBC of a subtraction. V is set on signed overflow. ' +
      DECIMAL_NOTE,
    examples: ['SEC\nSBC #$01    ; A = A - 1', 'SEC\nSBC $10\nSBC $11    ; 16-bit subtract'],
  },
  SEC: { summary: 'Set the carry flag.', description: 'Sets C to 1. Required before the first SBC of a subtraction, since carry is the not-borrow input.', examples: ['SEC\nSBC #$01'] },
  SED: { summary: 'Set the decimal flag.', description: 'Sets D to 1, so ADC and SBC compute in BCD. On the NMOS 6502 the N, V and Z flags are unreliable while D is set.', examples: ['SED\nCLC\nADC #$01    ; BCD increment'] },
  SEI: { summary: 'Set the interrupt disable flag.', description: 'Sets I to 1, masking further IRQs. Does not mask the NMI line.', examples: ['SEI         ; disable IRQs'] },
  STA: { summary: 'Store the accumulator into memory.', description: 'Writes A to the addressed location. No flags change. Every indexed store costs a fixed number of cycles — the address fixup is always performed, so there is no page-crossing penalty.', examples: ['STA $0400', 'STA ($08),Y'] },
  STX: { summary: 'Store the X register into memory.', description: 'Writes X to the addressed location. No flags change. STX is one of only two instructions with a zero-page,Y mode.', examples: ['STX $10', 'STX $10,Y'] },
  STY: { summary: 'Store the Y register into memory.', description: 'Writes Y to the addressed location. No flags change.', examples: ['STY $10'] },
  TAX: { summary: 'Transfer the accumulator to X.', description: 'Copies A into X, leaving A unchanged, and sets N and Z from the value.', examples: ['TAX'] },
  TAY: { summary: 'Transfer the accumulator to Y.', description: 'Copies A into Y, leaving A unchanged, and sets N and Z from the value.', examples: ['TAY'] },
  TSX: { summary: 'Transfer the stack pointer to X.', description: 'Copies the stack pointer into X and sets N and Z from the value. It moves the pointer, not stack data, so it is a register transfer rather than a stack operation.', examples: ['TSX         ; inspect the stack pointer'] },
  TXA: { summary: 'Transfer X to the accumulator.', description: 'Copies X into A and sets N and Z from the value.', examples: ['TXA'] },
  TXS: { summary: 'Transfer X to the stack pointer.', description: 'Copies X into the stack pointer. Unusually for a transfer it sets no flags, which is why startup code can do LDX #$FF / TXS without disturbing them.', examples: ['LDX #$FF\nTXS         ; reset the stack'] },
  TYA: { summary: 'Transfer Y to the accumulator.', description: 'Copies Y into A and sets N and Z from the value.', examples: ['TYA'] },
}
