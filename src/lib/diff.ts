import type { Instruction, InstructionSet, Mode } from './types'

export interface OpcodeChange {
  readonly opcode: string
  readonly from: { readonly mnemonic: string; readonly mode: Mode }
  readonly to: { readonly mnemonic: string; readonly mode: Mode }
  /** Which fields differ: any of 'mnemonic' | 'mode' | 'bytes' | 'cycles' | 'flags'. */
  readonly fields: readonly string[]
}

export interface SetDiff {
  /** Mnemonics only in the left set. */
  readonly addedMnemonics: readonly string[]
  /** Mnemonics only in the right set. */
  readonly removedMnemonics: readonly string[]
  readonly addedOpcodes: readonly string[]
  readonly removedOpcodes: readonly string[]
  readonly changedOpcodes: readonly OpcodeChange[]
  /** Mnemonics in the left set that are new or differ in any way — for filtering the table. */
  readonly touchedMnemonics: ReadonlySet<string>
}

interface Entry {
  readonly mnemonic: string
  readonly mode: Mode
}

function index(set: InstructionSet): Map<string, Entry> {
  const m = new Map<string, Entry>()
  for (const i of set.instructions) {
    for (const mode of i.modes) m.set(mode.opcode, { mnemonic: i.mnemonic, mode })
  }
  return m
}

function sameFlags(a: Instruction, b: Instruction, x: Mode, y: Mode): boolean {
  const fa = (x.flags ?? a.flags).join(' ')
  const fb = (y.flags ?? b.flags).join(' ')
  return fa === fb
}

/**
 * What `left` has that `right` does not, and where they disagree. Opcode-keyed,
 * because that is the byte a program actually contains — a mnemonic that gained
 * a mode is a set of added opcodes, not a changed mnemonic.
 */
export function diffSets(left: InstructionSet, right: InstructionSet): SetDiff {
  const l = index(left)
  const r = index(right)
  const byMnemonicL = new Map(left.instructions.map((i) => [i.mnemonic, i]))
  const byMnemonicR = new Map(right.instructions.map((i) => [i.mnemonic, i]))

  const addedOpcodes: string[] = []
  const removedOpcodes: string[] = []
  const changedOpcodes: OpcodeChange[] = []
  const touchedMnemonics = new Set<string>()

  for (const [opcode, from] of [...l].sort(([a], [b]) => a.localeCompare(b))) {
    const to = r.get(opcode)
    if (!to) {
      addedOpcodes.push(opcode)
      touchedMnemonics.add(from.mnemonic)
      continue
    }
    const fields: string[] = []
    if (from.mnemonic !== to.mnemonic) fields.push('mnemonic')
    if (from.mode.name !== to.mode.name) fields.push('mode')
    if (from.mode.bytes !== to.mode.bytes) fields.push('bytes')
    if (from.mode.cycles !== to.mode.cycles) fields.push('cycles')
    const li = byMnemonicL.get(from.mnemonic)
    const ri = byMnemonicR.get(to.mnemonic)
    if (li && ri && !sameFlags(li, ri, from.mode, to.mode)) fields.push('flags')
    if (fields.length > 0) {
      changedOpcodes.push({ opcode, from, to, fields })
      touchedMnemonics.add(from.mnemonic)
    }
  }

  for (const opcode of [...r.keys()].sort()) {
    if (!l.has(opcode)) removedOpcodes.push(opcode)
  }

  const lNames = new Set(byMnemonicL.keys())
  const rNames = new Set(byMnemonicR.keys())
  return {
    addedMnemonics: [...lNames].filter((n) => !rNames.has(n)).sort(),
    removedMnemonics: [...rNames].filter((n) => !lNames.has(n)).sort(),
    addedOpcodes,
    removedOpcodes,
    changedOpcodes,
    touchedMnemonics,
  }
}
