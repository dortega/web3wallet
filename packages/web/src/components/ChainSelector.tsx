import { useEffect, useState } from 'react';
import { useServices } from '../hooks/use-services.js';
import { useSettings } from '../hooks/use-settings.js';
import type { ChainConfig } from '@web3-wallet/core';

interface ChainSelectorProps {
  value: number | '';
  onChange: (chainId: number) => void;
  className?: string;
}

export function ChainSelector({ value, onChange, className = '' }: ChainSelectorProps) {
  const { chainService } = useServices();
  const { showTestnets } = useSettings();
  const [chains, setChains] = useState<ChainConfig[]>([]);

  useEffect(() => {
    chainService.getChains().then(setChains);
  }, [chainService]);

  const visible = showTestnets ? chains : chains.filter((c) => !c.testnet);

  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${className}`}
    >
      <option value="">Select chain</option>
      {visible.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} ({c.symbol}){c.testnet ? ' [testnet]' : ''}
        </option>
      ))}
    </select>
  );
}
