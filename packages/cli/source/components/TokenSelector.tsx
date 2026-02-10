import React from 'react';
import { Box, Text } from 'ink';
import { Select } from '@inkjs/ui';
import type { ChainConfig, TokenConfig } from '@web3-wallet/core';
import { useAsync } from '../lib/hooks.js';
import { tokenService } from '../lib/service-factory.js';

interface Props {
	chain: ChainConfig;
	onSelect: (token: TokenConfig | null) => void;
}

export default function TokenSelector({ chain, onSelect }: Props) {
	const { data: tokens, loading, error } = useAsync(
		() => tokenService.getTokens(chain.id),
		[chain.id],
	);

	if (loading) return <Text>Loading tokens...</Text>;
	if (error) return <Text color="red">Error: {error.message}</Text>;

	const options = [
		{ label: `Native (${chain.symbol})`, value: '__native__' },
		...(tokens ?? []).map((t) => ({
			label: `${t.symbol} (${t.address.slice(0, 6)}...${t.address.slice(-4)})`,
			value: t.address,
		})),
	];

	return (
		<Box flexDirection="column">
			<Text>Select token:</Text>
			<Select
				options={options}
				onChange={(value) => {
					if (value === '__native__') {
						onSelect(null);
					} else {
						const token = tokens?.find((t) => t.address === value);
						if (token) onSelect(token);
					}
				}}
			/>
		</Box>
	);
}
