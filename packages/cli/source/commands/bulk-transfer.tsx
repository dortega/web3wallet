import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Spinner, ConfirmInput } from '@inkjs/ui';
import zod from 'zod';
import { argument } from 'pastel';
import type { ChainConfig, TokenConfig, TransferRequest, TransferResult } from '@web3-wallet/core';
import { parseTransferExcel } from '@web3-wallet/core';
import WalletSelector from '../components/WalletSelector.js';
import ChainSelector from '../components/ChainSelector.js';
import TokenSelector from '../components/TokenSelector.js';
import PasswordPrompt from '../components/PasswordPrompt.js';
import TransferProgress from '../components/TransferProgress.js';
import ErrorDisplay from '../components/ErrorDisplay.js';
import { transferService, balanceService, chainService } from '../lib/service-factory.js';

export const description = 'Bulk transfer from Excel file';

export const args = zod.tuple([
	zod.string().describe(
		argument({
			name: 'file',
			description: 'Path to Excel (.xlsx) file',
		}),
	),
]);

export const options = zod.object({
	from: zod.string().optional().describe('Sender address'),
	chain: zod.number().optional().describe('Chain ID'),
	token: zod.string().optional().describe('ERC-20 token address'),
});

type Props = {
	args: zod.infer<typeof args>;
	options: zod.infer<typeof options>;
};

type Step =
	| 'parsing'
	| 'select-wallet'
	| 'select-chain'
	| 'select-token'
	| 'summary'
	| 'password'
	| 'transferring'
	| 'done'
	| 'error';

export default function BulkTransfer({ args: [filePath], options: opts }: Props) {
	const [step, setStep] = useState<Step>('parsing');
	const [transfers, setTransfers] = useState<TransferRequest[]>([]);
	const [from, setFrom] = useState(opts.from ?? '');
	const [chain, setChain] = useState<ChainConfig | null>(null);
	const [selectedToken, setSelectedToken] = useState<TokenConfig | null>(null);
	const [completed, setCompleted] = useState(0);
	const [results, setResults] = useState<TransferResult[]>([]);
	const [error, setError] = useState('');

	useEffect(() => {
		parseTransferExcel(filePath)
			.then((parsed) => {
				setTransfers(parsed);
				if (opts.from) {
					if (opts.chain) {
						resolveChain(opts.chain);
					} else {
						setStep('select-chain');
					}
				} else {
					setStep('select-wallet');
				}
			})
			.catch((err: unknown) => {
				setError(err instanceof Error ? err.message : String(err));
				setStep('error');
			});
	}, []);

	async function resolveChain(chainId: number) {
		const c = await chainService.getChain(chainId);
		if (!c) {
			setError(`Chain ${chainId} not found`);
			setStep('error');
			return;
		}
		setChain(c);
		if (opts.token) {
			await resolveTokenFlag(c);
		} else {
			setStep('select-token');
		}
	}

	async function resolveTokenFlag(c: ChainConfig) {
		try {
			const info = await balanceService.getTokenInfo(opts.token!, c);
			setSelectedToken({ address: opts.token!, symbol: info.symbol, decimals: info.decimals, chainId: c.id });
			setStep('summary');
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setStep('error');
		}
	}

	function handleWalletSelect(addr: string) {
		setFrom(addr);
		if (opts.chain) {
			resolveChain(opts.chain);
		} else {
			setStep('select-chain');
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

	function handleTokenSelect(token: TokenConfig | null) {
		setSelectedToken(token);
		setStep('summary');
	}

	function handleConfirm() {
		setStep('password');
	}

	function handleCancel() {
		setError('Bulk transfer cancelled');
		setStep('error');
	}

	async function handlePassword(password: string) {
		if (!chain) return;
		setStep('transferring');
		try {
			const res = await transferService.bulkTransfer(
				from,
				password,
				transfers,
				chain,
				selectedToken ?? undefined,
				(done) => {
					setCompleted(done);
				},
			);
			setResults(res);
			setStep('done');
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setStep('error');
		}
	}

	if (step === 'parsing') return <Spinner label="Parsing Excel file..." />;
	if (step === 'select-wallet') return <WalletSelector onSelect={handleWalletSelect} />;
	if (step === 'select-chain') return <ChainSelector onSelect={handleChainSelect} />;
	if (step === 'select-token' && chain) return <TokenSelector chain={chain} onSelect={handleTokenSelect} />;

	const displaySymbol = selectedToken ? selectedToken.symbol : chain?.symbol ?? '';

	if (step === 'summary') {
		const totalAmount = transfers.reduce((sum, t) => sum + Number(t.amount), 0);
		return (
			<Box flexDirection="column">
				<Text bold>Bulk Transfer Summary</Text>
				<Text>File:         {filePath}</Text>
				<Text>From:         {from}</Text>
				<Text>Chain:        {chain?.name}</Text>
				<Text>Asset:        {displaySymbol}{selectedToken ? ` (${selectedToken.address})` : ' (native)'}</Text>
				<Text>Recipients:   {transfers.length}</Text>
				<Text>Total amount: {totalAmount} {displaySymbol}</Text>
				<Box marginTop={1}>
					<Text>Proceed? </Text>
					<ConfirmInput onConfirm={handleConfirm} onCancel={handleCancel} />
				</Box>
			</Box>
		);
	}

	if (step === 'password') return <PasswordPrompt onSubmit={handlePassword} />;

	if (step === 'transferring') {
		return (
			<TransferProgress
				completed={completed}
				total={transfers.length}
				results={results}
			/>
		);
	}

	if (step === 'error') return <ErrorDisplay error={error} />;

	const succeeded = results.filter((r) => r.success).length;
	const failed = results.filter((r) => !r.success).length;

	return (
		<Box flexDirection="column" marginTop={1}>
			<Text bold color="green">Bulk Transfer Complete</Text>
			<Text>Total:     {results.length}</Text>
			<Text color="green">Succeeded: {succeeded}</Text>
			{failed > 0 && <Text color="red">Failed:    {failed}</Text>}
			{results.filter((r) => !r.success).map((r, i) => (
				<Text key={i} color="red">
					  Failed: {r.to} - {r.error}
				</Text>
			))}
		</Box>
	);
}
