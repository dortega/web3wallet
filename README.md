# W3W - Web3 Wallet

A multi-interface Web3 wallet for managing Ethereum-compatible wallets, balances, and transfers. Built as a pnpm monorepo with three packages sharing a common core.

## Architecture

```
packages/
  core/    Shared services (ethers.js, factory pattern with DI, fully tested)
  cli/     Terminal UI (Ink + Pastel, file-based routing)
  web/     Desktop app (Electron + React 19 + Vite + Tailwind CSS 4)
```

Both the CLI and Electron app use the same core services and the same keystore directory (`~/.web3-wallet/`), so wallets created in one are immediately available in the other.

## Features

### Wallet Management
- **Create** wallets (random keypair, encrypted keystore)
- **Import** from private key or 12/24-word mnemonic phrase
- **Export** private key (password-protected)
- **Delete** wallets
- **View** public key

### Multi-chain Support
- Ethereum, Polygon, BNB Smart Chain, Arbitrum One, Sepolia (testnet)
- Add/edit/remove custom chains
- Testnet toggle in settings (hidden by default)

### Token Support
- Popular ERC-20 tokens pre-configured (USDT, USDC, DAI, WBTC, WETH, LINK)
- Across Ethereum, Polygon, BSC, and Arbitrum
- Add custom tokens by contract address (auto-detects symbol and decimals)

### Balances
- Native and ERC-20 token balances per wallet per chain
- Background prefetching across all wallets and chains
- Live fiat prices via CoinGecko (auto-refresh every 60s)
- Total portfolio value in USD or EUR
- Testnet balances shown separately

### Transfers
- Send native tokens or ERC-20 tokens
- Chain and asset selection
- Max balance hint (clickable to fill amount)
- Bulk transfer from Excel (.xlsx) file
- Progress tracking for bulk operations

### Privacy Modes
- **Hide wallet addresses** - masks as `0xdA3...789` across the app
- **Hide balances** - replaces amounts with `****`, shows green dot for non-zero wallets
- Both toggleable from Settings

### Block Explorers
- Click any chain name in the balance panel to open the block explorer for that wallet
- Default explorer URLs configured for all built-in chains (Etherscan, Polygonscan, BscScan, Arbiscan)
- Custom explorer URL configurable per chain

### Desktop App (Electron)
- Responsive layout (sidebar on desktop, drawer on mobile)
- Dashboard with total balance, per-wallet breakdown, fiat values
- Password dialog for signing operations
- Settings: currency (USD/EUR), testnet visibility, privacy modes
- Drag & drop file upload for bulk transfers
- Installable as native app (`.dmg` / `.exe` / `.AppImage`)

## Security Model

Private keys are stored in encrypted keystore files (ethers.js v6 format) in `~/.web3-wallet/keystore/`. The password is **only** required when the private key is needed:

- Signing transactions (transfer, bulk transfer)
- Exporting the private key
- Deriving the public key

Listing wallets, viewing balances, and browsing the app require no password - the wallet address is derived from the keystore filename.

## Requirements

- Node.js >= 18
- pnpm

## Setup

```bash
pnpm install
pnpm build
```

## Usage

### CLI

```bash
# Link the CLI globally
cd packages/cli && pnpm link --global

# Or run directly
node packages/cli/build/cli.js

# Commands
w3w                     # List wallets
w3w create              # Create a new wallet
w3w import              # Import from private key or mnemonic
w3w balance             # Check balances (native + tokens)
w3w transfer            # Send tokens (interactive)
w3w bulk-transfer <file.xlsx>  # Bulk transfer from Excel
w3w export              # Export private key
w3w public-key          # Show public key
w3w chains              # List chains
w3w chains add          # Add a chain
w3w chains remove       # Remove a chain
```

### Desktop App (Electron)

