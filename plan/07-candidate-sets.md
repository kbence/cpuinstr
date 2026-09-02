# 7 · Candidate instruction sets

Scope: ISAs **people still use** — either running on live silicon, or actively
emulated/assembled by a community today. Dead-and-unemulated architectures are
out. The question each row answers is *what would it cost to add, and what would
it teach us about the data model.*

The blocker is almost never the prose. It is **how the ISA encodes an opcode**,
because [03-data-model.md](./03-data-model.md) currently assumes
`modes[].opcode` is one hex byte.

## The four schema tiers

| Tier | Encoding shape | Schema change needed |
|---|---|---|
| **1** | One opcode byte, mode implied by the byte | **None.** Ships today. |
| **2** | Multi-byte / prefixed opcode (`CB 40`, `ED B0`) | `opcode` becomes a hex *string* of 1–4 bytes; move the "two hex digits" invariant per-set. Small. |
| **3** | Fixed-width bitfield instruction word | `opcode` → `encoding: { width, mask, match, fields[] }`. Addressing "modes" mostly dissolve into operand forms. Real work. |
| **4** | Tier 3 **plus** an extension/feature dimension and no meaningful cycle counts | Add `extension` to instructions, make `cycles` and `flags` optional, add a feature filter to the UI. Large. |

Two model assumptions break at tier 3–4 and are worth naming now:

- **`cycles` assumes a deterministic count.** Meaningless on any superscalar
  out-of-order part. It has to become optional, or split into latency/throughput.
- **`flags` assumes a small named status register.** ARM has `NZCV`, x86 has more,
  **RISC-V has no flags at all**. `flags: []` already expresses that, but the UI
  legend (`flagBits`) needs to allow "none".

## Tier 1 — ships against today's schema

Byte-opcode 8-bit CPUs. Each is a transcription job, not a design job.

| ISA | Why people still use it | Notes |
|---|---|---|
| **MOS 6510** | C64 — the largest retro-dev scene alive | Instruction set is *identical* to the 6502; the difference is an I/O port at `$0000/$0001`. Satisfies "second variant" but teaches nothing. |
| **RP2A03 / 2A07** | NES homebrew and emulation | 6502 with decimal mode disabled — `ADC`/`SBC` ignore `D`. A genuinely interesting *variant diff*. |
| **MOS 6507** | Atari 2600 | 6502 with 13 address lines and no interrupts. Pin-limited subset. |
| **HuC6280** | PC Engine / TurboGrafx-16 | 65C02 superset + block-transfer instructions. Good third variant of the family. |
| **WDC 65C02 (full)** | Retro builds on real WDC silicon | The 34 `RMB`/`SMB`/`BBR`/`BBS`/`STP`/`WAI` opcodes we deliberately excluded. `zpr` (zero-page-relative) is a new 3-byte mode. Cheap win. |
| **Intel 8080 / 8085** | CP/M, Space Invaders-era arcade | 244 opcodes, all single-byte. Clean tier-1 job. |
| **Sharp SM83 (LR35902)** | **Game Boy** — one of the biggest emulator/homebrew scenes there is | Z80-flavoured but its own ISA: no `IX`/`IY`, different flags, `CB` prefix only. Mostly tier 1 with a single prefix table. |
| **Motorola 6809 / 6803** | Vectrex, CoCo, arcade | Byte opcodes with a `10`/`11` prefix page. Tier 1½. |
| **CHIP-8** | The universal "write your first emulator" target | 35 instructions, 16-bit words. Trivial, and a great smoke test for a non-byte encoding. |

## Tier 2 — one small schema change (multi-byte opcodes)

| ISA | Why | Size |
|---|---|---|
| **Zilog Z80** | ZX Spectrum, MSX, CP/M, and a huge slice of 1980s arcade hardware; still the retro-dev workhorse after the 6502 | ~1000 opcodes across the base, `CB`, `ED`, `DD`, `FD`, `DDCB`, `FDCB` pages. The single highest-value addition on this list. |
| **Z180 / eZ80** | Still in production embedded parts | Z80 superset — a variant diff against Z80, which is exactly what the compare view is for. |
| **Motorola 68000** | Amiga, Atari ST, Genesis, arcade, classic Mac | 16-bit opcode *word* with embedded operand fields. Sits awkwardly between tier 2 and 3 — the word is a bitfield, so it is honestly tier 3. |
| **Intel 8086 / 80286** | DOS gaming via DOSBox; the root of x86 | Prefixes + ModRM + displacement. Tier 2 encoding, but it is the on-ramp to tier 4. |

## Tier 3 — needs a bitfield encoding model

