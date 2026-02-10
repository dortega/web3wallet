import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import zod from 'zod';
import type { ChainConfig } from '@web3-wallet/core';
import WalletSelector from '../components/WalletSelector.js';
import ChainSelector from '../components/ChainSelector.js';
import ErrorDisplay from '../components/ErrorDisplay.js';
import { balanceService, chainService, tokenService } from '../lib/service-factory.js';

export const description = 'Check wallet balance';

export const options = zod.object({
	address: zod.string().optional().describe('Wallet address'),
	chain: zod.number().optional().describe('Chain ID'),
	token: zod.string().optional().describe('ERC-20 token address'),
});

type Props = {
	options: zod.infer<typeof options>;
};

interface TokenBalance {
	symbol: string;
	balance: string;
}

type Step = 'select-wallet' | 'select-chain' | 'loading' | 'done' | 'error';

export default function Balance({ options: opts }: Props) {
	const [step, setStep] = useState<Step>(
		opts.address
			? opts.chain
				? 'loading'
				: 'select-chain'
			: 'select-wallet',
	);
	const [address, setAddress] = useState(opts.address ?? '');
	const [chain, setChain] = useState<ChainConfig | null>(null);
	const [balance, setBalance] = useState('');
	const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
	const [error, setError] = useState('');

	function handleWalletSelect(addr: string) {
		setAddress(addr);
		if (opts.chain) {
			loadWithChainId(addr, opts.chain);
		} else {
			setStep('select-chain');
		}
	}

	function handleChainSelect(selected: ChainConfig) {
		setChain(selected);
		loadBalance(address, selected);
	}

	async function loadWithChainId(addr: string, chainId: number) {
		setStep('loading');
		try {
			const selectedChain = await chainService.getChain(chainId);
			if (!selectedChain) {
				setError(`Chain ${chainId} not found`);
				setStep('error');
				return;
			}
			setChain(selectedChain);
			await loadBalance(addr, selectedChain);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setStep('error');
		}
	}

	async function loadBalance(addr: string, selectedChain: ChainConfig) {
		setStep('loading');
		try {
			const nativeBalance = await balanceService.getNativeBalance(addr, selectedChain);
			setBalance(nativeBalance);

			const results: TokenBalance[] = [];

			if (opts.token) {
				// Explicit --token flag: only show that one
				const info = await balanceService.getTokenInfo(opts.token, selectedChain);
				const tokenBalance = await balanceService.getTokenBalance(
					addr,
					{ address: opts.token, symbol: info.symbol, decimals: info.decimals, chainId: selectedChain.id },
					selectedChain,
				);
				results.push({ symbol: info.symbol, balance: tokenBalance });
			} else {
				// Auto-fetch saved tokens for this chain
				const savedTokens = await tokenService.getTokens(selectedChain.id);
				const settled = await Promise.allSettled(
					savedTokens.map(async (token) => {
						const bal = await balanceService.getTokenBalance(addr, token, selectedChain);
						return { symbol: token.symbol, balance: bal };
					}),
				);
				for (const result of settled) {
					if (result.status === 'fulfilled') {
						results.push(result.value);
					}
				}
			}

			setTokenBalances(results);
			setStep('done');
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setStep('error');
		}
	}

	// Auto-trigger when both address and chain are provided via options
	if (step === 'loading' && !chain && opts.chain && opts.address) {
		loadWithChainId(opts.address, opts.chain);
		return <Spinner label="Loading balance..." />;
	}

	if (step === 'select-wallet') {
		return <WalletSelector onSelect={handleWalletSelect} />;
	}

	if (step === 'select-chain') {
		return <ChainSelector onSelect={handleChainSelect} />;
	}

	if (step === 'loading') {
		return <Spinner label="Loading balance..." />;
	}

	if (step === 'error') {
		return <ErrorDisplay error={error} />;
	}

	const nonZeroTokens = tokenBalances.filter((t) => parseFloat(t.balance) > 0);

	return (
		<Box flexDirection="column" marginTop={1}>
			<Text bold color="green">Balance</Text>
			<Text><Text bold>Address:</Text> {address}</Text>
			<Text><Text bold>Chain:</Text> {chain?.name} (ID: {chain?.id})</Text>
			<Text><Text bold>{chain?.symbol}:</Text> {balance}</Text>
			{nonZeroTokens.map((t) => (
				<Text key={t.symbol}><Text bold>{t.symbol}:</Text> {t.balance}</Text>
			))}
		</Box>
	);
}
