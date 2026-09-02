# cpuinstr

A browsable database of CPU instruction sets. Pick an architecture and variant,
then filter and inspect every instruction with its addressing modes, opcodes,
byte lengths, cycle counts and flag effects.

The demo dataset is the complete NMOS 6502: **56 mnemonics, 151 documented opcodes**.

```bash
npm install
npm run dev
```

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | typecheck + static build into `dist/` |
| `npm test` | vitest (dataset invariants + pure logic) |
| `npm run build:data` | regenerate `src/data/sets/m6502.json` |

## Data provenance

The 6502 dataset is **not** written from memory. `scripts/m6502-opcodes.txt` is a
transcription of the [oxyron.de opcode matrix](http://www.oxyron.de/html/opcodes02.html),
cross-checked opcode-for-opcode against that page's own per-mnemonic tables and
against the [masswerk 6502 instruction set](https://www.masswerk.at/6502/6502_instruction_set.html).
Cycle penalties and decimal-mode flag behaviour were verified against
[6502.org](http://www.6502.org/tutorials/decimal_mode.html).

`scripts/build-m6502.mjs` derives `bytes` and `operand` from each addressing mode
so they cannot drift, and refuses to emit unless it counts exactly 56 mnemonics
and 151 opcodes. `src/lib/dataset.test.ts` pins the externally-verified facts —
including that indexed *stores* never take a page-crossing penalty, that
read-modify-write `absolute,X` is a flat 7 cycles, and that no instruction
claims to affect the `B` bit, which is not a real register flag.

## Plan

`plan/` holds the design docs the implementation follows, milestone by milestone.
