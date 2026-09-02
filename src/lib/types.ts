export type Category =
  | 'load_store' | 'transfer' | 'stack' | 'arithmetic' | 'logic'
  | 'shift' | 'branch' | 'jump' | 'flag' | 'system'

export type ModeName =
  | 'implicit' | 'accumulator' | 'immediate'
  | 'zero_page' | 'zero_page_x' | 'zero_page_y'
  | 'relative' | 'absolute' | 'absolute_x' | 'absolute_y'
  | 'indirect' | 'indexed_indirect' | 'indirect_indexed'
  // 65C02 additions
  | 'indirect_zero_page' | 'absolute_indexed_indirect'

export interface Mode {
  readonly name: ModeName
  /** Single uppercase hex byte, unique across the set. */
  readonly opcode: string
  readonly operand: string
  readonly bytes: number
  /** String, so page-crossing and branch notes survive: "4 (5 on page cross)". */
  readonly cycles: string
  /**
   * Set only when this mode's flags differ from the instruction's. The 65C02's
   * `BIT #imm` is the one case in the family: it affects Z alone.
   */
  readonly flags?: readonly string[]
}

export interface Instruction {
  readonly id: string
  readonly mnemonic: string
  readonly aliases: readonly string[]
  readonly category: Category
  readonly summary: string
  readonly description: string
  readonly examples: readonly string[]
  /** Flags the instruction changes. Never includes `B` — it is not a register bit. */
  readonly flags: readonly string[]
  readonly modes: readonly Mode[]
}

export interface InstructionSet {
  readonly set: string
  readonly name: string
  /** Status-register layout, e.g. "NV-BDIZC". Shown as a legend. */
  readonly flagBits: string
  readonly source?: string
  readonly instructions: readonly Instruction[]
}

export interface Variant {
  readonly id: string
  readonly name: string
  readonly file: string
}

export interface Architecture {
  readonly id: string
  readonly name: string
  readonly variants: readonly Variant[]
}

export type Stability = 'stable' | 'unstable' | 'highly_unstable' | 'halts'

/** One undocumented opcode. Not an Instruction: no summary, no examples, no flags. */
export interface UndocumentedOpcode {
  readonly opcode: string
  readonly mnemonic: string
  readonly mode: ModeName
  readonly operand: string
  readonly bytes: number
  /** null for the KIL opcodes, which never complete. */
  readonly cycles: string | null
  readonly stability: Stability
  /** Operation summary, verbatim from the source. */
  readonly function: string
}

export interface Appendix {
  readonly set: string
  readonly note: string
  readonly source?: string
  readonly opcodes: readonly UndocumentedOpcode[]
}
