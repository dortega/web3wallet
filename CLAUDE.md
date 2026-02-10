# W3W - Development Guide

## Conventions

- **Use pnpm for everything.** Never use npm or yarn.
- TypeScript is mandatory
- Tailwind CSS for styling (web package)
- Prefer ESM and modern browser syntax
- Don't add dependencies until they're necessary
- Add or update tests when changing behavior, even if not explicitly asked

---

## Code Rules

### File Size Limit
**Maximum 500 lines of code per file.** If a file exceeds this limit:
- Refactor immediately
- Extract components, services, or utilities
- Split by responsibility, not arbitrarily

### Organization
- Small components with a single responsibility
- Prefer composition over complex configurations
- Avoid premature abstractions

### Testing Requirements
All business logic must be testable:
- Core services must be tested with mocks
- Use dependency injection via factory functions
- Tests live alongside code: `*.test.ts` / `*.test.tsx`
- No code with type errors or failing tests is accepted

---

## Architecture

```
packages/
├── core/               # Shared business logic (ethers.js v6)
│   └── src/
│       ├── services/   # Factory-pattern services with DI
│       ├── types/      # TypeScript interfaces
│       └── utils/      # fs-adapter, excel-parser, paths
├── cli/                # Terminal app (Ink + Pastel v3)
│   └── source/
│       ├── commands/   # File-based routing
│       ├── components/ # Ink UI components
│       └── lib/        # Service factory (composition root)
└── web/                # Desktop app (Electron + React 19 + Vite + Tailwind)
    ├── electron/       # Electron main process
    └── src/
        ├── pages/      # Route pages
        ├── components/ # React components
        ├── hooks/      # Custom hooks
        ├── context/    # React context providers
        └── lib/        # Service factory (composition root)
```

---

## Commands

### Core
```bash
pnpm --filter @web3-wallet/core build    # Compile TypeScript
pnpm --filter @web3-wallet/core test     # Run tests
```

### CLI
```bash
pnpm --filter @web3-wallet/cli build     # Compile TypeScript
node packages/cli/build/cli.js <command> # Run CLI
```

### Web (Electron)
```bash
pnpm --filter @web3-wallet/web dev       # Dev server + Electron
pnpm --filter @web3-wallet/web build     # Production build
```

### All packages
```bash
pnpm build    # Build everything
pnpm test     # Test everything
```

---

## Service Pattern

All core services use factory functions with dependency injection:

```typescript
export function createWalletService(keystoreService: KeystoreService) {
  return {
    async create(password: string) { /* ... */ },
    async listWallets() { /* ... */ },
  };
}

// In tests:
const mockKeystore = { save: vi.fn(), list: vi.fn() };
const service = createWalletService(mockKeystore);
```

Both CLI and web share the same core services via their own composition root (`lib/service-factory.ts`).

---

## Git Workflow

- **Never push** - Only commit locally, user handles push
- **No generated footers** - Don't add "Generated with Claude Code" or similar
- **No co-authored-by** - Don't add co-author tags
- Keep commit messages concise and descriptive