| ISA | Why people still use it | Notes |
|---|---|---|
| **RISC-V RV32I** | In production and growing fast; the base integer set is only **47 instructions** | **The best tier-3 candidate.** Small enough to author by hand, modular by design (`M`, `A`, `F`, `D`, `C`, `V` extensions) — so it forces the `extension` dimension in miniature, with no flags register at all. |
| **ARMv7-A / ARM32** | Raspberry Pi 1–3, Android legacy, huge emulator surface | Conditional execution on nearly every instruction (`cond` field) is a modelling wrinkle nothing else here has. |
| **ARMv6-M / v7-M (Cortex-M)** | Every other microcontroller shipping today | Thumb/Thumb-2: mixed 16/32-bit encodings in one set. |
| **AArch64 (ARMv8-A/v9)** | Apple Silicon, all modern phones, AWS Graviton | ~1000 base instructions plus SVE/SVE2. Tier 3 encoding, tier 4 size. |
| **MIPS R3000 / R4300i** | PS1 and N64 emulation; still in networking silicon | Textbook-clean 32-bit fixed encoding. Easiest tier-3 authoring after RISC-V. |
| **SuperH SH-2 / SH-4** | Saturn, 32X, Dreamcast emulation | Fixed 16-bit encoding. |
| **PowerPC (Gekko/Broadway, Power ISA)** | GameCube/Wii emulation; IBM Power in production | Fixed 32-bit. |
| **Xtensa LX6/LX7** | **ESP32** — shipping in enormous volume | Practical embedded value; sparse public encoding tables. |
| **AVR** | Arduino; still in new products | 16-bit fixed encoding, ~130 instructions. Small and very widely known. |
| **MSP430**, **SPARC**, **LoongArch**, **s390x** | Niche-but-live | Same shape as the above. |

## Tier 4 — extension dimension + very large

| ISA | Why | The problem |
|---|---|---|
| **x86-64** | The desktop/server ISA | Thousands of instructions; REX/VEX/EVEX prefixes; SSE/AVX/AVX-512 feature families; no meaningful cycle counts. Needs `extension` filtering, optional `cycles`, and realistically a scraped source (not hand-authored). |
| **NVIDIA PTX / SASS**, **AMD RDNA**, **SPIR-V** | GPU work | Vendor-documented to varying degrees; SASS is largely undocumented. |
| **Hexagon**, **TI C6000** | DSPs in shipping phones/hardware | VLIW packet semantics do not fit an instruction-per-row table at all. |

## Bytecode ISAs — small, live, and a good fit

Worth calling out separately: these are *stable, fully documented, and tiny*,
and people write interpreters for them constantly.

| ISA | Size | Why it fits |
|---|---|---|
| **WebAssembly** | ~200 opcodes | Byte opcodes with LEB128 immediates. Near tier 1. Live everywhere. |
| **eBPF** | ~100 opcodes | Fixed 64-bit encoding, in every modern Linux kernel. Small tier-3 exercise. |
| **JVM bytecode** | ~200 opcodes | Single-byte opcodes. Genuinely tier 1. |
| **6502 undocumented** | 105 | ✅ already shipped as an appendix. |

## Recommendation

1. **Z80** next. Biggest retro-dev payoff per unit of schema change, and it only
   costs the tier-2 multi-byte `opcode`. It also gives the compare view a second
   family to work in (Z80 vs Z180).
2. **RISC-V RV32I** after that. 47 instructions is a small authoring job for a
   large modelling return: it forces the bitfield `encoding` model, the
   `extension` dimension, and the no-flags case all at once, on an ISA that is
   actually in production.
3. **Then decide on x86 or AArch64** — but only with a scraped source. Both are
   too large to hand-author, and the honest answer may be that this app should
   link out to them rather than mirror them.

For the M3 "second architecture" checkbox specifically: **6510 is not worth it**
(identical instruction set), **2A03 is** (a real, small, interesting diff), and
**Z80 is the one that actually stretches the model**.

## Sources to transcribe from

Same standard as the 6502: a machine-readable matrix, cross-checked against a
second independent table.

| ISA | Primary | Cross-check |
|---|---|---|
| Z80 | [clrhome.org/table](https://clrhome.org/table/) | [z80.info decoding](http://www.z80.info/decoding.htm) |
| SM83 | [gbdev Pan Docs / opcode table](https://gbdev.io/gb-opcodes/optables/) | [rgbds instruction reference](https://rgbds.gbdev.io/docs/gbz80.7) |
| 8080 | [pastraiser 8080 table](https://pastraiser.com/cpu/i8080/i8080_opcodes.html) | Intel 8080 datasheet |
| 68000 | [Motorola M68000PRM](https://www.nxp.com/docs/en/reference-manual/M68000PRM.pdf) | [yacht.sh 68k timings](http://oldwww.nvg.ntnu.no/amiga/MC680x0_Sections/) |
| RISC-V | [riscv.org ratified specs](https://riscv.org/technical/specifications/) | [riscv-opcodes machine-readable](https://github.com/riscv/riscv-opcodes) |
| ARM/AArch64 | [ARM Exploration Tools (machine-readable XML)](https://developer.arm.com/downloads/-/exploration-tools) | ARM ARM |
| x86-64 | [Intel SDM](https://www.intel.com/sdm) | [felixcloutier.com/x86](https://www.felixcloutier.com/x86/) |
| WebAssembly | [W3C core spec](https://webassembly.github.io/spec/core/) | wabt opcode list |
| AVR | [Microchip AVR instruction set manual](https://ww1.microchip.com/downloads/en/devicedoc/atmel-0856-avr-instruction-set-manual.pdf) | avr-libc |
