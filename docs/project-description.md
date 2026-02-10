# Web3 Wallet CLI

## Overview

Web3 wallet application compatible with EVM (Ethereum Virtual Machine) chains. The project consists of two interfaces:

- **Web**: Simple UI for wallet management and operations
- **CLI**: Command-line interface for power users and automation

Both interfaces consume the same backend services via HTTP.

## Features

### Wallet Management
- **Create wallet**: Generate new EVM-compatible wallets (address + private key)
- **Import wallet**: Import an existing wallet via private key
- **Export private key**: Export the private key of a managed wallet
- **View public key**: Display the public key for signature verification

### Balance & Transactions
- **View balances**: Check native token balance (ETH, MATIC, etc.) and ERC-20 token balances for any wallet
- **Single transfer**: Send native tokens or ERC-20 tokens from a managed wallet to a destination address
- **Bulk transfer**: Import an Excel file (columns: wallet, amount) and execute batch transfers of native or ERC-20 tokens

## Architecture

```
web3-wallet-cli/
├── backend/          # API services (Fastify)
│   └── src/
│       ├── services/ # Wallet, transfer, balance logic
│       ├── routes/   # HTTP endpoints
│       └── lib/      # ethers.js integration, utilities
├── frontend/         # Simple web UI (React + Vite)
│   └── src/
│       ├── pages/    # Wallet, transfers, balances
│       └── api/      # API client
├── cli/              # CLI interface
│   └── src/
│       ├── commands/ # create, import, export, balance, transfer
│       └── lib/      # HTTP client, Excel parser
└── docs/             # Documentation
```

## Tech Stack

- **Blockchain**: ethers.js (EVM interaction)
- **Backend**: Node.js, Fastify, TypeScript
- **Frontend**: React, Vite, Tailwind CSS
- **CLI**: Node.js, TypeScript
- **Excel parsing**: For bulk transfer feature
- **Package manager**: pnpm
