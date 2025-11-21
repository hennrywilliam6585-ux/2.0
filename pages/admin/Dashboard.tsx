
import React, { useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { useAuth } from '../../AuthContext';

const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow relative overflow-hidden">
    <div className="flex items-center gap-4">
      <div className={`text-white p-3 rounded-full`} style={{backgroundColor: color}}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { allUsers } = useAuth();
    
  const dashboardStats = useMemo(() => {
    // Filter out admin users to only count real users
    const usersOnly = allUsers.filter(user => user.role !== 'admin');

    const totalUserFunds = usersOnly.reduce((sum, user) => sum + user.availableBalance, 0);
    
    let totalProfit = 0;
    let totalLoss = 0;

    usersOnly.forEach(user => {
      (user.tradeHistory || []).forEach(trade => {
        // More robust parsing to prevent app crash from malformed trade.amount data.
        const rawAmount = trade.amount;
        let amount = 0;
        if (typeof rawAmount === 'string') {
          amount = parseFloat(rawAmount.replace(/[^0-9.-]+/g, ""));
        } else if (typeof rawAmount === 'number') {
          amount = rawAmount;
        }

        if (!isNaN(amount)) {
          if (trade.result === 'Winning') {
            if (trade.payout) {
                const payout = parseFloat(trade.payout);
                totalProfit += (payout - amount);
            } else {
                // Fallback to default 85% profit rate for legacy trades
                totalProfit += amount * 0.85;
            }
          } else {
            totalLoss += amount;
          }
        }
      });
    });

    // Count total registered users (excluding admins)
    const totalUsers = usersOnly.length;

    return {
      totalUserFunds,
      totalProfit,
      totalLoss,
      totalUsers
    };
  }, [allUsers]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total User Funds" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dashboardStats.totalUserFunds)} icon={<Wallet />} color="#4f46e5" />
        <StatCard title="Total Profit" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dashboardStats.totalProfit)} icon={<TrendingUp />} color="#10b981" />
        <StatCard title="Total Loss" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dashboardStats.totalLoss)} icon={<TrendingDown />} color="#ef4444" />
        <StatCard title="Total Users" value={dashboardStats.totalUsers.toString()} icon={<Users />} color="#f97316" />
      </div>
    </div>
  );
};

export default Dashboard;
