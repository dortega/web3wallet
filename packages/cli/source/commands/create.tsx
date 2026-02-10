import React, { useState } from 'react';
import { Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import PasswordPrompt from '../components/PasswordPrompt.js';
import SuccessDisplay from '../components/SuccessDisplay.js';
import ErrorDisplay from '../components/ErrorDisplay.js';
import { walletService } from '../lib/service-factory.js';

export const description = 'Create a new wallet';

type Step = 'password' | 'creating' | 'done' | 'error';

export default function Create() {
	const [step, setStep] = useState<Step>('password');
	const [result, setResult] = useState<{
		address: string;
		publicKey: string;
		privateKey: string;
	} | null>(null);
	const [error, setError] = useState('');

	async function handlePassword(password: string) {
		setStep('creating');
		try {
			const wallet = await walletService.create(password);
			setResult(wallet);
			setStep('done');
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setStep('error');
		}
	}

	if (step === 'password') {
		return <PasswordPrompt confirm onSubmit={handlePassword} />;
	}

	if (step === 'creating') {
		return <Spinner label="Encrypting wallet..." />;
	}

	if (step === 'error') {
		return <ErrorDisplay error={error} />;
	}

	if (result) {
		return (
			<SuccessDisplay
				title="Wallet created successfully!"
				fields={{
					Address: result.address,
					'Public Key': result.publicKey,
					'Private Key': result.privateKey,
				}}
				warning="Save your private key securely. It will not be shown again."
			/>
		);
	}

	return null;
}
