
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BarChart, TrendingUp, DollarSign, CreditCard, LifeBuoy, Settings, Power, BarChartHorizontal } from 'lucide-react';
import type { NavItem } from '../../types';
import { useAuth } from '../../AuthContext';

const sidebarNavItems: NavItem[] = [
  { label: 'Dashboard', icon: <BarChart size={20} />, path: '/dashboard' },
  { label: 'Trade Now', icon: <BarChartHorizontal size={20} />, path: '/trade-now' },
  { label: 'Deposit', icon: <DollarSign size={20} />, path: '/deposit' },
  { label: 'Withdraw', icon: <CreditCard size={20} />, path: '/withdraw' },
  { label: 'Trade Log', icon: <TrendingUp size={20} />, path: '/trade-log' },
  { label: 'Support Ticket', icon: <LifeBuoy size={20} />, path: '/support' },
  { label: 'Profile Setting', icon: <Settings size={20} />, path: '/profile-setting' },
  { label: 'Logout', icon: <Power size={20} />, path: '/login' },
];

const UserSidebar: React.FC<{ sidebarOpen: boolean; setSidebarOpen: (arg: boolean) => void }> = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { logout, systemSettings } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const renderNavItem = (item: NavItem) => {
    if (item.label === 'Logout') {
      return (
        <li key={item.label}>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 p-3 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        </li>
      );
    }
    
    return (
      <li key={item.label}>
        <NavLink
          to={item.path || '#'}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 text-sm font-medium rounded-md hover:bg-gray-700 ${isActive ? 'bg-primary text-white' : 'text-gray-300'}`
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      </li>
    );
  };
    
  return (
    <aside className={`absolute left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-hidden bg-secondary duration-300 ease-linear lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <NavLink to="/" className="flex items-center gap-2">
            {systemSettings.logoUrl ? (
                <img src={systemSettings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary"><path d="M4 15V9C4 5.68629 6.68629 3 10 3H14C17.3137 3 20 5.68629 20 9V15C20 18.3137 17.3137 21 14 21H10C6.68629 21 4 18.3137 4 15Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M8 14V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 14V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 14V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
            <span className="text-2xl font-semibold text-white">{systemSettings.siteTitle || 'Crypto Education'}</span>
        </NavLink>
        <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-5 py-4 px-4 lg:px-6">
          <ul className="space-y-2">
            {sidebarNavItems.map(item => renderNavItem(item))}
          </ul>
        </nav>
      </div>
       <div className="mt-auto px-6 pb-6 text-center text-gray-400 text-sm">
            {systemSettings.siteTitle} V3.0
        </div>
    </aside>
  );
};

export default UserSidebar;
