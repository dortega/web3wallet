import { useState, useEffect } from 'react';
import { useServices } from '../hooks/use-services.js';
import { useAsync } from '../hooks/use-async.js';
import { usePasswordDialog } from '../hooks/use-password-dialog.js';
import { PasswordDialog } from '../components/PasswordDialog.js';
import { WalletSelector } from '../components/WalletSelector.js';
import { ChainSelector } from '../components/ChainSelector.js';
import { TokenSelector } from '../components/TokenSelector.js';
import { Alert } from '../components/Alert.js';
import type { TokenConfig, TransferResult } from '@web3-wallet/core';

function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export function TransferPage() {
  const { transferService, chainService, balanceService } = useServices();
  const { data, error, loading, run, reset } = useAsync<TransferResult>();
  const pwd = usePasswordDialog();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [chainId, setChainId] = useState<number | ''>('');
  const [tokenValue, setTokenValue] = useState('__native__');
  const [selectedToken, setSelectedToken] = useState<TokenConfig | null>(null);
  const [maxBalance, setMaxBalance] = useState<string | null>(null);

  function handleTokenChange(value: string, token: TokenConfig | null) {
    setTokenValue(value);
    setSelectedToken(token);
  }

  useEffect(() => {
    if (!from || !chainId) {
      setMaxBalance(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const chain = await chainService.getChain(chainId);
        if (!chain || cancelled) return;
        const bal = selectedToken
          ? await balanceService.getTokenBalance(from, selectedToken, chain)
          : await balanceService.getNativeBalance(from, chain);
        if (!cancelled) setMaxBalance(bal);
      } catch {
        if (!cancelled) setMaxBalance(null);
      }
    })();
    return () => { cancelled = true; };
  }, [from, chainId, selectedToken, chainService, balanceService]);

  const toValid = to.length > 0 && isValidAddress(to);

  async function handleTransfer() {
    if (!from || !to || !amount || !chainId || !toValid) return;
    const chain = await chainService.getChain(chainId);
    if (!chain) return;

    try {
      const password = await pwd.requestPassword();
      await run(() =>
        selectedToken
          ? transferService.transferToken(from, password, to, amount, selectedToken, chain)
          : transferService.transferNative(from, password, to, amount, chain),
      );
    } catch {
      // cancelled
    }
  }

  function handleReset() {
    reset();
    setTokenValue('__native__');
    setSelectedToken(null);
  }

  const displaySymbol = selectedToken ? selectedToken.symbol : '';

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold mb-6">Transfer</h2>

      {data ? (
        <div className="space-y-4">
          <Alert
            type={data.success ? 'success' : 'error'}
            title={data.success ? 'Transfer sent' : 'Transfer failed'}
            fields={[
              { label: 'To', value: data.to },
              { label: 'Amount', value: `${data.amount}${displaySymbol ? ` ${displaySymbol}` : ''}` },
              ...(data.txHash ? [{ label: 'Tx Hash', value: data.txHash }] : []),
              ...(data.error ? [{ label: 'Error', value: data.error }] : []),
            ]}
          />
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white"
          >
            New Transfer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-gray-400">From</span>
            <WalletSelector value={from} onChange={setFrom} className="w-full mt-1" />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">Chain</span>
            <ChainSelector value={chainId} onChange={setChainId} className="w-full mt-1" />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">Asset</span>
            <TokenSelector
              chainId={chainId}
              value={tokenValue}
              onChange={handleTokenChange}
              className="w-full mt-1"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">To</span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x..."
              className={`w-full mt-1 bg-gray-800 border rounded-md px-3 py-2 text-sm font-mono focus:outline-none ${
                to && !toValid ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-blue-500'
              }`}
            />
            {to && !toValid && (
              <span className="text-xs text-red-400 mt-1 block">Invalid Ethereum address</span>
            )}
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">Amount</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            {maxBalance !== null && (
              <button
                type="button"
                onClick={() => setAmount(maxBalance)}
                className="mt-1 text-xs text-gray-500 hover:text-blue-400 transition-colors"
              >
                Max: {maxBalance} {selectedToken?.symbol ?? ''}
              </button>
            )}
          </label>
          <button
            onClick={handleTransfer}
            disabled={loading || !from || !toValid || !amount || !chainId}
            className="w-full px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {loading ? 'Sending...' : `Send${selectedToken ? ` ${selectedToken.symbol}` : ''}`}
          </button>
          {error && <Alert type="error" title={error} />}
        </div>
      )}

      <PasswordDialog
        open={pwd.open}
        confirm={pwd.confirm}
        onSubmit={pwd.submit}
        onCancel={pwd.cancel}
      />
    </div>
  );
}
