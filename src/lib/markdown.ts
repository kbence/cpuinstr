import type { Instruction } from './types'

const MODE_LABEL: Record<string, string> = {
  implicit: 'implied',
  accumulator: 'accumulator',
  immediate: 'immediate',
  zero_page: 'zero page',
  zero_page_x: 'zero page,X',
  zero_page_y: 'zero page,Y',
  relative: 'relative',
  absolute: 'absolute',
  absolute_x: 'absolute,X',
  absolute_y: 'absolute,Y',
  indirect: 'indirect',
  indexed_indirect: '(indirect,X)',
  indirect_indexed: '(indirect),Y',
  indirect_zero_page: '(indirect)',
  absolute_indexed_indirect: '(absolute,X)',
}

export function modeLabel(name: string): string {
  return MODE_LABEL[name] ?? name
}

/** One expanded row as markdown, for pasting into notes or an issue. */
export function instructionToMarkdown(instruction: Instruction, setName: string): string {
  // Only worth a Flags column when some mode diverges from the instruction.
  const perMode = instruction.modes.some((m) => m.flags)
  const rows = instruction.modes.map((m) => {
    const cells = [
      modeLabel(m.name),
      `\`${instruction.mnemonic}${m.operand ? ` ${m.operand}` : ''}\``,
      `\`$${m.opcode}\``,
      String(m.bytes),
      m.cycles,
    ]
    if (perMode) cells.push((m.flags ?? instruction.flags).join(' ') || 'none')
    return `| ${cells.join(' | ')} |`
  })
  const head = ['Mode', 'Syntax', 'Opcode', 'Bytes', 'Cycles']
  if (perMode) head.push('Flags')
  const parts = [
    `## ${instruction.mnemonic} — ${instruction.summary}`,
    '',
    `*${setName} · ${instruction.category} · flags ${instruction.flags.join(' ') || 'none'}*`,
    '',
    instruction.description,
    '',
    `| ${head.join(' | ')} |`,
    `|${head.map(() => '---|').join('')}`,
    ...rows,
  ]
  if (instruction.examples.length > 0) {
    parts.push('', '```asm', ...instruction.examples, '```')
  }
  return parts.join('\n')
}
