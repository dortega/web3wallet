import { createContext, useContext, useState, useCallback } from 'react';

export type Currency = 'usd' | 'eur';

export interface Settings {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  showTestnets: boolean;
  setShowTestnets: (v: boolean) => void;
  privateWallets: boolean;
  setPrivateWallets: (v: boolean) => void;
  privateBalances: boolean;
  setPrivateBalances: (v: boolean) => void;
}

const KEY_CURRENCY = 'w3w_currency';
const KEY_TESTNETS = 'w3w_show_testnets';
const KEY_PRIVATE_WALLETS = 'w3w_private_wallets';
const KEY_PRIVATE_BALANCES = 'w3w_private_balances';

function loadCurrency(): Currency {
  const saved = localStorage.getItem(KEY_CURRENCY);
  return saved === 'eur' ? 'eur' : 'usd';
}

function loadBool(key: string): boolean {
  return localStorage.getItem(key) === 'true';
}

export const SettingsContext = createContext<Settings | null>(null);

export function useSettingsProvider(): Settings {
  const [currency, setCurrencyState] = useState<Currency>(loadCurrency);
  const [showTestnets, setShowTestnetsState] = useState(() => loadBool(KEY_TESTNETS));
  const [privateWallets, setPrivateWalletsState] = useState(() => loadBool(KEY_PRIVATE_WALLETS));
  const [privateBalances, setPrivateBalancesState] = useState(() => loadBool(KEY_PRIVATE_BALANCES));

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(KEY_CURRENCY, c);
  }, []);

  const setShowTestnets = useCallback((v: boolean) => {
    setShowTestnetsState(v);
    localStorage.setItem(KEY_TESTNETS, String(v));
  }, []);

  const setPrivateWallets = useCallback((v: boolean) => {
    setPrivateWalletsState(v);
    localStorage.setItem(KEY_PRIVATE_WALLETS, String(v));
  }, []);

  const setPrivateBalances = useCallback((v: boolean) => {
    setPrivateBalancesState(v);
    localStorage.setItem(KEY_PRIVATE_BALANCES, String(v));
  }, []);

  return {
    currency, setCurrency,
    showTestnets, setShowTestnets,
    privateWallets, setPrivateWallets,
    privateBalances, setPrivateBalances,
  };
}

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

/** Mask an address: 0xdA3...789 */
export function maskAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 5)}...${address.slice(-3)}`;
}
