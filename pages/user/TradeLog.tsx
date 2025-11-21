
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '../../AuthContext';

const TradeLog: React.FC = () => {
    const { user } = useAuth();
    const tradeLogData = user?.tradeHistory || [];

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Trade History</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-slate-800">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Pair</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Type</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Amount</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Entry Price</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Exit Price</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Result</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Initiated</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-300">
                        {tradeLogData.length > 0 ? (
                            tradeLogData.map((log, index) => (
                                <tr key={index} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="py-3 px-4 font-medium">{log.pair}</td>
                                    <td className="py-3 px-4">
                                        <span className={`flex items-center gap-1 font-semibold ${log.type === 'HIGH' ? 'text-success' : 'text-danger'}`}>
                                            {log.type === 'HIGH' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                            {log.type}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 font-semibold">{log.amount}</td>
                                    <td className="py-3 px-4">{log.entryPrice}</td>
                                    <td className="py-3 px-4">{log.exitPrice}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                            log.result === 'Winning' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                            'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                        }`}>
                                            {log.result}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs">{new Date(log.initiated).toLocaleString('en-US', { timeZone: 'America/New_York' })}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    You have no trade history yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TradeLog;
