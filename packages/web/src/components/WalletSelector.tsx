import { useEffect, useState } from 'react';
import { useServices } from '../hooks/use-services.js';
import { useSettings, maskAddress } from '../hooks/use-settings.js';

interface WalletSelectorProps {
  value: string;
  onChange: (address: string) => void;
  className?: string;
}

export function WalletSelector({ value, onChange, className = '' }: WalletSelectorProps) {
  const { walletService } = useServices();
  const { privateWallets } = useSettings();
  const [wallets, setWallets] = useState<string[]>([]);

  useEffect(() => {
    walletService.listWallets().then(setWallets);
  }, [walletService]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${className}`}
    >
      <option value="">Select wallet</option>
      {wallets.map((w) => (
        <option key={w} value={w}>
          {privateWallets ? maskAddress(w) : w}
        </option>
      ))}
    </select>
  );
}
