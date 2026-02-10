import { useEffect, useState } from 'react';
import { useServices } from '../hooks/use-services.js';
import type { TokenConfig } from '@web3-wallet/core';

interface TokenSelectorProps {
  chainId: number | '';
  value: string;
  onChange: (value: string, token: TokenConfig | null) => void;
  className?: string;
}

export function TokenSelector({ chainId, value, onChange, className = '' }: TokenSelectorProps) {
  const { tokenService } = useServices();
  const [tokens, setTokens] = useState<TokenConfig[]>([]);

  useEffect(() => {
    if (!chainId) {
      setTokens([]);
      return;
    }
    tokenService.getTokens(chainId).then(setTokens);
  }, [chainId, tokenService]);

  return (
    <select
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '__native__') {
          onChange('__native__', null);
        } else {
          const token = tokens.find((t) => t.address === v);
          onChange(v, token ?? null);
        }
      }}
      className={`bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${className}`}
    >
      <option value="__native__">Native token</option>
      {tokens.map((t) => (
        <option key={t.address} value={t.address}>
          {t.symbol}
        </option>
      ))}
    </select>
  );
}