```bash
# Development (hot reload)
pnpm --filter @web3-wallet/web dev

# Build the app bundle (unpacked, for testing)
pnpm --filter @web3-wallet/web run pack
# Output: packages/web/release/mac-arm64/W3W.app (macOS)

# Build distributable installer
pnpm --filter @web3-wallet/web run dist
# Output: packages/web/release/W3W-0.1.0.dmg (macOS)
#         packages/web/release/W3W Setup 0.1.0.exe (Windows)
#         packages/web/release/W3W-0.1.0.AppImage (Linux)

# Run the built app directly (macOS)
open packages/web/release/mac-arm64/W3W.app
```

To install on macOS, open the `.dmg` and drag W3W to Applications. On Windows, run the `.exe` installer. On Linux, make the `.AppImage` executable and run it.

## Development

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @web3-wallet/core test
pnpm --filter @web3-wallet/cli test
pnpm --filter @web3-wallet/web test

# Watch mode
pnpm --filter @web3-wallet/core test:watch

# Build all packages
pnpm build
```

## Project Structure

### Core (`packages/core/src/`)

```
services/
  balance.service.ts     Native and ERC-20 balance queries
  chain.service.ts       Chain CRUD + defaults (ETH, Polygon, BSC, Arbitrum, Sepolia)
  keystore.service.ts    Encrypted keystore read/write/delete
  provider.service.ts    JSON-RPC provider management
  token.service.ts       Token config CRUD + popular defaults
  transfer.service.ts    Native and ERC-20 transfers + bulk
  wallet.service.ts      Create, import (key/mnemonic), export, delete
types/
  chain.types.ts         ChainConfig, TokenConfig
  wallet.types.ts        WalletCreateResult, AccountData
utils/
  excel-parser.ts        Parse .xlsx for bulk transfers (path or buffer)
  fs-adapter.ts          Node.js filesystem abstraction
  paths.ts               Default config paths (~/.web3-wallet/)
```

### CLI (`packages/cli/source/`)

```
commands/               Pastel file-based routing
  index.tsx             Default: list wallets
  create.tsx            Create wallet
  import.tsx            Import wallet
  balance.tsx           Check balances
  transfer.tsx          Send tokens
  bulk-transfer.tsx     Bulk transfer from Excel
  export.tsx            Export private key
  public-key.tsx        Show public key
  chains/               Chain management subcommands
components/             Shared Ink UI components
lib/
  service-factory.ts    Composition root (wires all services)
```

### Web (`packages/web/src/`)

```
pages/
  DashboardPage.tsx     Wallet list, balances, fiat totals, export/delete
  CreateWalletPage.tsx  Create wallet form
  ImportWalletPage.tsx  Import via private key or mnemonic
  WalletDetailPage.tsx  Balance check, keys, delete
  TransferPage.tsx      Send tokens with max balance hint
  BulkTransferPage.tsx  Bulk transfer with file upload
  ChainsPage.tsx        Chain CRUD
  TokensPage.tsx        Token management + add by address
  SettingsPage.tsx      Currency, testnet toggle
components/             Shared React components
hooks/
  use-async.ts          Generic async state management
  use-balance-map.ts    Prefetch all balances across wallets/chains
  use-prices.ts         CoinGecko price feed (auto-refresh)
  use-settings.ts       Currency and testnet preferences (localStorage)
  use-password-dialog.ts Promise-based password prompt
context/
  services.tsx          React context for dependency injection
lib/
  service-factory.ts    Same composition root as CLI
electron/
  main.ts               Electron main process
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | ethers.js v6 |
| Core | TypeScript, factory pattern with DI |
| CLI | Ink 5, Pastel 3, React 18 |
| Desktop | Electron 34, React 19, Vite 6 |
| Styling | Tailwind CSS 4 |
| Routing | Pastel (CLI), React Router 7 (Web) |
| Testing | Vitest 3 |
| Monorepo | pnpm workspaces |
| Prices | CoinGecko free API |
| Excel | ExcelJS |
