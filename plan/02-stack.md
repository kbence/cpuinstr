# 2 · Stack & layout

## Tooling

- **Vite 5** + **React 18** + **TypeScript 5** (strict mode).
- No UI component library; one `app.css` with plain CSS.
- JSON data files are plain static imports (Vite supports this natively) — no `fetch()` in dev.
- `npm run dev` (dev server), `npm run build` (static output, hostable anywhere).
- **vitest** for the small pure-logic tests (filtering, catalog invariants).

## Project layout

```
cpuinstr/
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
├── src/
│   ├── main.tsx                  # entry
│   ├── App.tsx                   # composition: header, selectors, filter, table
│   ├── lib/
│   │   ├── types.ts              # Arch, Variant, Instruction, Mode, FlagSemantics
│   │   ├── catalog.ts            # index: arch → variant → instruction set
│   │   └── filter.ts             # pure search/sort helpers (unit-tested)
│   ├── components/
│   │   ├── ArchPicker.tsx        # arch select → variant select (dependent)
│   │   ├── FilterBar.tsx         # search box, result count, sort control
│   │   ├── InstructionTable.tsx  # table container + header row
│   │   └── InstructionRow.tsx    # row + expandable detail (mode table, desc, examples)
│   └── data/
│       ├── architectures.json    # catalog (names, variants, file paths)
│       └── sets/m6502.json       # the 6502 demo set
└── plan/                         # this plan directory
```
