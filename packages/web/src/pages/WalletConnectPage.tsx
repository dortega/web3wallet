import { useState, type FormEvent } from 'react';
import { useWalletConnect } from '../context/walletconnect.js';
import { useSettings, maskAddress } from '../hooks/use-settings.js';
import { DAppIcon } from '../components/DAppIcon.js';
import { Alert } from '../components/Alert.js';

function getSessionAccounts(namespaces: Record<string, { accounts: string[] }>): string[] {
  const addresses = new Set<string>();
  for (const ns of Object.values(namespaces)) {
    for (const account of ns.accounts) {
      // "eip155:1:0xabc..." -> "0xabc..."
      const addr = account.split(':').slice(2).join(':');
      if (addr) addresses.add(addr);
    }
  }
  return [...addresses];
}

export function WalletConnectPage() {
  const { ready, sessions, pair, disconnectSession } = useWalletConnect();
  const { privateWallets } = useSettings();
  const [uri, setUri] = useState('');
  const [error, setError] = useState('');
  const [pairing, setPairing] = useState(false);

  async function handlePair(e: FormEvent) {
    e.preventDefault();
    if (!uri.trim()) return;
    setPairing(true);
    setError('');
    try {
      await pair(uri.trim());
      setUri('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to pair');
    } finally {
      setPairing(false);
    }
  }

  async function handleDisconnect(topic: string) {
    try {
      await disconnectSession(topic);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disconnect');
    }
  }

  if (!ready) {
    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
    if (!projectId) {
      return (
        <div>
          <h2 className="text-2xl font-bold mb-6">WalletConnect</h2>
          <Alert
            type="info"
            title="WalletConnect not configured"
            fields={[
              { label: 'Setup', value: 'Set VITE_WALLETCONNECT_PROJECT_ID in your .env file' },
              { label: 'Get ID', value: 'https://cloud.walletconnect.com (free)' },
            ]}
          />
        </div>
      );
    }
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">WalletConnect</h2>
        <p className="text-gray-400">Initializing...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">WalletConnect</h2>

      <div className="space-y-6">
        {/* New Connection */}
        <section>
          <h3 className="text-sm font-medium text-gray-400 mb-2">New Connection</h3>
          <form onSubmit={handlePair} className="flex gap-2">
            <input
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              placeholder="Paste WalletConnect URI (wc:...)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={pairing || !uri.trim()}
              className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shrink-0"
            >
              {pairing ? 'Connecting...' : 'Connect'}
            </button>
          </form>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </section>

        {/* Active Sessions */}
        <section>
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            Active Sessions ({sessions.length})
          </h3>
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500">No active sessions</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => {
                const meta = session.peer.metadata;
                const accounts = getSessionAccounts(session.namespaces);
                return (
                  <div
                    key={session.topic}
                    className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg p-3"
                  >
                    <DAppIcon url={meta.icons?.[0]} name={meta.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{meta.name}</p>
                      <p className="text-xs text-gray-400 truncate">{meta.url}</p>
                      {accounts.map((addr) => (
                        <p key={addr} className="text-xs text-gray-500 font-mono truncate">
                          {privateWallets ? maskAddress(addr) : addr}
                        </p>
                      ))}
                    </div>
                    <button
                      onClick={() => handleDisconnect(session.topic)}
                      className="px-3 py-1.5 text-xs rounded-md text-red-400 hover:text-red-300 hover:bg-gray-700"
                    >
                      Disconnect
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
