import { useRef, useEffect, useState, type FormEvent } from 'react';
import { Wallet, toUtf8String, isHexString } from 'ethers';
import { useWalletConnect } from '../context/walletconnect.js';
import { useServices } from '../hooks/use-services.js';
import type { ChainConfig } from '@web3-wallet/core';

function decodeHexMessage(hex: string): string {
  try {
    return toUtf8String(hex);
  } catch {
    return hex;
  }
}

function parseChainId(chainId: string): number {
  // "eip155:1" -> 1
  const parts = chainId.split(':');
  return Number(parts[1] ?? parts[0]);
}

export function SignRequestDialog() {
  const { pendingRequest, respondRequest, rejectRequest } = useWalletConnect();
  const { keystoreService, chainService, getProvider } = useServices();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const open = pendingRequest !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open) {
      setPassword('');
      setError('');
    }
  }, [open]);

  if (!open || !pendingRequest) return null;

  const { topic, id, params } = pendingRequest;
  const method = params.request.method;
  const reqParams = params.request.params as unknown[];
  const chainId = parseChainId(params.chainId);
  const peerName = pendingRequest.peerMeta?.name ?? 'Unknown dApp';
  const peerUrl = pendingRequest.peerMeta?.url ?? '';

  function handleCancel() {
    rejectRequest(topic, id);
  }

  async function handleApprove(e: FormEvent) {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let chain: ChainConfig | undefined;
      const chains = await chainService.getChains();
      chain = chains.find((c) => c.id === chainId);

      let result: string;

      if (method === 'personal_sign') {
        const message = reqParams[0] as string;
        const address = reqParams[1] as string;
        const account = await keystoreService.load(address, password);
        const wallet = new Wallet(account.privateKey);
        const msgBytes = isHexString(message) ? message : message;
        result = await wallet.signMessage(
          isHexString(msgBytes) ? Buffer.from(msgBytes.slice(2), 'hex') : msgBytes,
        );
      } else if (method === 'eth_signTypedData_v4') {
        const address = reqParams[0] as string;
        const typedDataStr = reqParams[1] as string;
        const typedData = JSON.parse(typedDataStr);
        const account = await keystoreService.load(address, password);
        const wallet = new Wallet(account.privateKey);

        const { EIP712Domain: _, ...types } = typedData.types;
        result = await wallet.signTypedData(
          typedData.domain,
          types,
          typedData.message,
        );
      } else if (method === 'eth_sendTransaction') {
        const txData = reqParams[0] as Record<string, string>;
        if (!chain) throw new Error(`Unsupported chain: ${chainId}`);

        const account = await keystoreService.load(txData.from!, password);
        const provider = getProvider(chain);
        const wallet = new Wallet(account.privateKey, provider);

        const tx = await wallet.sendTransaction({
          to: txData.to,
          value: txData.value ?? '0x0',
          data: txData.data ?? '0x',
          ...(txData.gas ? { gasLimit: txData.gas } : {}),
          ...(txData.gasPrice ? { gasPrice: txData.gasPrice } : {}),
        });
        result = tx.hash;
      } else {
        throw new Error(`Unsupported method: ${method}`);
      }

      await respondRequest(topic, id, result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Signing failed';
      if (msg.includes('invalid password') || msg.includes('bad decrypt')) {
        setError('Wrong password');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      className="bg-gray-900 text-gray-100 rounded-lg p-6 w-[28rem] max-h-[80vh] overflow-y-auto backdrop:bg-black/60 border border-gray-700"
    >
      <form onSubmit={handleApprove} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Sign Request</h2>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">From:</span>
          <span className="font-medium">{peerName}</span>
          {peerUrl && <span className="text-gray-500 text-xs">({peerUrl})</span>}
        </div>

        <div className="text-xs text-gray-400">
          Method: <span className="font-mono text-gray-300">{method}</span>
        </div>

        <RequestDetails method={method} params={reqParams} />

        <input
          type="password"
          placeholder="Wallet password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
          >
            Reject
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {loading ? 'Signing...' : 'Sign'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function RequestDetails({ method, params }: { method: string; params: unknown[] }) {
  if (method === 'personal_sign') {
    const hex = params[0] as string;
    const decoded = decodeHexMessage(hex);
    return (
      <div className="bg-gray-800 rounded-md p-3">
        <p className="text-xs text-gray-400 mb-1">Message</p>
        <p className="text-sm whitespace-pre-wrap break-all font-mono">{decoded}</p>
      </div>
    );
  }

  if (method === 'eth_signTypedData_v4') {
    const raw = params[1] as string;
    let formatted: string;
    try {
      formatted = JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      formatted = raw;
    }
    return (
      <div className="bg-gray-800 rounded-md p-3 max-h-48 overflow-y-auto">
        <p className="text-xs text-gray-400 mb-1">Typed Data</p>
        <pre className="text-xs whitespace-pre-wrap break-all font-mono">{formatted}</pre>
      </div>
    );
  }

  if (method === 'eth_sendTransaction') {
    const tx = params[0] as Record<string, string>;
    const value = tx.value ? (BigInt(tx.value) / BigInt(10 ** 14)).toString() : '0';
    const ethValue = (Number(value) / 10000).toFixed(6);
    return (
      <div className="bg-gray-800 rounded-md p-3 space-y-1">
        <p className="text-xs text-gray-400 mb-1">Transaction</p>
        <p className="text-xs"><span className="text-gray-400">To:</span> <span className="font-mono">{tx.to}</span></p>
        <p className="text-xs"><span className="text-gray-400">Value:</span> {ethValue} ETH</p>
        {tx.data && tx.data !== '0x' && (
          <p className="text-xs">
            <span className="text-gray-400">Data:</span>{' '}
            <span className="font-mono">{tx.data.length > 66 ? `${tx.data.slice(0, 66)}...` : tx.data}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-md p-3">
      <p className="text-xs text-gray-400">Unsupported method</p>
    </div>
  );
}
