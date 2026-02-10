import { useSettings, type Currency } from '../hooks/use-settings.js';

const currencyOptions: { value: Currency; label: string }[] = [
  { value: 'usd', label: 'USD ($)' },
  { value: 'eur', label: 'EUR (\u20AC)' },
];

export function SettingsPage() {
  const {
    currency, setCurrency,
    showTestnets, setShowTestnets,
    privateWallets, setPrivateWallets,
    privateBalances, setPrivateBalances,
  } = useSettings();

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="space-y-4">
        <section className="p-4 border border-gray-800 rounded-lg space-y-3">
          <h3 className="text-sm font-semibold text-gray-400">Display Currency</h3>
          <div className="flex gap-2">
            {currencyOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCurrency(opt.value)}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  currency === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="p-4 border border-gray-800 rounded-lg space-y-3">
          <h3 className="text-sm font-semibold text-gray-400">Networks</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showTestnets}
              onChange={(e) => setShowTestnets(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-300">Show testnets</span>
          </label>
          <p className="text-xs text-gray-600">
            When disabled, testnet chains are hidden from the dashboard, selectors, and balance fetching.
          </p>
        </section>

        <section className="p-4 border border-gray-800 rounded-lg space-y-3">
          <h3 className="text-sm font-semibold text-gray-400">Privacy</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privateWallets}
              onChange={(e) => setPrivateWallets(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-300">Hide wallet addresses</span>
          </label>
          <p className="text-xs text-gray-600">
            Masks addresses as 0xdA3...789 across the app.
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privateBalances}
              onChange={(e) => setPrivateBalances(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-300">Hide balances</span>
          </label>
          <p className="text-xs text-gray-600">
            Hides amounts in the dashboard. Wallets with non-zero balances are still marked.
          </p>
        </section>
      </div>
    </div>
  );
}
