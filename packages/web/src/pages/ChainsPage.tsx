import { useEffect, useState, type FormEvent } from 'react';
import { useServices } from '../hooks/use-services.js';
import { Alert } from '../components/Alert.js';
import type { ChainConfig } from '@web3-wallet/core';

const emptyChain: ChainConfig = { id: 0, name: '', symbol: '', rpcUrl: '', decimals: 18, testnet: false, explorerUrl: '' };

export function ChainsPage() {
  const { chainService } = useServices();
  const [chains, setChains] = useState<ChainConfig[]>([]);
  const [editing, setEditing] = useState<ChainConfig | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; title: string } | null>(null);

  async function loadChains() {
    setChains(await chainService.getChains());
  }

  useEffect(() => {
    loadChains();
  }, [chainService]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await chainService.addChain(editing);
      setEditing(null);
      setAlert({ type: 'success', title: 'Chain saved' });
      await loadChains();
    } catch (err) {
      setAlert({ type: 'error', title: err instanceof Error ? err.message : String(err) });
    }
  }

  async function handleRemove(chainId: number) {
    await chainService.removeChain(chainId);
    setAlert({ type: 'success', title: 'Chain removed' });
    await loadChains();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Chains</h2>
        <button
          onClick={() => setEditing({ ...emptyChain })}
          className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white"
        >
          Add Chain
        </button>
      </div>

      {alert && <div className="mb-4"><Alert {...alert} onDismiss={() => setAlert(null)} /></div>}

      {editing && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-800 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-gray-400">Chain ID</span>
              <input
                type="number"
                value={editing.id || ''}
                onChange={(e) => setEditing({ ...editing, id: Number(e.target.value) })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Name</span>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Symbol</span>
              <input
                value={editing.symbol}
                onChange={(e) => setEditing({ ...editing, symbol: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Decimals</span>
              <input
                type="number"
                value={editing.decimals}
                onChange={(e) => setEditing({ ...editing, decimals: Number(e.target.value) })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-gray-400">RPC URL</span>
            <input
              value={editing.rpcUrl}
              onChange={(e) => setEditing({ ...editing, rpcUrl: e.target.value })}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-400">Block Explorer URL</span>
            <input
              value={editing.explorerUrl ?? ''}
              onChange={(e) => setEditing({ ...editing, explorerUrl: e.target.value })}
              placeholder="https://etherscan.io"
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!editing.testnet}
              onChange={(e) => setEditing({ ...editing, testnet: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600"
            />
            <span className="text-xs text-gray-400">Testnet</span>
          </label>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 text-sm rounded-md text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </button>
          </div>
        </form>
      )}

      <ul className="space-y-2">
        {chains.map((chain) => (
          <li
            key={chain.id}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-800"
          >
            <div>
              <p className="font-medium text-sm">
                {chain.name}
                {chain.testnet && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-600 uppercase">
                    testnet
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                ID: {chain.id} &middot; {chain.symbol} &middot; {chain.decimals} decimals
              </p>
              <p className="text-xs text-gray-600 font-mono truncate max-w-md">
                {chain.rpcUrl}
              </p>
              {chain.explorerUrl && (
                <p className="text-xs text-gray-600 truncate max-w-md">
                  <a href={chain.explorerUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                    {chain.explorerUrl}
                  </a>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing({ ...chain })}
                className="px-3 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
              >
                Edit
              </button>
              <button
                onClick={() => handleRemove(chain.id)}
                className="px-3 py-1 text-xs rounded bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
