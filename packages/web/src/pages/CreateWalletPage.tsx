import { useNavigate } from 'react-router-dom';
import { useServices } from '../hooks/use-services.js';
import { useAsync } from '../hooks/use-async.js';
import { usePasswordDialog } from '../hooks/use-password-dialog.js';
import { PasswordDialog } from '../components/PasswordDialog.js';
import { Alert } from '../components/Alert.js';
import { CopyButton } from '../components/CopyButton.js';
import type { WalletCreateResult } from '@web3-wallet/core';

export function CreateWalletPage() {
  const navigate = useNavigate();
  const { walletService } = useServices();
  const { data, error, loading, run } = useAsync<WalletCreateResult>();
  const pwd = usePasswordDialog();

  async function handleCreate() {
    try {
      const password = await pwd.requestPassword(true);
      await run(() => walletService.create(password));
    } catch {
      // cancelled
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold mb-6">Create Wallet</h2>

      {!data && !loading && (
        <button
          onClick={handleCreate}
          className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white"
        >
          Create New Wallet
        </button>
      )}

      {loading && <p className="text-gray-400 text-sm">Encrypting keystore...</p>}
      {error && <Alert type="error" title={error} />}

      {data && (
        <div className="space-y-4">
          <Alert
            type="success"
            title="Wallet created"
            fields={[
              { label: 'Address', value: data.address },
              { label: 'Public Key', value: data.publicKey },
              { label: 'Private Key', value: data.privateKey },
            ]}
          />
          <div className="flex gap-2">
            <CopyButton text={data.address} />
            <CopyButton text={data.privateKey} />
          </div>
          <p className="text-xs text-yellow-400">
            Save your private key securely. It will not be shown again.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white"
          >
            Back to Dashboard
          </button>
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
