import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AppSettings } from '@web3-wallet/core';
import type { SettingsService } from '@web3-wallet/core';

export type Currency = AppSettings['currency'];

export interface Settings {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  showTestnets: boolean;
  setShowTestnets: (v: boolean) => void;
  privateWallets: boolean;
  setPrivateWallets: (v: boolean) => void;
  privateBalances: boolean;
  setPrivateBalances: (v: boolean) => void;
  loaded: boolean;
}

export const SettingsContext = createContext<Settings | null>(null);

export function useSettingsProvider(settingsService: SettingsService): Settings {
  const [currency, setCurrencyState] = useState<Currency>('usd');
  const [showTestnets, setShowTestnetsState] = useState(false);
  const [privateWallets, setPrivateWalletsState] = useState(false);
  const [privateBalances, setPrivateBalancesState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then((s) => {
      setCurrencyState(s.currency);
      setShowTestnetsState(s.showTestnets);
      setPrivateWalletsState(s.privateWallets);
      setPrivateBalancesState(s.privateBalances);
      setLoaded(true);
    });
  }, [settingsService]);

  const persist = useCallback(
    (partial: Partial<AppSettings>) => {
      settingsService.updateSettings(partial);
    },
    [settingsService],
  );

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    persist({ currency: c });
  }, [persist]);

  const setShowTestnets = useCallback((v: boolean) => {
    setShowTestnetsState(v);
    persist({ showTestnets: v });
  }, [persist]);

  const setPrivateWallets = useCallback((v: boolean) => {
    setPrivateWalletsState(v);
    persist({ privateWallets: v });
  }, [persist]);

  const setPrivateBalances = useCallback((v: boolean) => {
    setPrivateBalancesState(v);
    persist({ privateBalances: v });
  }, [persist]);

  return {
    currency, setCurrency,
    showTestnets, setShowTestnets,
    privateWallets, setPrivateWallets,
    privateBalances, setPrivateBalances,
    loaded,
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
