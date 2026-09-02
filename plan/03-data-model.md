# 3 · Data model

Two JSON documents per variant: a **catalog** and an **instruction set**. Both are typed in `src/lib/types.ts`.

## `data/architectures.json` — catalog

```json
{
  "architectures": [
    { "id": "m6502", "name": "MOS Technology 6502",
      "variants": [
        { "id": "m6502",  "name": "6502 (1975)",  "file": "sets/m6502.json" }
      ] }
  ]
}
```

- One `id` + `name` per level; `file` points at the instruction-set JSON (relative to `src/data/`).
- v1 ships the 6502 only; the shape allows adding 65C02, W65C02, Z80, … without code changes.

## `data/sets/m6502.json` — one instruction set

```json
{
  "set": "m6502",
  "flagBits": "NV-BDIZC",
  "instructions": [
    {
      "id": "m6502.lda",
      "mnemonic": "LDA",
      "aliases": ["lda"],
      "category": "load_store",
      "summary": "Load a byte into the accumulator A.",
      "description": "Loads an 8-bit value from the addressed location into the A register, overwriting the previous value. Z and N are set according to the loaded byte; no other flag changes.",
      "examples": [
        "LDA #$1A     ; load immediate 26",
        "LDA ($08,X)  ; indexed indirect: pointer at $08+X in page 0",
        "LDA ($08),Y  ; indirect indexed: pointer at $08, then +Y"
      ],
      "flags": ["N", "Z"],
      "modes": [
        { "name": "immediate",   "opcode": "A9", "operand": "#<imm8>", "bytes": 2, "cycles": "2" },
        { "name": "zero_page",   "opcode": "A5", "operand": "<zp>",    "bytes": 2, "cycles": "3" },
        { "name": "zero_page_x", "opcode": "B5", "operand": "<zp>,X",  "bytes": 2, "cycles": "4" }
      ]
    }
  ]
}
```

## Field rules

| Field | Rule |
|---|---|
| `id` | Globally unique: `<variant>.<mnemonicLower>` |
| `mnemonic` | Canonical uppercase form; `aliases` holds alternate spellings a user might type. Empty (`[]`) for every NMOS 6502 instruction — that variant has no aliases. |
| `category` | Fixed vocabulary, exactly one per instruction: `load_store` (memory ↔ register) · `transfer` (register → register) · `stack` · `arithmetic` · `logic` · `shift` · `branch` · `jump` · `flag` · `system`. `load_store` and `transfer` are disjoint: `LDA`/`STA` move a *memory* operand, `TAX`/`TXS` move between registers. The 6502 assignment is fixed per mnemonic in [05-6502.md](./05-6502.md) — do not re-derive it. |
| `summary` | One line, fits in the table row |
| `flags` | Flags the instruction *changes*, named per the set's `flagBits`. 6502: `N V D I Z C` — **never `B`**, which is not a register bit (it exists only in the byte pushed by `BRK`/`PHP`); describe that in `description` instead. Instruction-level, not per mode; add an optional `modes[].flags` override only when a variant needs it (65C02 `BIT #`). |
| `description` | Full paragraph(s); may include flag effects |
| `modes[].name` | Fixed vocabulary, the 13 official 6502 modes: `implicit` `accumulator` `immediate` `zero_page` `zero_page_x` `zero_page_y` `relative` `absolute` `absolute_x` `absolute_y` `indirect` `indexed_indirect` `indirect_indexed` (extend for other CPUs). `indexed_indirect` = `($nn,X)`, `indirect_indexed` = `($nn),Y` — distinct modes, never merged. See [05-6502.md](./05-6502.md) for the table. |
| `modes[].opcode` | Single uppercase hex byte, **unique set-wide**. One `(mnemonic, mode)` pair is exactly one opcode — a mnemonic with two encodings gets two `modes` entries, not a list. |
| `modes[].bytes` | Instruction length, 1–4 |
| `modes[].cycles` | String, to allow notes such as page-crossing: `"4 (5 if crossing byte boundary)"` |
| `flagBits` | Convention string (e.g. 6502 `NV-BDIZC`), reused in the UI legend |

## Invariants (checked by a tiny script / vitest)

- `mnemonic` unique per set; `modes[].opcode` unique across the whole set.
- For the NMOS 6502: **56 canonical mnemonics**, **151 documented opcodes** (see [05-6502.md](./05-6502.md)).
- `bytes` within 1–3 (no 6502 instruction is 4 bytes); `cycles` parseable to a leading integer.
- No `flags` entry is `B`; every `flags` entry is a character of the set's `flagBits`.
- Every `modes[].name` is in the fixed vocabulary; `bytes` matches the mode (see the table in [05-6502.md](./05-6502.md)).
- Every `category` is in the fixed vocabulary and matches the mnemonic→category table in [05-6502.md](./05-6502.md).
