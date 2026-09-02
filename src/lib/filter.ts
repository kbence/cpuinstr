import type { Instruction } from './types'

export type SortMode = 'mnemonic' | 'category'

/**
 * Everything one instruction is searchable by. Mode names are also emitted with
 * spaces ("zero page x") so a typed query does not have to guess underscores.
 */
function operandForms(operand: string): string[] {
  // Also index the datasheet-style spelling, so a query typed as "($nn),Y"
  // finds the mode this app renders as "(<zp>),Y".
  const datasheet = operand
    .replace(/<zp>/g, '$nn')
    .replace(/<abs16>/g, '$nnnn')
    .replace(/<imm8>/g, '$nn')
  return datasheet === operand ? [operand] : [operand, datasheet]
}

function haystack(i: Instruction): string {
  const modes = i.modes.flatMap((m) => [
    m.name,
    m.name.replace(/_/g, ' '),
    m.opcode,
    ...operandForms(m.operand),
    m.cycles,
  ])
  return [i.mnemonic, ...i.aliases, i.summary, i.description, i.category, i.category.replace(/_/g, ' '), ...i.flags, ...modes]
    .join('\n')
    .toLowerCase()
}

export function matches(instruction: Instruction, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return haystack(instruction).includes(q)
}

export function filterInstructions(
  instructions: readonly Instruction[],
  query: string,
): readonly Instruction[] {
  const q = query.trim()
  return q ? instructions.filter((i) => matches(i, q)) : instructions
}

export function sortInstructions(
  instructions: readonly Instruction[],
  mode: SortMode,
): readonly Instruction[] {
  const sorted = [...instructions]
  sorted.sort((a, b) =>
    mode === 'category' && a.category !== b.category
      ? a.category.localeCompare(b.category)
      : a.mnemonic.localeCompare(b.mnemonic),
  )
  return sorted
}

export function countOpcodes(instructions: readonly Instruction[]): number {
  return instructions.reduce((n, i) => n + i.modes.length, 0)
}
