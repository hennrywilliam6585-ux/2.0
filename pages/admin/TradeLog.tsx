
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../AuthContext';
import type { UserTradeLog } from '../../types';
import { Search, ArrowUp, ArrowDown, TrendingUp, TrendingDown, ListChecks } from 'lucide-react';

// Extend the UserTradeLog to include user info for the admin view
interface AdminTradeLogEntry extends UserTradeLog {
    userId: string;
    userName: string;
    userEmail: string;
}

const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow">
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

const AdminTradeLog: React.FC = () => {
    const { allUsers } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const allTrades = useMemo<AdminTradeLogEntry[]>(() => {
        return allUsers.flatMap(user => 
            (user.tradeHistory || []).map(trade => ({
                ...trade,
                userId: user.id,
                userName: user.fullName,
                userEmail: user.email
            }))
        ).sort((a, b) => new Date(b.initiated).getTime() - new Date(a.initiated).getTime());
    }, [allUsers]);

    const filteredTrades = allTrades.filter(trade =>
        trade.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.pair.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalWinning = allTrades.filter(t => t.result === 'Winning').length;
    const totalLosing = allTrades.filter(t => t.result === 'Losing').length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Trades" value={allTrades.length.toString()} icon={<ListChecks />} color="#4f46e5" />
                <StatCard title="Winning Trades" value={totalWinning.toString()} icon={<TrendingUp />} color="#10b981" />
                <StatCard title="Losing Trades" value={totalLosing.toString()} icon={<TrendingDown />} color="#ef4444" />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Global Trade Log</h2>
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by User, Email, Pair..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md py-2 pl-10 pr-4 focus:outline-none"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-slate-800">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">User</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Pair</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Type</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Amount</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Entry / Exit Price</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Result</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Initiated</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-gray-300">
                            {filteredTrades.length > 0 ? (
                                filteredTrades.map((trade, index) => (
                                    <tr key={`${trade.userId}-${index}`} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="py-3 px-4">
                                            <div>
                                                <span className="font-medium">{trade.userName}</span>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{trade.userEmail}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-medium">{trade.pair}</td>
                                        <td className="py-3 px-4">
                                            <span className={`flex items-center gap-1 font-semibold ${trade.type === 'HIGH' ? 'text-success' : 'text-danger'}`}>
                                                {trade.type === 'HIGH' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                                {trade.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-semibold">{trade.amount}</td>
                                        <td className="py-3 px-4">
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">Entry: </span>{trade.entryPrice}
                                            </div>
                                             <div>
                                                <span className="text-gray-500 dark:text-gray-400">Exit: </span>{trade.exitPrice}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                trade.result === 'Winning' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                                'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                            }`}>
                                                {trade.result}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-xs">{new Date(trade.initiated).toLocaleString('en-US', { timeZone: 'America/New_York' })}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        No trade history found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminTradeLog;
