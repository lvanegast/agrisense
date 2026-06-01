import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Bell,
  SlidersHorizontal,
  LogOut,
  Leaf,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/alerts', icon: Bell, label: 'Alertas' },
  { to: '/rules', icon: SlidersHorizontal, label: 'Reglas' },
];

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-forest-950">
      {/* Sidebar */}
      <aside className="w-64 bg-forest-900 border-r border-forest-700 flex flex-col">
        <div className="p-6 border-b border-forest-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sprout-400 to-green-600 flex items-center justify-center">
              <Leaf size={20} className="text-forest-950" />
            </div>
            <div>
              <h1 className="font-syne font-bold text-lg text-white tracking-tight">AgriSense</h1>
              <p className="text-xs text-forest-300 font-mono">v0.1.0</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-forest-700 text-sprout-400 shadow-inner'
                    : 'text-forest-200 hover:text-white hover:bg-forest-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-forest-700">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-forest-200 hover:text-white hover:bg-forest-800 transition-all duration-200 text-sm font-medium"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
