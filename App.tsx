
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider, useAuth } from './AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Layouts
import AdminLayout from './components/layouts/AdminLayout';
import UserLayout from './components/layouts/UserLayout';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import CryptoCurrencyList from './pages/admin/CryptoCurrencyList';
import AdminTradeSetting from './pages/admin/TradeSetting';
import AdminTradeLog from './pages/admin/TradeLog';
import SystemSettings from './pages/admin/SystemSettings';
import GeneralSettings from './pages/admin/GeneralSettings';
import DataManagement from './pages/admin/DataManagement';
import AdminLogin from './pages/admin/Login';
import AdminProfile from './pages/admin/Profile';
import ManageUsers from './pages/admin/ManageUsers';
import AdminDeposits from './pages/admin/Deposits';
import AdminWithdrawals from './pages/admin/Withdrawals';
import AdminSupport from './pages/admin/Support';
import LogoFaviconSettings from './pages/admin/LogoFaviconSettings';
import SystemConfigurationPage from './pages/admin/SystemConfiguration';
import ComingSoon from './pages/admin/ComingSoon';
import Subscribers from './pages/admin/Subscribers';

// User Pages
import UserDashboard from './pages/user/Dashboard';
import UserTradeNow from './pages/user/TradeNow';
import Deposit from './pages/user/Deposit';
import Withdraw from './pages/user/Withdraw';
import TradeLog from './pages/user/TradeLog';
import SupportTicket from './pages/user/SupportTicket';
import ProfileSetting from './pages/user/ProfileSetting';

// Frontend Pages
import Login from './pages/frontend/Login';
import SignUp from './pages/frontend/SignUp';

const AppContent: React.FC = () => {
  const { isAuthenticated, user, loading, systemSettings } = useAuth();

  useEffect(() => {
      document.title = systemSettings.siteTitle || "Crypto Education - Online Trading Platform";
      
      // Dynamic Favicon Update
      if (systemSettings.faviconUrl) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = systemSettings.faviconUrl;
      }
  }, [systemSettings]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-slate-900">
         <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} /> : <SignUp />} />
      <Route path="/admin/login" element={isAuthenticated ? <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} /> : <AdminLogin />} />
      
      {/* User Routes */}
      <Route path="/" element={
          !isAuthenticated ? <Navigate to="/login" /> :
          user?.role !== 'user' ? <Navigate to="/admin/dashboard" /> :
          <UserLayout />
        }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="trade-now" element={<UserTradeNow />} />
        <Route path="deposit" element={<Deposit />} />
        <Route path="withdraw" element={<Withdraw />} />
        <Route path="trade-log" element={<TradeLog />} />
        <Route path="support" element={<SupportTicket />} />
        <Route path="profile-setting" element={<ProfileSetting />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
          !isAuthenticated ? <Navigate to="/admin/login" /> :
          user?.role !== 'admin' ? <Navigate to="/dashboard" /> :
          <AdminLayout />
        }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="crypto-currency" element={<CryptoCurrencyList />} />
        <Route path="trade-setting" element={<AdminTradeSetting />} />
        <Route path="trade-log" element={<AdminTradeLog />} />
        <Route path="system-settings" element={<SystemSettings />} />
        <Route path="general-settings" element={<GeneralSettings />} />
        <Route path="data-management" element={<DataManagement />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="deposits" element={<AdminDeposits />} />
        <Route path="withdrawals" element={<AdminWithdrawals />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="logo-favicon" element={<LogoFaviconSettings />} />
        <Route path="system-configuration" element={<SystemConfigurationPage />} />
        <Route path="notification-settings" element={<Subscribers />} /> {/* Using Subscribers page for Notification Settings temporarily if needed, or keeping it separate */}
        
        {/* Placeholder Routes for System Settings */}
        <Route path="payment-gateways" element={<ComingSoon title="Payment Gateways" />} />
        <Route path="withdrawal-methods" element={<ComingSoon title="Withdrawal Methods" />} />
        <Route path="seo-configuration" element={<ComingSoon title="SEO Configuration" />} />
        <Route path="manage-frontend" element={<ComingSoon title="Manage Frontend" />} />
        <Route path="manage-pages" element={<ComingSoon title="Manage Pages" />} />
        <Route path="kyc-setting" element={<ComingSoon title="KYC Settings" />} />
        <Route path="social-login" element={<ComingSoon title="Social Login" />} />
        <Route path="language" element={<ComingSoon title="Language Settings" />} />
        <Route path="extensions" element={<ComingSoon title="Extensions" />} />
        <Route path="cron-job" element={<ComingSoon title="Cron Job Settings" />} />
        <Route path="policy-pages" element={<ComingSoon title="Policy Pages" />} />
        <Route path="maintenance-mode" element={<ComingSoon title="Maintenance Mode" />} />
        <Route path="gdpr-cookie" element={<ComingSoon title="GDPR Cookie" />} />
        <Route path="custom-css" element={<ComingSoon title="Custom CSS" />} />
        <Route path="sitemap" element={<ComingSoon title="Sitemap XML" />} />
        <Route path="robots-txt" element={<ComingSoon title="Robots.txt" />} />
      </Route>
      
      <Route path="*" element={<Navigate to={isAuthenticated ? (user?.role === 'admin' ? "/admin/dashboard" : "/dashboard") : "/login"} />} />
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <HashRouter>
            <AppContent />
          </HashRouter>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
