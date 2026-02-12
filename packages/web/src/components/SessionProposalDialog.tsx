import { useRef, useEffect, useState } from 'react';
import { useWalletConnect } from '../context/walletconnect.js';
import { useServices } from '../hooks/use-services.js';
import { useSettings, maskAddress } from '../hooks/use-settings.js';
import { DAppIcon } from './DAppIcon.js';
import type { ChainConfig } from '@web3-wallet/core';

export function SessionProposalDialog() {
  const { pendingProposal, approveSession, rejectSession } = useWalletConnect();
  const { walletService, chainService } = useServices();
  const { privateWallets } = useSettings();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [wallets, setWallets] = useState<string[]>([]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [chains, setChains] = useState<ChainConfig[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const open = pendingProposal !== null;

  useEffect(() => {
    if (open) {
      walletService.listWallets().then((w) => {
        setWallets(w);
        if (w.length > 0) setSelectedWallet(w[0]!);
      });
      chainService.getChains().then(setChains);
      setError('');
    }
  }, [open, walletService, chainService]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!open || !pendingProposal) return null;

  const meta = pendingProposal.params.proposer.metadata;
  const requiredChains = pendingProposal.params.requiredNamespaces?.eip155?.chains ?? [];
  const optionalChains = pendingProposal.params.optionalNamespaces?.eip155?.chains ?? [];
  const allRequestedChains = [...new Set([...requiredChains, ...optionalChains])];
  const requestedChainIds = allRequestedChains.map((c) => Number(c.split(':')[1]));

  const supportedChainIds = chains
    .filter((c) => requestedChainIds.length === 0 || requestedChainIds.includes(c.id))
    .map((c) => c.id);

  // If no specific chains requested, offer all our chains
  const approvedChainIds = supportedChainIds.length > 0
    ? supportedChainIds
    : chains.map((c) => c.id);

  async function handleApprove() {
    if (!selectedWallet || !pendingProposal) return;
    setLoading(true);
    setError('');
    try {
      await approveSession(
        pendingProposal,
        [selectedWallet],
        approvedChainIds,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve session');
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!pendingProposal) return;
    await rejectSession(pendingProposal.id);
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleReject}
      className="bg-gray-900 text-gray-100 rounded-lg p-6 w-[28rem] backdrop:bg-black/60 border border-gray-700"
    >
      <h2 className="text-lg font-semibold mb-4">Session Proposal</h2>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <DAppIcon url={meta.icons?.[0]} name={meta.name} size="w-10 h-10" />
          <div>
            <p className="font-medium">{meta.name}</p>
            <p className="text-xs text-gray-400">{meta.url}</p>
          </div>
        </div>
        {meta.description && (
          <p className="text-sm text-gray-300">{meta.description}</p>
        )}

        {requestedChainIds.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Requested chains</p>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {requestedChainIds.map((id) => {
                const chain = chains.find((c) => c.id === id);
                return (
                  <span key={id} className="px-2 py-0.5 bg-gray-800 rounded text-xs">
                    {chain ? chain.name : `Chain ${id}`}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-400 mb-1">Connect with wallet</p>
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            {wallets.map((w) => (
              <option key={w} value={w}>
                {privateWallets ? maskAddress(w) : w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={handleReject}
          className="px-4 py-2 text-sm rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={loading || !selectedWallet}
          className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {loading ? 'Connecting...' : 'Approve'}
        </button>
      </div>
    </dialog>
  );
}
