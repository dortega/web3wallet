import React from 'react';
import { Box, Text } from 'ink';
import type { TransferResult } from '@web3-wallet/core';

interface Props {
	completed: number;
	total: number;
	results: TransferResult[];
}

export default function TransferProgress({ completed, total, results }: Props) {
	const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
	const succeeded = results.filter((r) => r.success).length;
	const failed = results.filter((r) => !r.success).length;

	return (
		<Box flexDirection="column">
			<Text>
				Progress: {completed}/{total} ({percentage}%)
			</Text>
			<Text>
				[{'='.repeat(Math.floor(percentage / 5))}
				{' '.repeat(20 - Math.floor(percentage / 5))}]
			</Text>
			{completed > 0 && (
				<Text>
					<Text color="green">{succeeded} succeeded</Text>
					{failed > 0 && <Text color="red"> | {failed} failed</Text>}
				</Text>
			)}
		</Box>
	);
}
