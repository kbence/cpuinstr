# cpuinstr — Plan

A single-page app that acts as a browsable **database of CPU instruction sets**: pick an architecture, then a variant, and inspect all of its instructions in a filterable table with full per-instruction detail. The 6502 is the demo dataset.

## Parts (read in order)

| # | File | Contents |
|---|------|----------|
| 1 | [01-overview.md](./01-overview.md) | Goals, non-goals, key decisions |
| 2 | [02-stack.md](./02-stack.md) | Tech stack, project layout |
| 3 | [03-data-model.md](./03-data-model.md) | JSON schema for catalog + instruction set |
| 4 | [04-ui.md](./04-ui.md) | Screen layout, selectors, filter, table spec |
| 5 | [05-6502.md](./05-6502.md) | Demo dataset scope (mnemonics, opcodes, flags, cycles) |
| 6 | [06-milestones.md](./06-milestones.md) | Build order, done-when, future work |
| 7 | [07-candidate-sets.md](./07-candidate-sets.md) | Which other instruction sets to add, tiered by what each costs the schema |
| 8 | [08-deploy.md](./08-deploy.md) | Hosting options and the constraint that the repo is private |

## Status: M1 + M2 shipped, M3 4-of-5 shipped

Decided so far (from discussion):
- React + Vite + TypeScript (no UI framework).
- One table row **per mnemonic**, each row carrying the data of **all** its opcodes (addressing modes).
- Two variants ship: the NMOS **6502** (56 mnemonics / 151 opcodes) and the base CMOS
  **65C02** (64 / 178), plus a read-only appendix of the 105 undocumented NMOS opcodes.
- Every dataset is **generated** from a committed transcription of a cited source, never
  hand-written, and the invariants are unit-tested. See [05-6502.md](./05-6502.md).
