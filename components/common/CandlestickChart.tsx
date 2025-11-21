
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, IPriceLine } from 'lightweight-charts';
import { useTheme } from '../../ThemeContext';
import type { OpenTrade } from '../../types';

export interface CandlestickData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

interface CandlestickChartProps {
    data: CandlestickData[];
    activeTrades?: OpenTrade[];
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, activeTrades = [] }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const priceLinesRef = useRef<IPriceLine[]>([]);
    const { theme } = useTheme();

    // Effect for chart initialization and cleanup
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });
        
        chartRef.current = chart;

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderDownColor: '#ef4444',
            borderUpColor: '#10b981',
            wickDownColor: '#ef4444',
            wickUpColor: '#10b981',
        });
        
        seriesRef.current = candlestickSeries;
        chart.timeScale().fitContent();

        const handleResize = () => {
            if(chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []); // Run only once

    // Effect for theme changes
    useEffect(() => {
        if (!chartRef.current) return;

        chartRef.current.applyOptions({
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: theme === 'dark' ? '#D1D5DB' : '#1F2937',
            },
            grid: {
                vertLines: { color: theme === 'dark' ? '#374151' : '#E5E7EB' },
                horzLines: { color: theme === 'dark' ? '#374151' : '#E5E7EB' },
            },
            timeScale: {
                borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
            },
            rightPriceScale: {
                borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
            },
        });
    }, [theme]);

    // Effect for data updates
    useEffect(() => {
        if (seriesRef.current && data.length > 0) {
            seriesRef.current.setData(data);
        }
    }, [data]);

    // Effect for Active Trades (Price Lines)
    useEffect(() => {
        if (!seriesRef.current) return;

        // Cleanup existing lines
        priceLinesRef.current.forEach(line => {
            seriesRef.current?.removePriceLine(line);
        });
        priceLinesRef.current = [];

        // Add lines for current active trades
        if (activeTrades && activeTrades.length > 0) {
            activeTrades.forEach(trade => {
                const isHigh = trade.type === 'HIGH';
                const color = isHigh ? '#10b981' : '#ef4444';
                
                const priceLine = seriesRef.current?.createPriceLine({
                    price: trade.entryPrice,
                    color: color,
                    lineWidth: 2,
                    lineStyle: 2, // Dashed
                    axisLabelVisible: true,
                    title: `${trade.type} $${trade.amount}`,
                });

                if (priceLine) {
                    priceLinesRef.current.push(priceLine);
                }
            });
        }
    }, [activeTrades]);

    return <div ref={chartContainerRef} className="w-full h-[400px]" />;
};

export default CandlestickChart;
