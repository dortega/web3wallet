import React from 'react';
import { Box, Text } from 'ink';
import { Select } from '@inkjs/ui';
import { useAsync } from '../lib/hooks.js';
import { walletService } from '../lib/service-factory.js';

interface Props {
	onSelect: (address: string) => void;
}

export default function WalletSelector({ onSelect }: Props) {
	const { data: wallets, loading, error } = useAsync(() => walletService.listWallets());

	if (loading) return <Text>Loading wallets...</Text>;
	if (error) return <Text color="red">Error: {error.message}</Text>;
	if (!wallets || wallets.length === 0) {
		return <Text color="yellow">No wallets found. Create one with: w3w create</Text>;
	}

	return (
		<Box flexDirection="column">
			<Text>Select wallet:</Text>
			<Select
				options={wallets.map((addr) => ({
					label: addr,
					value: addr,
				}))}
				onChange={onSelect}
			/>
		</Box>
	);
}
