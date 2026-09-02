import { modeLabel } from '../lib/markdown'
import type { SetDiff } from '../lib/diff'
import type { Variant } from '../lib/types'

interface Props {
  others: readonly Variant[]
  compareId: string | null
  onCompare: (id: string | null) => void
  diff: SetDiff | null
  compareName: string | undefined
}

export function CompareBar({ others, compareId, onCompare, diff, compareName }: Props) {
  if (others.length === 0) return null

  return (
    <div className="compare">
      <label className="compare__pick">
        <span>Compare with</span>
        <select
          value={compareId ?? ''}
          onChange={(e) => onCompare(e.target.value === '' ? null : e.target.value)}
        >
          <option value="">— off —</option>
          {others.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </label>

      {diff && (
        <div className="compare__out">
          <p className="compare__counts">
            vs <strong>{compareName}</strong>: {diff.addedOpcodes.length} opcodes only here,{' '}
            {diff.removedOpcodes.length} only there, {diff.changedOpcodes.length} changed. Table is
            filtered to the {diff.touchedMnemonics.size} affected mnemonics.
          </p>

          {diff.addedMnemonics.length > 0 && (
            <p className="compare__line">
              <span className="compare__tag compare__tag--add">new</span>
              <span className="mono">{diff.addedMnemonics.join(' ')}</span>
            </p>
          )}
          {diff.removedMnemonics.length > 0 && (
            <p className="compare__line">
              <span className="compare__tag compare__tag--gone">absent here</span>
              <span className="mono">{diff.removedMnemonics.join(' ')}</span>
            </p>
          )}
          {diff.changedOpcodes.length > 0 && (
            <details className="compare__changed">
              <summary>{diff.changedOpcodes.length} changed opcodes</summary>
              <table className="modes">
                <thead>
                  <tr>
                    <th scope="col">Opcode</th>
                    <th scope="col">Instruction</th>
                    <th scope="col">Differs in</th>
                    <th scope="col">Here</th>
                    <th scope="col">There</th>
                  </tr>
                </thead>
                <tbody>
                  {diff.changedOpcodes.map((c) => (
                    <tr key={c.opcode}>
                      <td className="mono">${c.opcode}</td>
                      <td className="mono">
                        {c.from.mnemonic} {modeLabel(c.from.mode.name)}
                      </td>
                      <td>{c.fields.join(', ')}</td>
                      <td>{c.from.mode.cycles}</td>
                      <td>{c.to.mode.cycles}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
