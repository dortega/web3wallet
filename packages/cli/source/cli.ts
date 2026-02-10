#!/usr/bin/env node
import Pastel from 'pastel';

const app = new Pastel({
	importMeta: import.meta,
	name: 'w3w',
	description: 'Web3 Wallet CLI - Multi-chain EVM wallet manager',
	version: '0.1.0',
});

await app.run();
