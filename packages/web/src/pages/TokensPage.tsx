import { useEffect, useState, type FormEvent } from 'react';
import { useServices } from '../hooks/use-services.js';
import { useAsync } from '../hooks/use-async.js';
import { Alert } from '../components/Alert.js';
import { ChainSelector } from '../components/ChainSelector.js';
import type { TokenConfig, ChainConfig } from '@web3-wallet/core';

export function TokensPage() {
  const { tokenService, balanceService, chainService } = useServices();
  const [tokens, setTokens] = useState<TokenConfig[]>([]);
  const [chains, setChains] = useState<ChainConfig[]>([]);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; title: string } | null>(null);

  // Add token form
  const [showForm, setShowForm] = useState(false);
  const [addChainId, setAddChainId] = useState<number | ''>('');
  const [contractAddress, setContractAddress] = useState('');
  const detect = useAsync<{ name: string; symbol: string; decimals: number }>();

  async function loadTokens() {
    setTokens(await tokenService.getTokens());
    setChains(await chainService.getChains());
  }

  useEffect(() => {
    loadTokens();
  }, [tokenService, chainService]);

  async function handleDetect() {
    if (!addChainId || !contractAddress.trim()) return;
    const chain = chains.find((c) => c.id === addChainId);
    if (!chain) return;
    await detect.run(() => balanceService.getTokenInfo(contractAddress.trim(), chain));
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!detect.data || !addChainId || !contractAddress.trim()) return;
    try {
      await tokenService.addToken({
        address: contractAddress.trim(),
        symbol: detect.data.symbol,
        decimals: detect.data.decimals,
        chainId: addChainId,
      });
      setAlert({ type: 'success', title: `${detect.data.symbol} added` });
      setShowForm(false);
      setContractAddress('');
      setAddChainId('');
      detect.reset();
      await loadTokens();
    } catch (err) {
      setAlert({ type: 'error', title: err instanceof Error ? err.message : String(err) });
    }
  }

  async function handleRemove(chainId: number, address: string, symbol: string) {
    await tokenService.removeToken(chainId, address);
    setAlert({ type: 'success', title: `${symbol} removed` });
    await loadTokens();
  }

  const chainById = new Map(chains.map((c) => [c.id, c]));

  // Group tokens by chain
  const grouped = new Map<number, TokenConfig[]>();
  for (const token of tokens) {
    const list = grouped.get(token.chainId) ?? [];
    list.push(token);
    grouped.set(token.chainId, list);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Tokens</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white"
        >
          Add Token
        </button>
      </div>

      {alert && (
        <div className="mb-4">
          <Alert {...alert} onDismiss={() => setAlert(null)} />
        </div>
      )}

      {/* Add token form */}
      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 p-4 border border-gray-800 rounded-lg space-y-3">
          <label className="block">
            <span className="text-xs text-gray-400">Chain</span>
            <ChainSelector value={addChainId} onChange={setAddChainId} className="w-full mt-1" />
          </label>
          <label className="block">
            <span className="text-xs text-gray-400">Contract Address</span>
            <input
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0x..."
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
            />
          </label>

          <button
            type="button"
            onClick={handleDetect}
            disabled={!addChainId || !contractAddress.trim() || detect.loading}
            className="px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
          >
            {detect.loading ? 'Detecting...' : 'Detect Token Info'}
          </button>

          {detect.error && <Alert type="error" title={detect.error} />}

          {detect.data && (
            <div className="p-3 rounded bg-gray-800 text-sm space-y-1">
              <p>
                <span className="text-gray-500">Name:</span> {detect.data.name}
              </p>
              <p>
                <span className="text-gray-500">Symbol:</span> {detect.data.symbol}
              </p>
              <p>
                <span className="text-gray-500">Decimals:</span> {detect.data.decimals}
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                detect.reset();
              }}
              className="px-4 py-2 text-sm rounded-md text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!detect.data}
              className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Token list grouped by chain */}
      {[...grouped.entries()].map(([chainId, chainTokens]) => {
        const chain = chainById.get(chainId);
        return (
          <div key={chainId} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">
              {chain?.name ?? `Chain ${chainId}`}
            </h3>
            <ul className="space-y-1">
              {chainTokens.map((token) => (
                <li
                  key={token.address}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-800"
                >
                  <div>
                    <span className="text-sm font-medium">{token.symbol}</span>
                    <span className="text-xs text-gray-600 ml-2">
                      {token.decimals} decimals
                    </span>
                    <p className="text-xs text-gray-700 font-mono truncate max-w-md">
                      {token.address}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(token.chainId, token.address, token.symbol)}
                    className="px-3 py-1 text-xs rounded bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
