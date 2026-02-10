import React, { useState, useEffect } from 'react';
import { Text } from 'ink';
import zod from 'zod';
import SuccessDisplay from '../../components/SuccessDisplay.js';
import ErrorDisplay from '../../components/ErrorDisplay.js';
import { chainService } from '../../lib/service-factory.js';

export const description = 'Add a custom chain';

export const options = zod.object({
	id: zod.number().describe('Chain ID'),
	name: zod.string().describe('Chain name'),
	symbol: zod.string().describe('Native token symbol'),
	rpc: zod.string().describe('RPC URL'),
	decimals: zod.number().default(18).describe('Token decimals'),
});

type Props = {
	options: zod.infer<typeof options>;
};

export default function AddChain({ options: opts }: Props) {
	const [done, setDone] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		chainService
			.addChain({
				id: opts.id,
				name: opts.name,
				symbol: opts.symbol,
				rpcUrl: opts.rpc,
				decimals: opts.decimals,
			})
			.then(() => setDone(true))
			.catch((err: unknown) => {
				setError(err instanceof Error ? err.message : String(err));
			});
	}, []);

	if (error) return <ErrorDisplay error={error} />;
	if (!done) return <Text>Adding chain...</Text>;

	return (
		<SuccessDisplay
			title="Chain added successfully!"
			fields={{
				ID: String(opts.id),
				Name: opts.name,
				Symbol: opts.symbol,
				'RPC URL': opts.rpc,
			}}
		/>
	);
}
