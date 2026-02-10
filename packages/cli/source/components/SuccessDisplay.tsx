import React from 'react';
import { Box, Text } from 'ink';

interface Props {
	title: string;
	fields?: Record<string, string>;
	warning?: string;
}

export default function SuccessDisplay({ title, fields, warning }: Props) {
	return (
		<Box flexDirection="column" marginTop={1}>
			<Text color="green" bold>{title}</Text>
			{fields && Object.entries(fields).map(([key, value]) => (
				<Text key={key}>
					<Text bold>{key}:</Text> {value}
				</Text>
			))}
			{warning && (
				<Box marginTop={1}>
					<Text color="yellow" bold>Warning: </Text>
					<Text color="yellow">{warning}</Text>
				</Box>
			)}
		</Box>
	);
}
