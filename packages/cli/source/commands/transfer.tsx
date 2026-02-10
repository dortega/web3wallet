import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { TextInput, Spinner, ConfirmInput } from '@inkjs/ui';
import zod from 'zod';
import type { ChainConfig, TokenConfig } from '@web3-wallet/core';
import WalletSelector from '../components/WalletSelector.js';
import ChainSelector from '../components/ChainSelector.js';
import TokenSelector from '../components/TokenSelector.js';
import PasswordPrompt from '../components/PasswordPrompt.js';
import SuccessDisplay from '../components/SuccessDisplay.js';
import ErrorDisplay from '../components/ErrorDisplay.js';
import { transferService, balanceService, chainService } from '../lib/service-factory.js';

export const description = 'Transfer native tokens or ERC-20';

export const options = zod.object({
	from: zod.string().optional().describe('Sender address'),
	to: zod.string().optional().describe('Recipient address'),
	amount: zod.string().optional().describe('Amount to send'),
	chain: zod.number().optional().describe('Chain ID'),
	token: zod.string().optional().describe('ERC-20 token address'),
});

type Props = {
	options: zod.infer<typeof options>;
};

type Step =
	| 'select-wallet'
	| 'select-chain'
	| 'select-token'
	| 'input-to'
	| 'input-amount'
	| 'confirm'
	| 'password'
	| 'sending'
	| 'done'
	| 'error';

export default function Transfer({ options: opts }: Props) {
	const [step, setStep] = useState<Step>(
		opts.from ? (opts.chain ? (opts.to ? (opts.amount ? 'confirm' : 'input-amount') : 'input-to') : 'select-chain') : 'select-wallet',
	);
	const [from, setFrom] = useState(opts.from ?? '');
	const [to, setTo] = useState(opts.to ?? '');
	const [amount, setAmount] = useState(opts.amount ?? '');
	const [chain, setChain] = useState<ChainConfig | null>(null);
	const [selectedToken, setSelectedToken] = useState<TokenConfig | null>(null);
	const [txHash, setTxHash] = useState('');
	const [error, setError] = useState('');

	const nextAfterToken = opts.to ? (opts.amount ? 'confirm' : 'input-amount') : 'input-to';

	function handleWalletSelect(addr: string) {
		setFrom(addr);
		if (opts.chain) {
			resolveChain(opts.chain);
		} else {
			setStep('select-chain');
		}
	}

	async function resolveChain(chainId: number) {
		const c = await chainService.getChain(chainId);
		if (!c) {
			setError(`Chain ${chainId} not found`);
			setStep('error');
			return;
		}
		setChain(c);
		if (opts.token) {
			// --token flag: resolve it and skip selection
			const info = await balanceService.getTokenInfo(opts.token, c);
			setSelectedToken({ address: opts.token, symbol: info.symbol, decimals: info.decimals, chainId: c.id });
			setStep(nextAfterToken);
		} else {
			setStep('select-token');
		}
	}

	function handleChainSelect(c: ChainConfig) {
		setChain(c);
		if (opts.token) {
			resolveTokenFlag(c);
		} else {
			setStep('select-token');
		}
	}

	async function resolveTokenFlag(c: ChainConfig) {
		try {
			const info = await balanceService.getTokenInfo(opts.token!, c);
			setSelectedToken({ address: opts.token!, symbol: info.symbol, decimals: info.decimals, chainId: c.id });
			setStep(nextAfterToken);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setStep('error');
		}
	}

	function handleTokenSelect(token: TokenConfig | null) {
		setSelectedToken(token);
		setStep(nextAfterToken);
	}

	function handleToSubmit(value: string) {
		setTo(value);
		setStep(opts.amount ? 'confirm' : 'input-amount');
	}

	function handleAmountSubmit(value: string) {
		setAmount(value);
		setStep('confirm');
	}

	function handleConfirm() {
		setStep('password');
	}

	function handleCancel() {
		setError('Transfer cancelled');
		setStep('error');
	}

	async function handlePassword(password: string) {
		setStep('sending');
		try {
			let result;
			if (selectedToken && chain) {
				result = await transferService.transferToken(
					from, password, to, amount, selectedToken, chain,
				);
			} else if (chain) {
				result = await transferService.transferNative(from, password, to, amount, chain);
			}
			setTxHash(result?.txHash ?? '');
			setStep('done');
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setStep('error');
		}
	}

	if (step === 'select-wallet') return <WalletSelector onSelect={handleWalletSelect} />;
	if (step === 'select-chain') return <ChainSelector onSelect={handleChainSelect} />;
	if (step === 'select-token' && chain) return <TokenSelector chain={chain} onSelect={handleTokenSelect} />;

	if (step === 'input-to') {
		return (
			<Box flexDirection="column">
				<Text>Recipient address:</Text>
				<TextInput key="input-to" onSubmit={handleToSubmit} />
			</Box>
		);
	}

	if (step === 'input-amount') {
		return (
			<Box flexDirection="column">
				<Text>Amount to send:</Text>
				<TextInput key="input-amount" onSubmit={handleAmountSubmit} />
			</Box>
		);
	}

	const displaySymbol = selectedToken ? selectedToken.symbol : chain?.symbol ?? '';

	if (step === 'confirm') {
		return (
			<Box flexDirection="column">
				<Text bold>Transfer Summary</Text>
				<Text>From:   {from}</Text>
				<Text>To:     {to}</Text>
				<Text>Amount: {amount} {displaySymbol}</Text>
				<Text>Chain:  {chain?.name ?? `ID ${opts.chain}`}</Text>
				{selectedToken && <Text>Token:  {selectedToken.symbol} ({selectedToken.address})</Text>}
				<Box marginTop={1}>
					<Text>Confirm? </Text>
					<ConfirmInput onConfirm={handleConfirm} onCancel={handleCancel} />
				</Box>
			</Box>
		);
	}

	if (step === 'password') return <PasswordPrompt onSubmit={handlePassword} />;
	if (step === 'sending') return <Spinner label="Sending transaction..." />;
	if (step === 'error') return <ErrorDisplay error={error} />;

	return (
		<SuccessDisplay
			title="Transfer successful!"
			fields={{
				'Tx Hash': txHash,
				From: from,
				To: to,
				Amount: `${amount} ${displaySymbol}`,
			}}
		/>
	);
}
