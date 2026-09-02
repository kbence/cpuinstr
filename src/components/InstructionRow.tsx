import { useId, useState } from 'react'
import { instructionToMarkdown, modeLabel } from '../lib/markdown'
import type { Instruction } from '../lib/types'

const COPY_LABEL = {
  idle: 'Copy as markdown',
  copied: 'Copied',
  failed: 'Copy blocked',
} as const

/**
 * The async Clipboard API is unavailable on insecure origins and in sandboxed
 * frames, so fall back to the legacy selection copy before giving up.
 */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fall through
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
  document.body.appendChild(ta)
  ta.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    ta.remove()
  }
}

/** "2" and "2 (3 if taken…)" collapse to a compact range for the summary row. */
function cycleRange(instruction: Instruction): string {
  const nums = instruction.modes.flatMap((m) => {
    const found = m.cycles.match(/\d+/g)
    return found ? found.map(Number) : []
  })
  if (nums.length === 0) return '—'
  const lo = Math.min(...nums)
  const hi = Math.max(...nums)
  return lo === hi ? String(lo) : `${lo}–${hi}`
}

function byteRange(instruction: Instruction): string {
  const nums = instruction.modes.map((m) => m.bytes)
  const lo = Math.min(...nums)
  const hi = Math.max(...nums)
  return lo === hi ? String(lo) : `${lo}–${hi}`
}

interface Props {
  instruction: Instruction
  setName: string
}

export function InstructionRow({ instruction, setName }: Props) {
  const [open, setOpen] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const detailId = useId()

  async function copyMarkdown() {
    const md = instructionToMarkdown(instruction, setName)
    setCopyState((await writeClipboard(md)) ? 'copied' : 'failed')
    window.setTimeout(() => setCopyState('idle'), 1800)
  }

  return (
    <>
      <tr className={open ? 'row row--open' : 'row'}>
        <td>
          <button
            type="button"
            className="row__toggle"
            aria-expanded={open}
            aria-controls={detailId}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="row__caret" aria-hidden="true">{open ? '▾' : '▸'}</span>
            <span className="mono row__mnemonic">{instruction.mnemonic}</span>
          </button>
        </td>
        <td className="row__summary">{instruction.summary}</td>
        <td className="num">{instruction.modes.length}</td>
        <td className="mono row__opcodes">{instruction.modes.map((m) => m.opcode).join(' ')}</td>
        <td className="num">{byteRange(instruction)}</td>
        <td className="num">{cycleRange(instruction)}</td>
        <td className="mono row__flags">{instruction.flags.join(' ') || '—'}</td>
      </tr>

      {open && (
        <tr className="detail" id={detailId}>
          <td colSpan={7}>
            <div className="detail__body">
              <div className="detail__head">
                <p className="detail__desc">{instruction.description}</p>
                <button
                  type="button"
                  className="detail__copy"
                  onClick={copyMarkdown}
                  data-state={copyState}
                >
                  {COPY_LABEL[copyState]}
                </button>
              </div>

              <table className="modes">
                <caption className="modes__caption">
                  Addressing modes · category <code>{instruction.category}</code>
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Mode</th>
                    <th scope="col">Syntax</th>
                    <th scope="col">Opcode</th>
                    <th scope="col" className="num">Bytes</th>
                    <th scope="col">Cycles</th>
                  </tr>
                </thead>
                <tbody>
                  {instruction.modes.map((m) => (
                    <tr key={m.opcode}>
                      <td>{modeLabel(m.name)}</td>
                      <td className="mono">
                        {instruction.mnemonic}
                        {m.operand && ` ${m.operand}`}
                      </td>
                      <td className="mono">${m.opcode}</td>
                      <td className="num">{m.bytes}</td>
                      <td>{m.cycles}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {instruction.examples.length > 0 && (
                <div className="detail__examples">
                  <h4>Examples</h4>
                  {instruction.examples.map((ex) => (
                    <pre key={ex} className="mono">{ex}</pre>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
