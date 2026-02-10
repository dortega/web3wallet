import { HashRouter, Routes, Route } from 'react-router-dom';
import { ServicesProvider } from './context/services.js';
import { SettingsContext, useSettingsProvider } from './hooks/use-settings.js';
import { Layout } from './components/Layout.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { CreateWalletPage } from './pages/CreateWalletPage.js';
import { ImportWalletPage } from './pages/ImportWalletPage.js';
import { WalletDetailPage } from './pages/WalletDetailPage.js';
import { TransferPage } from './pages/TransferPage.js';
import { BulkTransferPage } from './pages/BulkTransferPage.js';
import { ChainsPage } from './pages/ChainsPage.js';
import { TokensPage } from './pages/TokensPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export function App() {
  const settings = useSettingsProvider();

  return (
    <SettingsContext.Provider value={settings}>
      <ServicesProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="create" element={<CreateWalletPage />} />
              <Route path="import" element={<ImportWalletPage />} />
              <Route path="wallet/:address" element={<WalletDetailPage />} />
              <Route path="transfer" element={<TransferPage />} />
              <Route path="bulk-transfer" element={<BulkTransferPage />} />
              <Route path="chains" element={<ChainsPage />} />
              <Route path="tokens" element={<TokensPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </ServicesProvider>
    </SettingsContext.Provider>
  );
}
