import React from 'react';
import { Box, Text } from 'ink';

interface Props {
	error: string;
}

export default function ErrorDisplay({ error }: Props) {
	return (
		<Box flexDirection="column" marginTop={1}>
			<Text color="red" bold>Error:</Text>
			<Text color="red">{error}</Text>
		</Box>
	);
}
