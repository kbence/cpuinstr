import { modeLabel } from '../lib/markdown'
import type { Appendix, Stability } from '../lib/types'

const STABILITY_LABEL: Record<Stability, string> = {
  stable: 'stable',
  unstable: 'unstable',
  highly_unstable: 'highly unstable',
  halts: 'hangs the CPU',
}

export function UndocumentedAppendix({ appendix }: { appendix: Appendix }) {
  const risky = appendix.opcodes.filter((o) => o.stability !== 'stable')

  return (
    <details className="appendix">
      <summary>
        Appendix: {appendix.opcodes.length} undocumented opcodes
        <span className="appendix__warn"> · {risky.length} unstable or halting</span>
      </summary>

      <p className="appendix__note">{appendix.note}</p>

      <div className="table-wrap">
        <table className="modes appendix__table">
          <thead>
            <tr>
              <th scope="col">Opcode</th>
              <th scope="col">Mnemonic</th>
              <th scope="col">Mode</th>
              <th scope="col">Operation</th>
              <th scope="col" className="num">Bytes</th>
              <th scope="col" className="num">Cycles</th>
              <th scope="col">Stability</th>
            </tr>
          </thead>
          <tbody>
            {appendix.opcodes.map((o) => (
              <tr key={o.opcode}>
                <td className="mono">${o.opcode}</td>
                <td className="mono">{o.mnemonic}</td>
                <td>{modeLabel(o.mode)}</td>
                <td className="mono appendix__fn">{o.function}</td>
                <td className="num">{o.bytes}</td>
                <td className="num">{o.cycles ?? '—'}</td>
                <td>
                  <span className={`appendix__tag appendix__tag--${o.stability}`}>
                    {STABILITY_LABEL[o.stability]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {appendix.source && <p className="appendix__note">{appendix.source}.</p>}
    </details>
  )
}
