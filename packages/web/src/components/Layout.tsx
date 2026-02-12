import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';

const mainNav = [
  { to: '/', label: 'Dashboard' },
  { to: '/transfer', label: 'Transfer' },
  { to: '/bulk-transfer', label: 'Bulk Transfer' },
  { to: '/walletconnect', label: 'WalletConnect' },
];

const configNav = [
  { to: '/settings', label: 'Settings' },
];

function NavItem({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-sm transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — always visible on md+, slide-in drawer on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-56 border-r border-gray-800 bg-gray-900 p-4 flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <h1 className="text-lg font-bold mb-6 px-3">W3W</h1>
        <nav className="flex flex-col gap-1 flex-1">
          {mainNav.map((item) => (
            <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />
          ))}
        </nav>
        <nav className="flex flex-col gap-1 border-t border-gray-800 pt-3 mt-3">
          {configNav.map((item) => (
            <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-3">
          <h1 className="text-lg font-bold">W3W</h1>
          <button
            onClick={() => setOpen(!open)}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-3xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
