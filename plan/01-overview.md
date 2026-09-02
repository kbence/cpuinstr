# 1 · Overview

## What it is

A static single-page application that provides a browsable database of CPU instruction sets.

## Goals (v1)

- Select a CPU **architecture**, then a **variant** (e.g. 6502 vs 65C02).
- List **all instructions** of the chosen variant in a table.
- One row per **mnemonic** (e.g. `LDA`); the row carries full information for **all** its opcodes: addressing mode, opcode byte(s), operand syntax, byte size, cycle count, flags.
- A **detailed description** per instruction, visible in the table (collapsed + expandable).
- Filter across the **mnemonic**, **description** and **operand** fields.
- Demo dataset: the full canonical **6502** (see [05-6502.md](./05-6502.md)).

## Non-goals (v1)

- No assembler / disassembler / simulator / execution of code.
- No backend or real database — data is JSON, loaded at build time.
- No login, no user-state persistence (URL state only, see [06-milestones.md](./06-milestones.md)).

## Key decisions

| Decision | Choice | Reason |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript (strict), plain CSS | Simple, fast dev loop, easy to grow |
| Data | Static JSON per variant, typed in TS | Swap for an API later behind the same shape |
| Row granularity | One row per mnemonic | Chosen in discussion of the 6502 demo |
| Filtering | One search box matching mnemonic, description, operands | Chosen in discussion; per-field filters later |
