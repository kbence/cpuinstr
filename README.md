# cpuinstr

A browsable database of CPU instruction sets. Pick an architecture and variant,
then filter and inspect every instruction with its addressing modes, opcodes,
byte lengths, cycle counts and flag effects.

Two variants ship today, both under the MOS 6502 architecture:

| Variant | Mnemonics | Opcodes |
|---|---|---|
| NMOS **6502** (1975) | 56 | 151 documented |
| base CMOS **65C02** (1983) | 64 | 178 documented |

Plus a read-only appendix of the **105 undocumented NMOS opcodes**, with per-opcode
stability (86 stable, 5 unstable, 2 highly unstable, 12 that hang the CPU), and a
compare view that diffs two variants opcode by opcode.

```bash
npm install
npm run dev
```

Reproduce a deploy build locally (Pages serves from a `/cpuinstr/` sub-path):

```bash
VITE_BASE=/cpuinstr/ npm run build
```

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | typecheck + static build into `dist/` |
| `npm test` | vitest (dataset invariants + pure logic) |
| `npm run build:data` | regenerate `src/data/sets/m6502.json` |

## Data provenance

No dataset here is written from memory. Each one is generated from a committed
transcription of a cited source, and the `scripts/*.txt` files carry their
provenance in their own headers.

| Dataset | Transcribed from | Cross-checked against |
|---|---|---|
| 6502 | [oxyron.de opcode matrix](http://www.oxyron.de/html/opcodes02.html) | that page's own per-mnemonic tables + [masswerk](https://www.masswerk.at/6502/6502_instruction_set.html) |
| 65C02 | [oxyron.de 65C02 matrix](https://www.oxyron.de/html/opcodesc02.html) | [6502.org 65C02 opcodes](https://6502.org/tutorials/65c02opcodes.html) |
| Undocumented | the shaded cells of the same 6502 matrix | that page's function column + per-opcode stability markers |

Cycle penalties and decimal-mode flag behaviour were verified against
[6502.org](http://www.6502.org/tutorials/decimal_mode.html).

`scripts/build-sets.mjs` derives `bytes` and `operand` from each addressing mode
so they cannot drift, and refuses to emit unless the counts match exactly
(56/151 and 64/178). The test suite pins the externally-verified facts that are
easy to get wrong:

- indexed **stores** never take a page-crossing penalty; the address fixup is always paid
- read-modify-write `absolute,X` is a flat 7 cycles on NMOS, 6+1 on CMOS
- `BIT` sets `N` from bit 7 and `V` from bit 6 — on both parts
- decimal mode leaves `N`/`V`/`Z` **invalid** on NMOS, valid on CMOS
- `BIT #imm` on the 65C02 affects `Z` alone — the family's only per-mode flag divergence
- no instruction claims to affect the `B` bit, which is not a real register flag

## Deployment

Live at **<https://kbence.github.io/cpuinstr/>**, published by
`.github/workflows/deploy.yml` on every push to `main`. The workflow regenerates
the datasets and fails if the committed JSON has drifted from the transcription
tables, so hand-edited data cannot ship. `plan/08-deploy.md` records the other
hosting options considered.

## Plan

`plan/` holds the design docs the implementation follows, milestone by milestone.
