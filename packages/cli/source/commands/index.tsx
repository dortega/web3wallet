import React from 'react';
import { Box, Text } from 'ink';

export default function Index() {
	return (
		<Box flexDirection="column" gap={1}>
			<Text bold color="cyan">
				w3w - Web3 Wallet CLI
			</Text>
			<Text>Multi-chain EVM wallet manager</Text>
			<Box flexDirection="column">
				<Text bold>Commands:</Text>
				<Text>  create          Create a new wallet</Text>
				<Text>  import          Import wallet from private key</Text>
				<Text>  export          Export private key</Text>
				<Text>  public-key      Show public key</Text>
				<Text>  balance         Check wallet balance</Text>
				<Text>  transfer        Transfer tokens</Text>
				<Text>  bulk-transfer   Bulk transfer from Excel file</Text>
				<Text>  chains          Manage chain configurations</Text>
			</Box>
			<Text dimColor>Run w3w {'<command>'} --help for more info</Text>
		</Box>
	);
}
