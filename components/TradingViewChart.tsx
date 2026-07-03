'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries, IChartApi, ISeriesApi, SeriesMarker, Time } from 'lightweight-charts';
import { BacktestSignal, HistoricalCandle } from '../lib/stockStore';

interface TradingViewChartProps {
  data: HistoricalCandle[];
  maFastData?: { time: string; value: number }[];
  maSlowData?: { time: string; value: number }[];
  signals?: BacktestSignal[];
}

export default function TradingViewChart({
  data,
  maFastData = [],
  maSlowData = [],
  signals = [],
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const fastLineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const slowLineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0C101A' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 380,
    });

    chartRef.current = chart;

    // Add Candlestick Series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });
    // Format data for lightweight-charts
    const formattedData = data.map(item => ({
      time: item.time as Time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));
    candlestickSeries.setData(formattedData);
    candleSeriesRef.current = candlestickSeries;

    // Add Volume Histogram Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Set as overlay
    });
    // Scale margins to keep volume bars in the bottom 20%
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    const formattedVolume = data.map(item => ({
      time: item.time as Time,
      value: item.volume,
      color: item.close >= item.open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
    }));
    volumeSeries.setData(formattedVolume);
    volumeSeriesRef.current = volumeSeries;

    // Add MA Line Series
    const fastLineSeries = chart.addSeries(LineSeries, {
      color: '#8B5CF6',
      lineWidth: 2,
      title: 'Fast MA',
    });
    fastLineSeriesRef.current = fastLineSeries;

    const slowLineSeries = chart.addSeries(LineSeries, {
      color: '#EAB308',
      lineWidth: 2,
      title: 'Slow MA',
    });
    slowLineSeriesRef.current = slowLineSeries;

    // Handle Resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  // Update Line Series and Markers when MAs or Signals change
  useEffect(() => {
    if (!chartRef.current) return;

    // Update Fast MA Data
    if (fastLineSeriesRef.current) {
      if (maFastData.length > 0) {
        fastLineSeriesRef.current.setData(maFastData.map(d => ({ time: d.time as Time, value: d.value })));
      } else {
        fastLineSeriesRef.current.setData([]);
      }
    }

    // Update Slow MA Data
    if (slowLineSeriesRef.current) {
      if (maSlowData.length > 0) {
        slowLineSeriesRef.current.setData(maSlowData.map(d => ({ time: d.time as Time, value: d.value })));
      } else {
        slowLineSeriesRef.current.setData([]);
      }
    }

    // Update Markers (Buy/Sell signals)
    if (candleSeriesRef.current) {
      const series = candleSeriesRef.current as unknown as { setMarkers: (markers: SeriesMarker<Time>[]) => void };
      if (signals.length > 0) {
        const markers: SeriesMarker<Time>[] = signals.map((sig) => ({
          time: sig.time as Time,
          position: sig.type === 'buy' ? 'belowBar' : 'aboveBar',
          color: sig.type === 'buy' ? '#10B981' : '#EF4444',
          shape: sig.type === 'buy' ? 'arrowUp' : 'arrowDown',
          text: sig.type === 'buy' ? 'BUY' : 'SELL',
          size: 1.5,
        }));
        series.setMarkers(markers);
      } else {
        series.setMarkers([]);
      }
    }
  }, [maFastData, maSlowData, signals]);

  return (
    <div className="relative rounded-2xl border border-card-border overflow-hidden bg-sidebar/50 p-4">
      <div ref={chartContainerRef} className="w-full h-[380px]" />
    </div>
  );
}
