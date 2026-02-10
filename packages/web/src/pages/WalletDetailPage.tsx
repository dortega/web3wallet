import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useServices } from '../hooks/use-services.js';
import { useAsync } from '../hooks/use-async.js';
import { usePasswordDialog } from '../hooks/use-password-dialog.js';
import { PasswordDialog } from '../components/PasswordDialog.js';
import { ChainSelector } from '../components/ChainSelector.js';
import { CopyButton } from '../components/CopyButton.js';
import { Alert } from '../components/Alert.js';

export function WalletDetailPage() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { balanceService, walletService, chainService } = useServices();
  const pwd = usePasswordDialog();

  const [chainId, setChainId] = useState<number | ''>('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const balance = useAsync<string>();
  const privateKey = useAsync<string>();
  const publicKey = useAsync<string>();

  async function handleCheckBalance() {
    if (!chainId || !address) return;
    const chain = await chainService.getChain(chainId);
    if (!chain) return;
    await balance.run(() => balanceService.getNativeBalance(address, chain));
  }

  async function handleExport() {
    if (!address) return;
    try {
      const password = await pwd.requestPassword();
      await privateKey.run(() => walletService.exportPrivateKey(address, password));
    } catch {
      // cancelled
    }
  }

  async function handlePublicKey() {
    if (!address) return;
    try {
      const password = await pwd.requestPassword();
      await publicKey.run(() => walletService.getPublicKey(address, password));
    } catch {
      // cancelled
    }
  }

  async function handleDelete() {
    if (!address) return;
    try {
      await walletService.deleteWallet(address);
      navigate('/');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    }
  }

  if (!address) return null;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link to="/" className="text-sm text-gray-500 hover:text-white">
          &larr; Back
        </Link>
      </div>

      <h2 className="text-2xl font-bold mb-2">Wallet</h2>
      <div className="flex items-center gap-2 mb-6">
        <p className="font-mono text-sm text-gray-300">{address}</p>
        <CopyButton text={address} />
      </div>

      <div className="space-y-6">
        <section className="p-4 border border-gray-800 rounded-lg space-y-3">
          <h3 className="text-sm font-semibold text-gray-400">Balance</h3>
          <div className="flex gap-2 items-end">
            <ChainSelector value={chainId} onChange={setChainId} className="flex-1" />
            <button
              onClick={handleCheckBalance}
              disabled={!chainId || balance.loading}
              className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {balance.loading ? 'Loading...' : 'Check'}
            </button>
          </div>
          {balance.data !== null && (
            <p className="text-lg font-mono">{balance.data}</p>
          )}
          {balance.error && <Alert type="error" title={balance.error} />}
        </section>

        <section className="p-4 border border-gray-800 rounded-lg space-y-3">
          <h3 className="text-sm font-semibold text-gray-400">Keys</h3>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={privateKey.loading}
              className="px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
            >
              Export Private Key
            </button>
            <button
              onClick={handlePublicKey}
              disabled={publicKey.loading}
              className="px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
            >
              Public Key
            </button>
          </div>
          {privateKey.data && (
            <div className="space-y-1">
              <Alert
                type="info"
                title="Private Key"
                fields={[{ label: 'Key', value: privateKey.data }]}
              />
              <CopyButton text={privateKey.data} />
            </div>
          )}
          {privateKey.error && <Alert type="error" title={privateKey.error} />}
          {publicKey.data && (
            <div className="space-y-1">
              <Alert
                type="info"
                title="Public Key"
                fields={[{ label: 'Key', value: publicKey.data }]}
              />
              <CopyButton text={publicKey.data} />
            </div>
          )}
          {publicKey.error && <Alert type="error" title={publicKey.error} />}
        </section>

        <section className="p-4 border border-red-900/50 rounded-lg space-y-3">
          <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-2 text-sm rounded-md bg-red-900/30 hover:bg-red-900/60 text-red-400 border border-red-900/50"
            >
              Delete Wallet
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-300">
                This will permanently delete the keystore file. Make sure you have backed up your private key.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {deleteError && <Alert type="error" title={deleteError} />}
        </section>
      </div>

      <PasswordDialog
        open={pwd.open}
        confirm={pwd.confirm}
        onSubmit={pwd.submit}
        onCancel={pwd.cancel}
      />
    </div>
  );
}
