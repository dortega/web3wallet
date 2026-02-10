import { useState } from 'react';
import { useSettings, type Currency } from '../hooks/use-settings.js';
import { ChainsTab } from './settings/ChainsTab.js';
import { TokensTab } from './settings/TokensTab.js';

const tabs = ['General', 'Chains', 'Tokens'] as const;
type Tab = (typeof tabs)[number];

const currencyOptions: { value: Currency; label: string }[] = [
  { value: 'usd', label: 'USD ($)' },
  { value: 'eur', label: 'EUR (\u20AC)' },
];

function GeneralTab() {
  const {
    currency, setCurrency,
    showTestnets, setShowTestnets,
    privateWallets, setPrivateWallets,
    privateBalances, setPrivateBalances,
  } = useSettings();

  return (
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
  );
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('General');

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'General' && <GeneralTab />}
      {activeTab === 'Chains' && <ChainsTab />}
      {activeTab === 'Tokens' && <TokensTab />}
    </div>
  );
}
