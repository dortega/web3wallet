import { useState, useEffect } from 'react';

interface AsyncState<T> {
	data: T | null;
	error: Error | null;
	loading: boolean;
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
	const [state, setState] = useState<AsyncState<T>>({
		data: null,
		error: null,
		loading: true,
	});

	useEffect(() => {
		let cancelled = false;

		setState({ data: null, error: null, loading: true });

		fn()
			.then((data) => {
				if (!cancelled) setState({ data, error: null, loading: false });
			})
			.catch((error: unknown) => {
				if (!cancelled) {
					setState({
						data: null,
						error: error instanceof Error ? error : new Error(String(error)),
						loading: false,
					});
				}
			});

		return () => {
			cancelled = true;
		};
	}, deps);

	return state;
}
