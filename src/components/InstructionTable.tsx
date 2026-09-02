import type { Instruction } from '../lib/types'
import { InstructionRow } from './InstructionRow'

interface Props {
  instructions: readonly Instruction[]
  query: string
  setName: string
  onClearQuery: () => void
}

export function InstructionTable({ instructions, query, setName, onClearQuery }: Props) {
  if (instructions.length === 0) {
    return (
      <div className="empty">
        <p>
          No matches for <code>{query}</code>
        </p>
        <button type="button" onClick={onClearQuery}>Clear search</button>
      </div>
    )
  }

  return (
    <div className="table-wrap">
    <table className="instructions">
      <thead>
        <tr>
          <th scope="col">Mnemonic</th>
          <th scope="col">Summary</th>
          <th scope="col" className="num">Modes</th>
          <th scope="col">Opcodes</th>
          <th scope="col" className="num">Bytes</th>
          <th scope="col" className="num">Cycles</th>
          <th scope="col">Flags</th>
        </tr>
      </thead>
      <tbody>
        {instructions.map((i) => (
          <InstructionRow key={i.id} instruction={i} setName={setName} />
        ))}
      </tbody>
    </table>
    </div>
  )
}
