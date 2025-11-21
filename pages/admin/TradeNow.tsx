import React, { useState, useEffect } from 'react';
import CandlestickChart, { CandlestickData } from '../../components/common/CandlestickChart';
import { ArrowUp, ArrowDown } from 'lucide-react';

const PAIR_DATA: { [key: string]: { name: string; basePrice: number; } } = {
    'BTC/USD': { name: 'Bitcoin', basePrice: 66535.50 },
    'ETH/USD': { name: 'Ethereum', basePrice: 3800 },
    'LTC/USD': { name: 'Litecoin', basePrice: 150 },
};

const generateCandle = (lastCandle: CandlestickData, basePrice: number): CandlestickData => {
    const volatility = basePrice * 0.0005;
    const open = lastCandle.close;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * (volatility / 2);
    const low = Math.min(open, close) - Math.random() * (volatility / 2);
    const time = lastCandle.time + 60; // next minute
    return { time, open, high, low, close };
};

const generateInitialData = (basePrice: number): CandlestickData[] => {
    const data: CandlestickData[] = [];
    let lastClose = basePrice;
    const now = Date.now();
    for (let i = 119; i >= 0; i--) { // 120 minutes of data
        const time = Math.floor((now - i * 60 * 1000) / 1000);
        const volatility = basePrice * 0.005;
        const open = lastClose;
        const close = open + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * (volatility / 2);
        const low = Math.min(open, close) - Math.random() * (volatility / 2);
        const candle = { time, open, high, low, close };
        data.push(candle);
        lastClose = candle.close;
    }
    return data;
};


const TradeNow: React.FC = () => {
    const [activePair, setActivePair] = useState('BTC/USD');
    const [chartData, setChartData] = useState<CandlestickData[]>(generateInitialData(PAIR_DATA[activePair].basePrice));
    const [marketStats, setMarketStats] = useState({ high: 0, low: 0, volume: 0 });
    const [activeTableTab, setActiveTableTab] = useState<'positions' | 'history'>('positions');
    
    const lastPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0;
    const prevPrice = chartData.length > 1 ? chartData[chartData.length - 2].close : 0;
    const priceChange = lastPrice - prevPrice;

    useEffect(() => {
        setChartData(generateInitialData(PAIR_DATA[activePair].basePrice));
    }, [activePair]);

    useEffect(() => {
        const interval = setInterval(() => {
            setChartData(prevData => {
                const lastCandle = prevData[prevData.length - 1];
                const newCandle = generateCandle(lastCandle, PAIR_DATA[activePair].basePrice);
                return [...prevData.slice(1), newCandle];
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [activePair]);

    useEffect(() => {
        if (chartData.length > 0) {
            const last24hData = chartData.slice(-24 * 20); // Approximation for 24h
            const high = Math.max(...last24hData.map(d => d.high));
            const low = Math.min(...last24hData.map(d => d.low));
            const volume = Math.random() * 10000 + 5000;
            setMarketStats({ high, low, volume });
        }
    }, [chartData]);
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b dark:border-slate-700 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                            <select value={activePair} onChange={(e) => setActivePair(e.target.value)} className="font-semibold text-lg bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none">
                                {Object.keys(PAIR_DATA).map(pair => <option key={pair} value={pair}>{pair}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div className="text-center sm:text-right">
                                <p className={`text-xl font-bold ${priceChange >= 0 ? 'text-success' : 'text-danger'}`}>{lastPrice.toFixed(2)}</p>
                                <p className="text-gray-500 dark:text-gray-400">Price (USD)</p>
                            </div>
                            <div className="text-center sm:text-right">
                                <p className="text-gray-800 dark:text-gray-200 font-medium">{marketStats.high.toFixed(2)}</p>
                                <p className="text-gray-500 dark:text-gray-400">24h High</p>
                            </div>
                            <div className="text-center sm:text-right">
                                <p className="text-gray-800 dark:text-gray-200 font-medium">{marketStats.low.toFixed(2)}</p>
                                <p className="text-gray-500 dark:text-gray-400">24h Low</p>
                            </div>
                            <div className="text-center sm:text-right">
                                <p className="text-gray-800 dark:text-gray-200 font-medium">{marketStats.volume.toFixed(2)} {activePair.split('/')[0]}</p>
                                <p className="text-gray-500 dark:text-gray-400">24h Volume</p>
                            </div>
                        </div>
                    </div>
                    <CandlestickChart data={chartData} />
                </div>
                <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl p-6 text-gray-300">
                    <fieldset disabled className="space-y-4 opacity-50">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400">Duration</label>
                                <select className="w-full mt-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-white">
                                    <option>1 Minute</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">Amount</label>
                                <div className="relative">
                                    <input type="number" placeholder="10.00" className="w-full mt-1 pl-7 pr-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-white" />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="w-full py-3 font-bold rounded-md bg-success text-white flex items-center justify-center gap-2">
                                <ArrowUp size={20} />
                                HIGH
                            </button>
                            <button className="w-full py-3 font-bold rounded-md bg-danger text-white flex items-center justify-center gap-2">
                                <ArrowDown size={20} />
                                LOW
                            </button>
                        </div>
                        <div className="text-center text-xs text-gray-400">
                            Practice Balance: $500.00
                        </div>
                    </fieldset>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                 <div className="border-b border-gray-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTableTab('positions')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTableTab === 'positions' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                            Open Trades
                        </button>
                        <button onClick={() => setActiveTableTab('history')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTableTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                            Trade History
                        </button>
                    </nav>
                </div>
                <div className="overflow-x-auto mt-4">
                    <table className="min-w-full bg-white dark:bg-slate-800">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">PAIR</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">TYPE</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">AMOUNT</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">ENTRY PRICE</th>
                                {activeTableTab === 'history' && <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">EXIT PRICE</th>}
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">STATUS</th>
                            </tr>
                        </thead>
                         <tbody className="text-gray-700 dark:text-gray-300">
                             <tr>
                                 <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                     No trades to display.
                                 </td>
                             </tr>
                         </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TradeNow;