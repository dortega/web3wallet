import React, { useState, useEffect } from 'react';
import { Text } from 'ink';
import zod from 'zod';
import { argument } from 'pastel';
import SuccessDisplay from '../../components/SuccessDisplay.js';
import ErrorDisplay from '../../components/ErrorDisplay.js';
import { chainService } from '../../lib/service-factory.js';

export const description = 'Remove a chain';

export const args = zod.tuple([
	zod.number().describe(
		argument({
			name: 'chainId',
			description: 'Chain ID to remove',
		}),
	),
]);

type Props = {
	args: zod.infer<typeof args>;
};

export default function RemoveChain({ args: [chainId] }: Props) {
	const [done, setDone] = useState(false);
	const [removed, setRemoved] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		chainService
			.removeChain(chainId)
			.then((result) => {
				setRemoved(result);
				setDone(true);
			})
			.catch((err: unknown) => {
				setError(err instanceof Error ? err.message : String(err));
			});
	}, []);

	if (error) return <ErrorDisplay error={error} />;
	if (!done) return <Text>Removing chain...</Text>;

	if (!removed) {
		return <Text color="yellow">Chain {chainId} not found</Text>;
	}

	return (
		<SuccessDisplay
			title={`Chain ${chainId} removed successfully!`}
		/>
	);
}
