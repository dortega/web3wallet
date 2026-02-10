import { useEffect, useRef, useState } from 'react';
import type { Currency } from './use-settings.js';

/**
 * Map from uppercase symbol (ETH, USDT, etc.) to CoinGecko ID.
 * Covers native chain tokens + all default ERC-20s.
 */
const SYMBOL_TO_COINGECKO: Record<string, string> = {
  ETH: 'ethereum',
  POL: 'matic-network',
  BNB: 'binancecoin',
  USDT: 'tether',
  USDC: 'usd-coin',
  'USDC.e': 'usd-coin',
  DAI: 'dai',
  WBTC: 'wrapped-bitcoin',
  WETH: 'ethereum', // WETH tracks ETH price
  LINK: 'chainlink',
};

/** symbol -> price in chosen currency */
export type PriceMap = Map<string, number>;

const REFRESH_INTERVAL = 60_000; // 1 minute

export function usePrices(currency: Currency) {
  const [prices, setPrices] = useState<PriceMap>(new Map());
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function fetchPrices() {
      const ids = [...new Set(Object.values(SYMBOL_TO_COINGECKO))].join(',');
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${currency}`,
        );
        if (!res.ok) return;
        const data: Record<string, Record<string, number>> = await res.json();
        if (cancelled) return;

        const map = new Map<string, number>();
        for (const [symbol, geckoId] of Object.entries(SYMBOL_TO_COINGECKO)) {
          const price = data[geckoId]?.[currency];
          if (price !== undefined) {
            map.set(symbol, price);
          }
        }
        setPrices(map);
        setLoading(false);
      } catch {
        // Silently fail - prices are optional
        if (!cancelled) setLoading(false);
      }
    }

    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
    };
  }, [currency]);

  return { prices, loading };
}

export function formatFiat(amount: number, currency: Currency): string {
  const symbol = currency === 'eur' ? '\u20AC' : '$';
  if (amount < 0.01 && amount > 0) return `<${symbol}0.01`;
  return `${symbol}${amount.toFixed(2)}`;
}
