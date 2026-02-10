import React, { useState } from 'react';
import { Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import zod from 'zod';
import WalletSelector from '../components/WalletSelector.js';
import PasswordPrompt from '../components/PasswordPrompt.js';
import SuccessDisplay from '../components/SuccessDisplay.js';
import ErrorDisplay from '../components/ErrorDisplay.js';
import { walletService } from '../lib/service-factory.js';

export const description = 'Show public key of a wallet';

export const options = zod.object({
	address: zod.string().optional().describe('Wallet address'),
});

type Props = {
	options: zod.infer<typeof options>;
};

type Step = 'select-wallet' | 'password' | 'decrypting' | 'done' | 'error';

export default function PublicKey({ options: opts }: Props) {
	const [step, setStep] = useState<Step>(opts.address ? 'password' : 'select-wallet');
	const [address, setAddress] = useState(opts.address ?? '');
	const [publicKey, setPublicKey] = useState('');
	const [error, setError] = useState('');

	function handleWalletSelect(addr: string) {
		setAddress(addr);
		setStep('password');
	}

	async function handlePassword(password: string) {
		setStep('decrypting');
		try {
			const key = await walletService.getPublicKey(address, password);
			setPublicKey(key);
			setStep('done');
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setStep('error');
		}
	}

	if (step === 'select-wallet') {
		return <WalletSelector onSelect={handleWalletSelect} />;
	}

	if (step === 'password') {
		return <PasswordPrompt onSubmit={handlePassword} />;
	}

	if (step === 'decrypting') {
		return <Spinner label="Decrypting wallet..." />;
	}

	if (step === 'error') {
		return <ErrorDisplay error={error} />;
	}

	return (
		<SuccessDisplay
			title="Public key"
			fields={{
				Address: address,
				'Public Key': publicKey,
			}}
		/>
	);
}
