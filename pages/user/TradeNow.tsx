
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../AuthContext';
import CandlestickChart, { CandlestickData } from '../../components/common/CandlestickChart';
import type { OpenTrade, UserTradeLog as TradeHistoryItem } from '../../types';
import { ArrowUp, ArrowDown, ShieldAlert, Loader2 } from 'lucide-react';

// Map internal pairs to Binance symbols
const BINANCE_SYMBOL_MAP: { [key: string]: string } = {
    'BTC/USD': 'btcusdt',
    'ETH/USD': 'ethusdt',
    'LTC/USD': 'ltcusdt',
    'USDT/USD': 'usdcusdt', // Note: USDT/USD is effectively USDC/USDT or similar stable pair
    'BNB/USD': 'bnbusdt',
    'USDC/USD': 'usdcusdt',
    'XRP/USD': 'xrpusdt',
    'ADA/USD': 'adausdt',
    'SOL/USD': 'solusdt',
};

// Pairs available for selection
const AVAILABLE_PAIRS_LIST = Object.keys(BINANCE_SYMBOL_MAP);

interface CountdownTimerProps {
    expiry: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiry }) => {
    const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
            setTimeLeft(newTimeLeft);
        }, 1000);
        return () => clearInterval(timer);
    }, [expiry]);
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return <span>{`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</span>;
};

const TradeNow: React.FC = () => {
    const { user, placeTrade, cryptoCurrencies, resolveTrades, tradeSettings } = useAuth();
    
    // Filter available pairs based on enabled crypto settings
    const enabledPairs = useMemo(() => {
        const enabledSymbols = cryptoCurrencies.filter(c => c.status === 'Enabled').map(c => c.symbol);
        return AVAILABLE_PAIRS_LIST.filter(pair => {
            const base = pair.split('/')[0];
            return enabledSymbols.includes(base);
        });
    }, [cryptoCurrencies]);

    const [activePair, setActivePair] = useState(enabledPairs[0] || 'BTC/USD');
    const [chartData, setChartData] = useState<CandlestickData[]>([]);
    const [marketStats, setMarketStats] = useState({ high: 0, low: 0, volume: 0 });
    const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');
    const [isLoadingChart, setIsLoadingChart] = useState(true);

    const [tradeAmount, setTradeAmount] = useState('100');
    const [tradeDuration, setTradeDuration] = useState(tradeSettings.durationOptions[0] || 60);
    const [isProcessing, setIsProcessing] = useState(false);
    const openTrades = user?.openTrades || [];
    
    // Derived state
    const lastPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0;
    const prevPrice = chartData.length > 1 ? chartData[chartData.length - 2].close : lastPrice;
    const priceChange = lastPrice - prevPrice;
    const tradeHistory = user?.tradeHistory || [];
    const isPairEnabled = enabledPairs.includes(activePair);

    // Refs for Websockets and Intervals
    const wsKlineRef = useRef<WebSocket | null>(null);
    const wsTickerRef = useRef<WebSocket | null>(null);
    const openTradesRef = useRef(openTrades);
    const chartDataRef = useRef(chartData);
    const tradeDurationRef = useRef(tradeDuration);
    const settingsRef = useRef(tradeSettings);

    // Sync refs
    useEffect(() => { openTradesRef.current = openTrades; }, [openTrades]);
    useEffect(() => { chartDataRef.current = chartData; }, [chartData]);
    useEffect(() => { tradeDurationRef.current = tradeDuration; }, [tradeDuration]);
    useEffect(() => { settingsRef.current = tradeSettings; }, [tradeSettings]);

    // Sync default duration
    useEffect(() => {
        if (tradeSettings.durationOptions.length > 0 && !tradeSettings.durationOptions.includes(tradeDuration)) {
            setTradeDuration(tradeSettings.durationOptions[0]);
        }
    }, [tradeSettings.durationOptions]);

    const chartActiveTrades = useMemo(() => {
        return openTrades.filter(t => t.pair === activePair);
    }, [openTrades, activePair]);

    // --- Fetch Historical Data & Connect WebSocket ---
    useEffect(() => {
        const binanceSymbol = BINANCE_SYMBOL_MAP[activePair];
        if (!binanceSymbol) return;

        setIsLoadingChart(true);
        setChartData([]); // Clear previous data
        
        // 1. Fetch Historical Data via REST API
        fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol.toUpperCase()}&interval=1m&limit=500`)
            .then(res => res.json())
            .then(data => {
                // Binance format: [Open Time, Open, High, Low, Close, Volume, ...]
                const formattedData: CandlestickData[] = data.map((d: any) => ({
                    time: d[0] / 1000,
                    open: parseFloat(d[1]),
                    high: parseFloat(d[2]),
                    low: parseFloat(d[3]),
                    close: parseFloat(d[4]),
                }));
                setChartData(formattedData);
                setIsLoadingChart(false);
            })
            .catch(err => {
                console.error("Error fetching historical klines:", err);
                setIsLoadingChart(false);
            });

        // 2. Close existing WebSockets
        if (wsKlineRef.current) wsKlineRef.current.close();
        if (wsTickerRef.current) wsTickerRef.current.close();

        // 3. Connect Kline WebSocket (Candlesticks)
        wsKlineRef.current = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol}@kline_1m`);
        wsKlineRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const k = message.k;
            
            if (k) {
                const candle: CandlestickData = {
                    time: k.t / 1000,
                    open: parseFloat(k.o),
                    high: parseFloat(k.h),
                    low: parseFloat(k.l),
                    close: parseFloat(k.c),
                };

                setChartData(prev => {
                    const lastCandle = prev[prev.length - 1];
                    // Update current candle if time matches, else push new
                    if (lastCandle && lastCandle.time === candle.time) {
                        const newData = [...prev];
                        newData[newData.length - 1] = candle;
                        return newData;
                    } else {
                        return [...prev, candle];
                    }
                });
            }
        };

        // 4. Connect Ticker WebSocket (24h Stats)
        wsTickerRef.current = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol}@ticker`);
        wsTickerRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // data.h = high, data.l = low, data.v = volume, data.c = current price (already in kline but useful fallback)
            if (data) {
                setMarketStats({
                    high: parseFloat(data.h),
                    low: parseFloat(data.l),
                    volume: parseFloat(data.v)
                });
            }
        };

        return () => {
            if (wsKlineRef.current) wsKlineRef.current.close();
            if (wsTickerRef.current) wsTickerRef.current.close();
        };

    }, [activePair]);
    
    // --- Trade Logic ---
    const handlePlaceTrade = async (type: 'HIGH' | 'LOW') => {
        if (isProcessing) return;

        if (!tradeSettings.tradingEnabled) {
            alert('Trading is currently disabled by the administrator.');
            return;
        }

        if (!isPairEnabled) {
            alert('This pair is currently disabled.');
            return;
        }
        
        if (user?.status === 'Banned') {
            alert('Your account is suspended.');
            return;
        }

        const amount = parseFloat(tradeAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        
        if (amount < tradeSettings.minTradeAmount || amount > tradeSettings.maxTradeAmount) {
             alert(`Trade amount must be between $${tradeSettings.minTradeAmount} and $${tradeSettings.maxTradeAmount}.`);
             return;
        }

        setIsProcessing(true);

        try {
            const newTrade: OpenTrade = {
                id: `trade-${Date.now()}`,
                pair: activePair,
                type,
                amount,
                entryPrice: lastPrice,
                expiryTimestamp: Date.now() + tradeDuration * 1000,
            };

            const result = await placeTrade(newTrade, amount);
            if (!result.success) alert(result.message);
            else await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error("Trade error:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Trade Resolution Loop ---
    useEffect(() => {
        const tradeResolutionInterval = setInterval(() => {
            const now = Date.now();
            const tradesToResolve: { tradeId: string, log: TradeHistoryItem, payout: number }[] = [];
            
            const currentOpenTrades = openTradesRef.current;
            const currentChartData = chartDataRef.current;
            const currentDuration = tradeDurationRef.current;

            if (currentOpenTrades.length === 0) return;
            
            currentOpenTrades.forEach(trade => {
                if (now >= trade.expiryTimestamp) {
                    // Get current price from live chart data
                    const currentPrice = currentChartData.length > 0 ? currentChartData[currentChartData.length - 1].close : trade.entryPrice;
                    const isWin = (trade.type === 'HIGH' && currentPrice > trade.entryPrice) || (trade.type === 'LOW' && currentPrice < trade.entryPrice);
                    
                    let payout = 0;
                    if (isWin) {
                        const profitRate = settingsRef.current.profitPercentage / 100;
                        const profit = trade.amount * profitRate;
                        payout = trade.amount + profit; 
                    }
                    
                    const log: TradeHistoryItem = {
                        pair: trade.pair,
                        type: trade.type,
                        amount: `$ ${trade.amount.toFixed(2)}`,
                        entryPrice: `$ ${trade.entryPrice.toFixed(2)}`,
                        exitPrice: `$ ${currentPrice.toFixed(2)}`,
                        result: isWin ? 'Winning' : 'Losing',
                        initiated: new Date(trade.expiryTimestamp - currentDuration * 1000).toISOString(),
                        payout: payout.toFixed(2),
                    };

                    tradesToResolve.push({ tradeId: trade.id, log, payout });
                }
            });

            if (tradesToResolve.length > 0) {
                resolveTrades(tradesToResolve);
            }
        }, 1000);
        return () => clearInterval(tradeResolutionInterval);
    }, [resolveTrades]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b dark:border-slate-700 pb-4 mb-4">
                         <div className="flex items-center gap-3">
                            <select value={activePair} onChange={(e) => setActivePair(e.target.value)} className="font-semibold text-lg bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer">
                                {enabledPairs.map(pair => <option key={pair} value={pair}>{pair}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div className="text-center sm:text-right">
                                <p className={`text-xl font-bold ${priceChange >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {isLoadingChart ? '...' : lastPrice.toFixed(2)}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400">Price (USD)</p>
                            </div>
                            <div className="text-center sm:text-right">
                                <p className="text-gray-800 dark:text-gray-200 font-medium">
                                    {isLoadingChart ? '...' : marketStats.high.toFixed(2)}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400">24h High</p>
                            </div>
                            <div className="text-center sm:text-right">
                                <p className="text-gray-800 dark:text-gray-200 font-medium">
                                    {isLoadingChart ? '...' : marketStats.low.toFixed(2)}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400">24h Low</p>
                            </div>
                            <div className="text-center sm:text-right">
                                <p className="text-gray-800 dark:text-gray-200 font-medium">
                                    {isLoadingChart ? '...' : marketStats.volume.toFixed(2)}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400">24h Volume</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative min-h-[400px]">
                        {isLoadingChart && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 z-10">
                                <Loader2 size={40} className="animate-spin text-primary" />
                            </div>
                        )}
                        <CandlestickChart data={chartData} activeTrades={chartActiveTrades} />
                    </div>
                </div>
                <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl p-6 text-gray-300">
                    {isPairEnabled ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="duration" className="block text-xs font-medium text-gray-400 mb-1">Duration</label>
                                    <select 
                                        id="duration" 
                                        value={tradeDuration} 
                                        onChange={(e) => setTradeDuration(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                        disabled={isProcessing}
                                    >
                                        {tradeSettings.durationOptions.map(seconds => (
                                            <option key={seconds} value={seconds}>
                                                {seconds < 60 ? `${seconds} Seconds` : `${Math.floor(seconds/60)} Minute${seconds/60 !== 1 ? 's' : ''}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="amount" className="block text-xs font-medium text-gray-400 mb-1">Amount</label>
                                    <div className="relative">
                                        <input 
                                            id="amount" 
                                            type="number" 
                                            value={tradeAmount}
                                            onChange={(e) => setTradeAmount(e.target.value)}
                                            placeholder="100" 
                                            disabled={isProcessing}
                                            className="w-full pl-7 pr-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => handlePlaceTrade('HIGH')} 
                                    disabled={isProcessing}
                                    className={`w-full py-3 font-bold rounded-md text-white flex items-center justify-center gap-2 transition-colors ${isProcessing ? 'bg-gray-600 cursor-not-allowed' : 'bg-success hover:bg-green-500'}`}
                                >
                                    {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <><ArrowUp size={20} /> HIGH</>}
                                </button>
                                <button 
                                    onClick={() => handlePlaceTrade('LOW')} 
                                    disabled={isProcessing}
                                    className={`w-full py-3 font-bold rounded-md text-white flex items-center justify-center gap-2 transition-colors ${isProcessing ? 'bg-gray-600 cursor-not-allowed' : 'bg-danger hover:bg-red-500'}`}
                                >
                                    {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <><ArrowDown size={20} /> LOW</>}
                                </button>
                            </div>
                            <div className="text-center text-xs text-gray-400 space-y-1">
                                <p>Available Balance: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(user?.availableBalance || 0)}</p>
                                <p className="opacity-75">Profit: {tradeSettings.profitPercentage}% | Limit: ${tradeSettings.minTradeAmount} - ${tradeSettings.maxTradeAmount}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <ShieldAlert size={48} className="text-yellow-500 mb-4" />
                            <h3 className="text-lg font-semibold text-yellow-400">Disabled</h3>
                            <p className="text-gray-400 mt-2">This trading pair is currently disabled.</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <div className="border-b border-gray-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('open')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'open' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                            Open Trades <span className="ml-2 bg-primary/20 text-primary text-xs font-bold rounded-full px-2 py-0.5">{openTrades.length}</span>
                        </button>
                        <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                            Trade History
                        </button>
                    </nav>
                </div>
                <div className="overflow-x-auto mt-4">
                    <table className="min-w-full bg-white dark:bg-slate-800">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            {activeTab === 'open' ? (
                                <tr>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Pair</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Type</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Amount</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Entry Price</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Time Left</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Pair</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Type</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Amount</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Entry Price</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Exit Price</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Result</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Initiated</th>
                                </tr>
                            )}
                        </thead>
                         <tbody className="text-gray-700 dark:text-gray-300">
                             {activeTab === 'open' && (
                                 openTrades.length > 0 ? openTrades.map(trade => (
                                     <tr key={trade.id} className="border-b border-gray-200 dark:border-slate-700">
                                         <td className="py-3 px-4 font-medium">{trade.pair}</td>
                                         <td className={`py-3 px-4 font-semibold ${trade.type === 'HIGH' ? 'text-success' : 'text-danger'}`}>{trade.type}</td>
                                        <td className="py-3 px-4 font-semibold">$ {trade.amount.toFixed(2)}</td>
                                        <td className="py-3 px-4">$ {trade.entryPrice.toFixed(2)}</td>
                                        <td className="py-3 px-4 font-mono"><CountdownTimer expiry={trade.expiryTimestamp} /></td>
                                     </tr>
                                 )) : (
                                     <tr><td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">No open trades.</td></tr>
                                 )
                             )}
                             {activeTab === 'history' && (
                                 tradeHistory.length > 0 ? tradeHistory.map((log, index) => (
                                    <tr key={index} className="border-b border-gray-200 dark:border-slate-700">
                                        <td className="py-3 px-4 font-medium">{log.pair}</td>
                                        <td className={`py-3 px-4 font-semibold ${log.type === 'HIGH' ? 'text-success' : 'text-danger'}`}>{log.type}</td>
                                        <td className="py-3 px-4 font-semibold">{log.amount}</td>
                                        <td className="py-3 px-4">{log.entryPrice}</td>
                                        <td className="py-3 px-4">{log.exitPrice}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${log.result === 'Winning' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                                {log.result}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-xs">{new Date(log.initiated).toLocaleString('en-US', { timeZone: 'America/New_York' })}</td>
                                    </tr>
                                 )) : (
                                    <tr><td colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">No trade history to display.</td></tr>
                                 )
                             )}
                         </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TradeNow;
