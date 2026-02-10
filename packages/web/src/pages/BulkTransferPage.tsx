import { useState, useCallback } from 'react';
import { useServices } from '../hooks/use-services.js';
import { useAsync } from '../hooks/use-async.js';
import { usePasswordDialog } from '../hooks/use-password-dialog.js';
import { PasswordDialog } from '../components/PasswordDialog.js';
import { WalletSelector } from '../components/WalletSelector.js';
import { ChainSelector } from '../components/ChainSelector.js';
import { TokenSelector } from '../components/TokenSelector.js';
import { FileUpload } from '../components/FileUpload.js';
import { TransferProgress } from '../components/TransferProgress.js';
import { Alert } from '../components/Alert.js';
import { parseTransferExcelFromBuffer, type TokenConfig, type TransferRequest, type TransferResult } from '@web3-wallet/core';

export function BulkTransferPage() {
  const { transferService, chainService } = useServices();
  const pwd = usePasswordDialog();

  const [from, setFrom] = useState('');
  const [chainId, setChainId] = useState<number | ''>('');
  const [tokenValue, setTokenValue] = useState('__native__');
  const [selectedToken, setSelectedToken] = useState<TokenConfig | null>(null);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);

  const results = useAsync<TransferResult[]>();

  function handleTokenChange(value: string, token: TokenConfig | null) {
    setTokenValue(value);
    setSelectedToken(token);
  }

  const handleFile = useCallback(async (buffer: ArrayBuffer) => {
    try {
      setParseError(null);
      const parsed = await parseTransferExcelFromBuffer(buffer);
      setTransfers(parsed);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : String(err));
      setTransfers([]);
    }
  }, []);

  async function handleSend() {
    if (!from || !chainId || transfers.length === 0) return;
    const chain = await chainService.getChain(chainId);
    if (!chain) return;

    try {
      const password = await pwd.requestPassword();
      setProgress({ completed: 0, total: transfers.length });
      await results.run(() =>
        transferService.bulkTransfer(
          from,
          password,
          transfers,
          chain,
          selectedToken ?? undefined,
          (completed, total) => {
            setProgress({ completed, total });
          },
        ),
      );
    } catch {
      // cancelled
    }
  }

  function handleReset() {
    results.reset();
    setTransfers([]);
    setProgress(null);
    setTokenValue('__native__');
    setSelectedToken(null);
  }

  const succeeded = results.data?.filter((r) => r.success).length ?? 0;
  const failed = results.data?.filter((r) => !r.success).length ?? 0;
  const displaySymbol = selectedToken?.symbol ?? '';

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Bulk Transfer</h2>

      {results.data ? (
        <div className="space-y-4">
          <Alert
            type={failed === 0 ? 'success' : 'error'}
            title={`${succeeded} succeeded, ${failed} failed`}
          />
          <ul className="space-y-1 max-h-80 overflow-y-auto">
            {results.data.map((r, i) => (
              <li
                key={i}
                className={`text-xs font-mono p-2 rounded ${
                  r.success ? 'bg-green-950 text-green-300' : 'bg-red-950 text-red-300'
                }`}
              >
                {r.to} &middot; {r.amount}{displaySymbol ? ` ${displaySymbol}` : ''} &middot;{' '}
                {r.success ? r.txHash : r.error}
              </li>
            ))}
          </ul>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white"
          >
            New Bulk Transfer
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

          <div>
            <span className="text-sm text-gray-400 block mb-1">Excel File</span>
            <FileUpload onFile={handleFile} />
          </div>

          {parseError && <Alert type="error" title={parseError} />}

          {transfers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                {transfers.length} transfer{transfers.length !== 1 ? 's' : ''} loaded
              </p>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {transfers.map((t, i) => (
                  <li key={i} className="text-xs font-mono text-gray-500">
                    {t.to} &middot; {t.amount}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {progress && <TransferProgress completed={progress.completed} total={progress.total} />}

          <button
            onClick={handleSend}
            disabled={results.loading || !from || !chainId || transfers.length === 0}
            className="w-full px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {results.loading ? 'Sending...' : `Send All${selectedToken ? ` (${selectedToken.symbol})` : ''}`}
          </button>
          {results.error && <Alert type="error" title={results.error} />}
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
