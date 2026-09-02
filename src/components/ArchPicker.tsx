import type { Architecture, Variant } from '../lib/types'

interface Props {
  architectures: readonly Architecture[]
  arch: Architecture
  variant: Variant
  onChange: (archId: string, variantId: string) => void
}

export function ArchPicker({ architectures, arch, variant, onChange }: Props) {
  return (
    <div className="pickers">
      <label className="picker">
        <span className="picker__label">Architecture</span>
        <select
          value={arch.id}
          onChange={(e) => {
            const next = architectures.find((a) => a.id === e.target.value)
            const first = next?.variants[0]
            if (next && first) onChange(next.id, first.id)
          }}
        >
          {architectures.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </label>

      <label className="picker">
        <span className="picker__label">Variant</span>
        <select value={variant.id} onChange={(e) => onChange(arch.id, e.target.value)}>
          {arch.variants.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </label>
    </div>
  )
}
