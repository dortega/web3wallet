import { HashRouter, Routes, Route } from 'react-router-dom';
import { ServicesProvider } from './context/services.js';
import { SettingsContext, useSettingsProvider } from './hooks/use-settings.js';
import { useServices } from './hooks/use-services.js';
import { Layout } from './components/Layout.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { CreateWalletPage } from './pages/CreateWalletPage.js';
import { ImportWalletPage } from './pages/ImportWalletPage.js';
import { WalletDetailPage } from './pages/WalletDetailPage.js';
import { TransferPage } from './pages/TransferPage.js';
import { BulkTransferPage } from './pages/BulkTransferPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

function AppInner() {
  const { settingsService } = useServices();
  const settings = useSettingsProvider(settingsService);

  if (!settings.loaded) return null;

  return (
    <SettingsContext.Provider value={settings}>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="create" element={<CreateWalletPage />} />
            <Route path="import" element={<ImportWalletPage />} />
            <Route path="wallet/:address" element={<WalletDetailPage />} />
            <Route path="transfer" element={<TransferPage />} />
            <Route path="bulk-transfer" element={<BulkTransferPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </SettingsContext.Provider>
  );
}

export function App() {
  return (
    <ServicesProvider>
      <AppInner />
    </ServicesProvider>
  );
}
