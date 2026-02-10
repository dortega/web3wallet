import React from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { useAsync } from '../../lib/hooks.js';
import { chainService } from '../../lib/service-factory.js';
import ErrorDisplay from '../../components/ErrorDisplay.js';

export const description = 'List configured chains';

export default function Chains() {
	const { data: chains, loading, error } = useAsync(() => chainService.getChains());

	if (loading) return <Spinner label="Loading chains..." />;
	if (error) return <ErrorDisplay error={error.message} />;
	if (!chains || chains.length === 0) {
		return <Text color="yellow">No chains configured</Text>;
	}

	return (
		<Box flexDirection="column">
			<Text bold>Configured Chains</Text>
			<Text> </Text>
			<Text bold>
				{'ID'.padEnd(12)}{'Name'.padEnd(20)}{'Symbol'.padEnd(10)}{'RPC URL'}
			</Text>
			<Text>{'─'.repeat(70)}</Text>
			{chains.map((c) => (
				<Text key={c.id}>
					{String(c.id).padEnd(12)}
					{c.name.padEnd(20)}
					{c.symbol.padEnd(10)}
					{c.rpcUrl}
				</Text>
			))}
		</Box>
	);
}
