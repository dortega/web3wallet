import { useEffect, useRef, useState } from 'react';
import { useServices } from './use-services.js';
import type { ChainConfig, TokenConfig } from '@web3-wallet/core';

export interface BalanceEntry {
  key: string;
  chainId: number;
  chainName: string;
  symbol: string;
  balance: string | null;
  loading: boolean;
  error: string | null;
  isToken: boolean;
  isTestnet: boolean;
  tokenAddress?: string;
  explorerUrl?: string;
}

/** wallet address -> entry key -> BalanceEntry */
export type BalanceMap = Map<string, Map<string, BalanceEntry>>;

export function useBalanceMap(wallets: string[], showTestnets = true) {
  const { balanceService, chainService, tokenService } = useServices();
  const [balanceMap, setBalanceMap] = useState<BalanceMap>(new Map());
  const [chains, setChains] = useState<ChainConfig[]>([]);
  const [tokens, setTokens] = useState<TokenConfig[]>([]);
  const [fetching, setFetching] = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    chainService.getChains().then(setChains);
    tokenService.getTokens().then(setTokens);
  }, [chainService, tokenService]);

  useEffect(() => {
    if (wallets.length === 0 || chains.length === 0) return;
    abortRef.current = false;

    const visibleChains = showTestnets ? chains : chains.filter((c) => !c.testnet);
    const chainById = new Map(visibleChains.map((c) => [c.id, c]));

    // Build initial map with loading entries
    const initial: BalanceMap = new Map();
    for (const addr of wallets) {
      const entries = new Map<string, BalanceEntry>();
      for (const chain of visibleChains) {
        const key = `native:${chain.id}`;
        entries.set(key, {
          key,
          chainId: chain.id,
          chainName: chain.name,
          symbol: chain.symbol,
          balance: null,
          loading: true,
          error: null,
          isToken: false,
          isTestnet: !!chain.testnet,
          explorerUrl: chain.explorerUrl,
        });
      }
      for (const token of tokens) {
        const chain = chainById.get(token.chainId);
        if (!chain) continue;
        const key = `token:${token.chainId}:${token.address}`;
        entries.set(key, {
          key,
          chainId: token.chainId,
          chainName: chain.name,
          symbol: token.symbol,
          balance: null,
          loading: true,
          error: null,
          isToken: true,
          isTestnet: !!chain.testnet,
          tokenAddress: token.address,
          explorerUrl: chain.explorerUrl,
        });
      }
      initial.set(addr, entries);
    }
    setBalanceMap(initial);
    setFetching(true);

    function updateEntry(addr: string, key: string, patch: Partial<BalanceEntry>) {
      if (abortRef.current) return;
      setBalanceMap((prev) => {
        const next = new Map(prev);
        const entries = new Map(next.get(addr)!);
        entries.set(key, { ...entries.get(key)!, ...patch });
        next.set(addr, entries);
        return next;
      });
    }

    const promises: Promise<void>[] = [];

    // Native balances
    for (const addr of wallets) {
      for (const chain of visibleChains) {
        const key = `native:${chain.id}`;
        promises.push(
          balanceService
            .getNativeBalance(addr, chain)
            .then((balance) => updateEntry(addr, key, { balance, loading: false }))
            .catch((err) =>
              updateEntry(addr, key, {
                loading: false,
                error: err instanceof Error ? err.message : String(err),
              }),
            ),
        );
      }
    }

    // Token balances
    for (const addr of wallets) {
      for (const token of tokens) {
        const chain = chainById.get(token.chainId);
        if (!chain) continue;
        const key = `token:${token.chainId}:${token.address}`;
        promises.push(
          balanceService
            .getTokenBalance(addr, token, chain)
            .then((balance) => updateEntry(addr, key, { balance, loading: false }))
            .catch((err) =>
              updateEntry(addr, key, {
                loading: false,
                error: err instanceof Error ? err.message : String(err),
              }),
            ),
        );
      }
    }

    Promise.allSettled(promises).then(() => {
      if (!abortRef.current) setFetching(false);
    });

    return () => {
      abortRef.current = true;
    };
  }, [wallets, chains, tokens, showTestnets, balanceService]);

  return { balanceMap, chains, tokens, fetching };
}

/** Sum all non-null balances for a given symbol across wallets */
export function totalBySymbol(
  balanceMap: BalanceMap,
  filter?: { testnet: boolean },
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const entries of balanceMap.values()) {
    for (const entry of entries.values()) {
      if (filter !== undefined && entry.isTestnet !== filter.testnet) continue;
      if (entry.balance === null) continue;
      const val = parseFloat(entry.balance);
      if (isNaN(val) || val === 0) continue;
      totals.set(entry.symbol, (totals.get(entry.symbol) ?? 0) + val);
    }
  }
  return totals;
}
