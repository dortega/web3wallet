import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServices } from '../hooks/use-services.js';
import { useAsync } from '../hooks/use-async.js';
import { usePasswordDialog } from '../hooks/use-password-dialog.js';
import { PasswordDialog } from '../components/PasswordDialog.js';
import { Alert } from '../components/Alert.js';

type ImportMode = 'private-key' | 'mnemonic';

const mnemonicMaskStyle = {
  WebkitTextSecurity: 'disc',
} as React.CSSProperties;

export function ImportWalletPage() {
  const navigate = useNavigate();
  const { walletService } = useServices();
  const { data, error, loading, run } = useAsync<string>();
  const pwd = usePasswordDialog();

  const [mode, setMode] = useState<ImportMode>('private-key');
  const [privateKey, setPrivateKey] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);

  async function handleImport() {
    const value = mode === 'private-key' ? privateKey.trim() : mnemonic.trim();
    if (!value) return;
    try {
      const password = await pwd.requestPassword(true);
      await run(() =>
        mode === 'private-key'
          ? walletService.importFromPrivateKey(value, password)
          : walletService.importFromMnemonic(value, password),
      );
    } catch {
      // cancelled
    }
  }

  const inputValid =
    mode === 'private-key' ? privateKey.trim().length > 0 : mnemonic.trim().split(/\s+/).length >= 12;

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold mb-6">Import Wallet</h2>

      {!data && (
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex rounded-md overflow-hidden border border-gray-700">
            <button
              onClick={() => setMode('private-key')}
              className={`flex-1 px-4 py-2 text-sm transition-colors ${
                mode === 'private-key'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Private Key
            </button>
            <button
              onClick={() => setMode('mnemonic')}
              className={`flex-1 px-4 py-2 text-sm transition-colors ${
                mode === 'mnemonic'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Mnemonic (12/24 words)
            </button>
          </div>

          {mode === 'private-key' ? (
            <label className="block">
              <span className="text-sm text-gray-400">Private Key</span>
              <input
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="0x..."
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
              />
            </label>
          ) : (
            <label className="block">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Recovery Phrase</span>
                <button
                  type="button"
                  onClick={() => setShowMnemonic(!showMnemonic)}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  {showMnemonic ? 'Hide' : 'Show'}
                </button>
              </div>
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="word1 word2 word3 ..."
                rows={3}
                style={showMnemonic ? undefined : mnemonicMaskStyle}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 resize-none"
              />
              <span className="text-xs text-gray-600 mt-1 block">
                {mnemonic.trim() ? `${mnemonic.trim().split(/\s+/).length} words` : 'Enter 12 or 24 words separated by spaces'}
              </span>
            </label>
          )}

          <button
            onClick={handleImport}
            disabled={loading || !inputValid}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {loading ? 'Encrypting...' : 'Import'}
          </button>
        </div>
      )}

      {error && <Alert type="error" title={error} />}

      {data && (
        <div className="space-y-4">
          <Alert
            type="success"
            title="Wallet imported"
            fields={[{ label: 'Address', value: data }]}
          />
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
