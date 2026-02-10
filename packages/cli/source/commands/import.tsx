import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { PasswordInput, Spinner } from '@inkjs/ui';
import zod from 'zod';
import PasswordPrompt from '../components/PasswordPrompt.js';
import SuccessDisplay from '../components/SuccessDisplay.js';
import ErrorDisplay from '../components/ErrorDisplay.js';
import { walletService } from '../lib/service-factory.js';

export const description = 'Import wallet from private key';

export const options = zod.object({
	key: zod.string().optional().describe('Private key to import'),
});

type Props = {
	options: zod.infer<typeof options>;
};

type Step = 'key-input' | 'password' | 'importing' | 'done' | 'error';

export default function Import({ options: opts }: Props) {
	const [step, setStep] = useState<Step>(opts.key ? 'password' : 'key-input');
	const [privateKey, setPrivateKey] = useState(opts.key ?? '');
	const [address, setAddress] = useState('');
	const [error, setError] = useState('');

	function handleKeySubmit(value: string) {
		setPrivateKey(value);
		setStep('password');
	}

	async function handlePassword(password: string) {
		setStep('importing');
		try {
			const addr = await walletService.importFromPrivateKey(privateKey, password);
			setAddress(addr);
			setStep('done');
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setStep('error');
		}
	}

	if (step === 'key-input') {
		return (
			<Box flexDirection="column">
				<Text>Enter private key:</Text>
				<PasswordInput key="key-input" onSubmit={handleKeySubmit} />
			</Box>
		);
	}

	if (step === 'password') {
		return <PasswordPrompt confirm onSubmit={handlePassword} />;
	}

	if (step === 'importing') {
		return <Spinner label="Encrypting wallet..." />;
	}

	if (step === 'error') {
		return <ErrorDisplay error={error} />;
	}

	return (
		<SuccessDisplay
			title="Wallet imported successfully!"
			fields={{ Address: address }}
		/>
	);
}
