
import React, { useState, useEffect } from 'react';
import { Wallet, Briefcase, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
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

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  logo: string;
}

const INITIAL_MARKET_DATA: CryptoPrice[] = [
    { symbol: 'BTC', name: 'Bitcoin', price: 66535.50, change: 2.5, logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
    { symbol: 'ETH', name: 'Ethereum', price: 3500.00, change: -1.2, logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
    { symbol: 'BNB', name: 'Binance Coin', price: 605.20, change: 0.8, logo: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
    { symbol: 'SOL', name: 'Solana', price: 145.30, change: 5.4, logo: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
    { symbol: 'XRP', name: 'Ripple', price: 0.62, change: -0.5, logo: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
];

const UserDashboard: React.FC = () => {
  const { theme } = useTheme();
  const { user, systemSettings } = useAuth();
  const [marketData, setMarketData] = useState<CryptoPrice[]>(INITIAL_MARKET_DATA);
  
  const tradeHistory = user?.tradeHistory || [];
  const totalTrades = tradeHistory.length;
  const latestTrades = tradeHistory.slice(0, 5);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysProfitLoss = tradeHistory
      .filter(trade => {
          const tradeDate = new Date(trade.initiated);
          return tradeDate >= today;
      })
      .reduce((acc, trade) => {
          // Robustly handle amount: convert to string, then parse.
          const amountStr = String(trade.amount || '0');
          const amount = parseFloat(amountStr.replace(/[^0-9.]/g, ""));
          if (!isNaN(amount)) {
            if (trade.result === 'Winning') {
                if (trade.payout) {
                    const payout = parseFloat(trade.payout);
                    return acc + (payout - amount);
                }
                // Fallback to default 85% profit if no payout recorded
                return acc + (amount * 0.85);
            } else { // Losing
                return acc - amount;
            }
          }
          return acc;
      }, 0);

  // Manually format to respect the custom symbol set in admin panel
  const formattedBalance = `${systemSettings.currencySymbol}${(user?.availableBalance || 0).toFixed(2)}`;

  useEffect(() => {
    const fetchMarketData = async () => {
        try {
            // Use CoinGecko public API for real-time data.
            // Added API Key and timestamp to prevent caching issues (though API key helps with rate limits)
            const response = await fetch(
                `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin,solana,ripple&order=market_cap_desc&per_page=5&page=1&sparkline=false&x_cg_demo_api_key=CG-VCL6LmzHAxs5NxCBWqxR8Pp3&_=${Date.now()}`
            );
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            
            if (Array.isArray(data)) {
                const formattedData: CryptoPrice[] = data.map((coin: any) => ({
                    symbol: coin.symbol.toUpperCase(),
                    name: coin.name,
                    price: coin.current_price,
                    change: coin.price_change_percentage_24h,
                    logo: coin.image
                }));
                setMarketData(formattedData);
            }
        } catch (error) {
            // Fallback to simulated movement if API fails (likely rate limit)
            setMarketData(prev => prev.map(coin => {
                const volatility = 0.002; // 0.2% movement
                const changeFactor = (Math.random() - 0.5) * 2 * volatility;
                const newPrice = coin.price * (1 + changeFactor);
                return { 
                    ...coin, 
                    price: newPrice, 
                    change: coin.change + (changeFactor * 100) 
                };
            }));
        }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Balance" value={formattedBalance} icon={<Wallet />} color="#4f46e5" />
        {todaysProfitLoss >= 0 ? (
          <StatCard title="Today's Profit/Loss" value={`+${systemSettings.currencySymbol}${todaysProfitLoss.toFixed(2)}`} icon={<TrendingUp />} color="#10b981" />
        ) : (
          <StatCard title="Today's Profit/Loss" value={`-${systemSettings.currencySymbol}${Math.abs(todaysProfitLoss).toFixed(2)}`} icon={<TrendingDown />} color="#ef4444" />
        )}
        <StatCard title="Total Trade" value={totalTrades.toString()} icon={<Briefcase />} color="#3b82f6" />
      </div>

      {/* Live Market Widget */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </div>
              Live Market
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {marketData.map((coin) => (
                  <div key={coin.symbol} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-2">
                          <img src={coin.logo} alt={coin.name} className="w-8 h-8 rounded-full" />
                          <div>
                              <p className="font-bold text-gray-800 dark:text-gray-200">{coin.symbol}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{coin.name}</p>
                          </div>
                      </div>
                      <div className="flex items-end justify-between">
                          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                              ${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <span className={`text-sm font-medium flex items-center ${coin.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {coin.change >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                              {Math.abs(coin.change).toFixed(2)}%
                          </span>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Latest Trade Log</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-slate-800">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Pair</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Type</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Amount</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Result</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Initiated</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-300">
                        {latestTrades.length > 0 ? latestTrades.map((trade, index) => (
                            <tr key={index} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <td className="py-3 px-4 font-medium">{trade.pair}</td>
                                <td className={`py-3 px-4 font-semibold ${trade.type === 'HIGH' ? 'text-success' : 'text-danger'}`}>{trade.type}</td>
                                <td className="py-3 px-4 font-semibold">{trade.amount}</td>
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
                        )) : (
                          <tr>
                            <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">
                              No recent trades to display.
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

export default UserDashboard;
