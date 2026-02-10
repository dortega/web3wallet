import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { PasswordInput } from '@inkjs/ui';

interface Props {
	confirm?: boolean;
	onSubmit: (password: string) => void;
}

export default function PasswordPrompt({ confirm = false, onSubmit }: Props) {
	const [password, setPassword] = useState('');
	const [step, setStep] = useState<'enter' | 'confirm'>('enter');
	const [error, setError] = useState('');

	function handleSubmit(value: string) {
		if (step === 'enter') {
			if (value.length < 8) {
				setError('Password must be at least 8 characters');
				return;
			}
			if (!confirm) {
				onSubmit(value);
				return;
			}
			setPassword(value);
			setStep('confirm');
			setError('');
		} else {
			if (value !== password) {
				setError('Passwords do not match');
				setStep('enter');
				setPassword('');
				return;
			}
			onSubmit(value);
		}
	}

	return (
		<Box flexDirection="column">
			<Text>
				{step === 'enter' ? 'Enter password: ' : 'Confirm password: '}
			</Text>
			<PasswordInput
				key={step}
				placeholder="********"
				onSubmit={handleSubmit}
			/>
			{error && <Text color="red">{error}</Text>}
		</Box>
	);
}
