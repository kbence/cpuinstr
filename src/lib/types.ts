export type Category =
  | 'load_store' | 'transfer' | 'stack' | 'arithmetic' | 'logic'
  | 'shift' | 'branch' | 'jump' | 'flag' | 'system'

export type ModeName =
  | 'implicit' | 'accumulator' | 'immediate'
  | 'zero_page' | 'zero_page_x' | 'zero_page_y'
  | 'relative' | 'absolute' | 'absolute_x' | 'absolute_y'
  | 'indirect' | 'indexed_indirect' | 'indirect_indexed'

export interface Mode {
  readonly name: ModeName
  /** Single uppercase hex byte, unique across the set. */
  readonly opcode: string
  readonly operand: string
  readonly bytes: number
  /** String, so page-crossing and branch notes survive: "4 (5 on page cross)". */
  readonly cycles: string
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
