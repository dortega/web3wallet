import React from 'react';
import { Box, Text } from 'ink';
import { Select } from '@inkjs/ui';
import type { ChainConfig } from '@web3-wallet/core';
import { useAsync } from '../lib/hooks.js';
import { chainService } from '../lib/service-factory.js';

interface Props {
	onSelect: (chain: ChainConfig) => void;
}

export default function ChainSelector({ onSelect }: Props) {
	const { data: chains, loading, error } = useAsync(() => chainService.getChains());

	if (loading) return <Text>Loading chains...</Text>;
	if (error) return <Text color="red">Error: {error.message}</Text>;
	if (!chains || chains.length === 0) return <Text color="yellow">No chains configured</Text>;

	return (
		<Box flexDirection="column">
			<Text>Select chain:</Text>
			<Select
				options={chains.map((c) => ({
					label: `${c.name} (${c.symbol}) - Chain ID: ${c.id}`,
					value: String(c.id),
				}))}
				onChange={(value) => {
					const chain = chains.find((c) => String(c.id) === value);
					if (chain) onSelect(chain);
				}}
			/>
		</Box>
	);
}
