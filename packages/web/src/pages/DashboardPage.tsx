import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../hooks/use-services.js';
import { useSettings, maskAddress } from '../hooks/use-settings.js';
import { usePrices, formatFiat, type PriceMap } from '../hooks/use-prices.js';
import { usePasswordDialog } from '../hooks/use-password-dialog.js';
import { PasswordDialog } from '../components/PasswordDialog.js';
import { useBalanceMap, totalBySymbol, type BalanceEntry } from '../hooks/use-balance-map.js';
import { CopyButton } from '../components/CopyButton.js';
import { Alert } from '../components/Alert.js';

function formatBalance(val: string): string {
  const n = parseFloat(val);
  if (n === 0) return '0';
  if (n < 0.0001) return '<0.0001';
  return n.toFixed(4);
}

function ExplorerLink({ entry, walletAddress, children }: { entry: BalanceEntry; walletAddress: string; children: React.ReactNode }) {
  if (!entry.explorerUrl) return <>{children}</>;
  const href = `${entry.explorerUrl}/address/${walletAddress}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </a>
  );
}

function BalanceRow({ entry, prices, currency, hidden, walletAddress }: { entry: BalanceEntry; prices: PriceMap; currency: 'usd' | 'eur'; hidden?: boolean; walletAddress: string }) {
  const price = prices.get(entry.symbol);
  const bal = entry.balance ? parseFloat(entry.balance) : 0;
  const fiatValue = price && bal > 0 ? bal * price : null;
  const nameColor = entry.isTestnet ? 'text-yellow-700' : 'text-gray-400';
  const hasBalance = bal > 0;

  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className={nameColor}>
        {entry.isToken ? (
          <>
            <ExplorerLink entry={entry} walletAddress={walletAddress}>
              <span className={entry.isTestnet ? 'text-yellow-800' : 'text-gray-500'}>{entry.chainName}</span>
            </ExplorerLink>
            {' / '}
            {entry.symbol}
          </>
        ) : (
          <ExplorerLink entry={entry} walletAddress={walletAddress}>
            {entry.chainName}
          </ExplorerLink>
        )}
      </span>
      <span className="font-mono">
        {entry.loading ? (
          <span className="text-gray-600 animate-pulse">...</span>
        ) : entry.error ? (
          <span className="text-red-400 text-xs">error</span>
        ) : hidden ? (
          <span className="flex items-center gap-1.5">
            <span className="text-gray-600">****</span>
            {hasBalance && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />}
          </span>
        ) : (
          <>
            {formatBalance(entry.balance!)} {entry.symbol}
            {fiatValue !== null && (
              <span className="text-gray-600 text-xs ml-1.5">
                {formatFiat(fiatValue, currency)}
              </span>
            )}
          </>
        )}
      </span>
    </div>
  );
}

function walletSummary(entries: Map<string, BalanceEntry> | undefined): BalanceEntry[] {
  if (!entries) return [];
  return [...entries.values()].filter(
    (e) => e.balance !== null && parseFloat(e.balance) > 0,
  );
}

export function DashboardPage() {
  const { walletService } = useServices();
  const { currency, showTestnets, privateWallets, privateBalances } = useSettings();
  const { prices } = usePrices(currency);
  const pwd = usePasswordDialog();
  const [wallets, setWallets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  const [exportedKey, setExportedKey] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { balanceMap, fetching } = useBalanceMap(wallets, showTestnets);
  const mainTotals = totalBySymbol(balanceMap, { testnet: false });
  const testnetTotals = showTestnets ? totalBySymbol(balanceMap, { testnet: true }) : new Map();

  // Compute total fiat value (mainnet only)
  let totalFiat = 0;
  for (const [symbol, amount] of mainTotals.entries()) {
    const price = prices.get(symbol);
    if (price) totalFiat += amount * price;
  }

  useEffect(() => {
    walletService.listWallets().then((list) => {
      setWallets(list);
      setLoading(false);
    });
  }, [walletService]);

  async function handleExport(address: string) {
    setExportedKey(null);
    setExportError(null);
    try {
      const password = await pwd.requestPassword();
      const key = await walletService.exportPrivateKey(address, password);
      setExportedKey(key);
    } catch {
      // cancelled
    }
  }

  async function handleDelete(address: string) {
    try {
      await walletService.deleteWallet(address);
      setWallets((prev) => prev.filter((w) => w !== address));
      setSelected('');
      setConfirmDelete(null);
      setDeleteError(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    }
  }

  const selectedEntries = selected ? balanceMap.get(selected) : null;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Wallets</h2>
        <div className="flex gap-2">
          <Link
            to="/create"
            className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create
          </Link>
          <Link
            to="/import"
            className="px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white"
          >
            Import
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : wallets.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No wallets found. Create or import one to get started.
        </p>
      ) : (
        <>
          {/* Total balances summary */}
          <div className="p-4 rounded-lg border border-gray-800 bg-gray-900 mb-6 space-y-4">
            <div>
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Total Balance{fetching ? ' (loading...)' : ''}
              </h3>
              {mainTotals.size === 0 && !fetching && (
                <p className="text-gray-600 text-sm">No balances yet</p>
              )}
              {privateBalances ? (
                <p className="text-2xl font-bold font-mono mb-2 text-gray-600">****</p>
              ) : (
                <>
                  {totalFiat > 0 && (
                    <p className="text-2xl font-bold font-mono mb-2">
                      {formatFiat(totalFiat, currency)}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    {[...mainTotals.entries()].map(([symbol, amount]) => {
                      const price = prices.get(symbol);
                      const fiat = price ? amount * price : null;
                      return (
                        <span key={symbol} className="text-lg font-mono">
                          {amount < 0.0001 && amount > 0 ? '<0.0001' : amount.toFixed(4)}{' '}
                          <span className="text-gray-400 text-sm">{symbol}</span>
                          {fiat !== null && (
                            <span className="text-gray-600 text-xs ml-1">
                              {formatFiat(fiat, currency)}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {testnetTotals.size > 0 && (
              <div className="pt-3 border-t border-gray-800">
                <h3 className="text-xs text-yellow-700 uppercase tracking-wider mb-2">Testnets</h3>
                {privateBalances ? (
                  <p className="text-sm font-mono text-gray-600">****</p>
                ) : (
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    {[...testnetTotals.entries()].map(([symbol, amount]) => (
                      <span key={symbol} className="text-sm font-mono text-yellow-800">
                        {amount < 0.0001 && amount > 0 ? '<0.0001' : amount.toFixed(4)}{' '}
                        <span className="text-yellow-900 text-xs">{symbol}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Wallet list */}
          <ul className="space-y-2">
            {wallets.map((address) => {
              const nonZero = walletSummary(balanceMap.get(address));
              const isSelected = selected === address;

              return (
                <li key={address}>
                  <button
                    onClick={() => setSelected(isSelected ? '' : address)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-950/30'
                        : 'border-gray-800 hover:border-gray-700 hover:bg-gray-900'
                    }`}
                  >
                    <span className="font-mono text-sm">{privateWallets ? maskAddress(address) : address}</span>
                    {nonZero.length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        {privateBalances ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            {nonZero.length} asset{nonZero.length !== 1 ? 's' : ''} with balance
                          </span>
                        ) : (
                          nonZero.map((e) => {
                            const price = prices.get(e.symbol);
                            const bal = parseFloat(e.balance!);
                            const fiat = price && bal > 0 ? bal * price : null;
                            return (
                              <span key={e.key} className={`text-xs font-mono ${e.isTestnet ? 'text-yellow-800' : 'text-gray-500'}`}>
                                {formatBalance(e.balance!)} {e.symbol}
                                {fiat !== null && (
                                  <span className="text-gray-700 ml-0.5">
                                    /{formatFiat(fiat, currency)}
                                  </span>
                                )}
                                <span className={e.isTestnet ? 'text-yellow-900' : 'text-gray-700'}>
                                  {' '}
                                  ({e.chainName})
                                </span>
                              </span>
                            );
                          })
                        )}
                      </div>
                    )}
                  </button>

                  {/* Expanded detail panel */}
                  {isSelected && selectedEntries && (
                    <div className="mt-2 ml-4 p-4 rounded-lg border border-gray-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-300">All Balances</h3>
                        <CopyButton text={address} />
                      </div>

                      {/* Native balances (> 0 only) */}
                      {(() => {
                        const native = [...selectedEntries.values()].filter(
                          (e) => !e.isToken && e.balance !== null && parseFloat(e.balance) > 0,
                        );
                        if (native.length === 0) return null;
                        return (
                          <div>
                            <h4 className="text-xs text-gray-600 uppercase tracking-wider mb-1">Native</h4>
                            <div className="divide-y divide-gray-800">
                              {native.map((entry) => (
                                <BalanceRow key={entry.key} entry={entry} prices={prices} currency={currency} hidden={privateBalances} walletAddress={address} />
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Token balances (> 0 only) */}
                      {(() => {
                        const tokens = [...selectedEntries.values()].filter(
                          (e) => e.isToken && e.balance !== null && parseFloat(e.balance) > 0,
                        );
                        if (tokens.length === 0) return null;
                        return (
                          <div>
                            <h4 className="text-xs text-gray-600 uppercase tracking-wider mb-1">Tokens</h4>
                            <div className="divide-y divide-gray-800">
                              {tokens.map((entry) => (
                                <BalanceRow key={entry.key} entry={entry} prices={prices} currency={currency} hidden={privateBalances} walletAddress={address} />
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Exported key display */}
                      {exportedKey && (
                        <div className="space-y-1">
                          <Alert type="info" title="Private Key" fields={[{ label: 'Key', value: exportedKey }]} />
                          <div className="flex gap-2">
                            <CopyButton text={exportedKey} />
                            <button
                              onClick={() => setExportedKey(null)}
                              className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-white"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                      {exportError && <Alert type="error" title={exportError} />}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-gray-800">
                        <button
                          onClick={() => { setExportedKey(null); handleExport(address); }}
                          className="px-3 py-1.5 text-xs rounded-md bg-gray-700 hover:bg-gray-600 text-white"
                        >
                          Export Private Key
                        </button>
                        {confirmDelete === address ? (
                          <>
                            <button
                              onClick={() => handleDelete(address)}
                              className="px-3 py-1.5 text-xs rounded-md bg-red-600 hover:bg-red-700 text-white"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-3 py-1.5 text-xs rounded-md bg-gray-700 hover:bg-gray-600 text-white"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(address)}
                            className="px-3 py-1.5 text-xs rounded-md bg-red-900/30 hover:bg-red-900/60 text-red-400 border border-red-900/50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      {deleteError && <Alert type="error" title={deleteError} />}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
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
