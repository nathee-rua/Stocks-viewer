export interface StockInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  prevPrice: number;
  sparkline: number[];
  logo: string;
}

export interface Transaction {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  date: string;
}

export interface BacktestSignal {
  time: string; // YYYY-MM-DD
  type: 'buy' | 'sell';
  price: number;
}

export interface BacktestResult {
  totalReturn: number;
  winRate: number;
  numTrades: number;
  signals: BacktestSignal[];
  maFastValues: { time: string; value: number }[];
  maSlowValues: { time: string; value: number }[];
  chartData: any[];
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  url: string;
  summary: string;
}

// Initial mock stock data
export const INITIAL_STOCKS: Record<string, Omit<StockInfo, 'price' | 'change' | 'changePercent' | 'prevPrice'>> = {
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple, Inc.',
    logo: '🍎',
    sparkline: [175, 176, 174, 178, 180, 179, 182, 184, 182, 185, 188, 192.53],
  },
  PYPL: {
    symbol: 'PYPL',
    name: 'PayPal, Inc.',
    logo: '💳',
    sparkline: [62, 61, 59, 58, 60, 57, 56, 55, 54, 53, 52, 51.20],
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    logo: '⚡',
    sparkline: [180, 185, 178, 170, 168, 175, 182, 190, 188, 192, 191, 192.53],
  },
  AMZN: {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    logo: '📦',
    sparkline: [165, 168, 170, 172, 171, 174, 178, 180, 182, 185, 184, 186.20],
  },
  SPOT: {
    symbol: 'SPOT',
    name: 'Spotify Technology S.A.',
    logo: '🎵',
    sparkline: [220, 224, 222, 228, 235, 230, 238, 245, 240, 248, 252, 256.40],
  },
  ABNB: {
    symbol: 'ABNB',
    name: 'Airbnb, Inc.',
    logo: '🏠',
    sparkline: [150, 148, 152, 154, 153, 156, 158, 162, 160, 164, 166, 168.10],
  },
  ENVT: {
    symbol: 'ENVT',
    name: 'Envato Pty Ltd',
    logo: '🍃',
    sparkline: [22, 21, 23, 24, 23.5, 25, 26, 25.8, 27, 28, 27.5, 28.30],
  },
};

// Generate OHLCV historical data for the last 300 days
export function generateHistoricalData(symbol: string, days: number = 300): any[] {
  const stock = INITIAL_STOCKS[symbol];
  if (!stock) return [];
  
  let basePrice = stock.sparkline[stock.sparkline.length - 1];
  const data: any[] = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Random walk with slight upward bias (except PYPL)
    const bias = symbol === 'PYPL' ? -0.02 : 0.05;
    const change = (Math.random() - 0.5 + bias / 20) * (basePrice * 0.02);
    const prevClose = basePrice;
    basePrice += change;
    
    const open = prevClose;
    const close = basePrice;
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.01);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.01);
    const volume = Math.floor(Math.random() * 5000000) + 1000000;
    
    const timeStr = date.toISOString().split('T')[0];
    
    data.push({
      time: timeStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      value: parseFloat(close.toFixed(2)), // For line chart compatibility
      volume: volume,
    });
  }
  
  return data;
}

// Interactive MA Backtest Engine
export function runMABacktest(historicalData: any[], maFastPeriod: number, maSlowPeriod: number): BacktestResult {
  const calculateMA = (data: any[], period: number): number[] => {
    const ma: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        ma.push(0); // Not enough data
      } else {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += data[i - j].close;
        }
        ma.push(parseFloat((sum / period).toFixed(2)));
      }
    }
    return ma;
  };

  const maFast = calculateMA(historicalData, maFastPeriod);
  const maSlow = calculateMA(historicalData, maSlowPeriod);
  
  const signals: BacktestSignal[] = [];
  const maFastValues: { time: string; value: number }[] = [];
  const maSlowValues: { time: string; value: number }[] = [];
  const chartData: any[] = [];
  
  let position: 'none' | 'long' = 'none';
  let totalReturn = 0;
  let capital = 10000; // Starting capital
  let initialCapital = capital;
  let numTrades = 0;
  let winningTrades = 0;
  let buyPrice = 0;

  for (let i = 0; i < historicalData.length; i++) {
    const item = historicalData[i];
    const fastVal = maFast[i];
    const slowVal = maSlow[i];
    
    if (fastVal > 0) maFastValues.push({ time: item.time, value: fastVal });
    if (slowVal > 0) maSlowValues.push({ time: item.time, value: slowVal });
    
    chartData.push({
      ...item,
      maFast: fastVal > 0 ? fastVal : null,
      maSlow: slowVal > 0 ? slowVal : null,
    });
    
    // Check signals (Dual Moving Average Crossover)
    if (i > 0 && fastVal > 0 && slowVal > 0 && maFast[i - 1] > 0 && maSlow[i - 1] > 0) {
      const prevFast = maFast[i - 1];
      const prevSlow = maSlow[i - 1];
      
      // Fast cross above Slow -> BUY
      if (prevFast <= prevSlow && fastVal > slowVal && position === 'none') {
        position = 'long';
        buyPrice = item.close;
        signals.push({
          time: item.time,
          type: 'buy',
          price: item.close,
        });
      } 
      // Fast cross below Slow -> SELL
      else if (prevFast >= prevSlow && fastVal < slowVal && position === 'long') {
        position = 'none';
        numTrades++;
        const tradeReturn = (item.close - buyPrice) / buyPrice;
        capital += capital * tradeReturn;
        
        if (tradeReturn > 0) winningTrades++;
        
        signals.push({
          time: item.time,
          type: 'sell',
          price: item.close,
        });
      }
    }
  }

  // Handle open position at the end
  if (position === 'long') {
    const finalClose = historicalData[historicalData.length - 1].close;
    numTrades++;
    const tradeReturn = (finalClose - buyPrice) / buyPrice;
    capital += capital * tradeReturn;
    if (tradeReturn > 0) winningTrades++;
  }

  totalReturn = ((capital - initialCapital) / initialCapital) * 100;
  const winRate = numTrades > 0 ? (winningTrades / numTrades) * 100 : 0;

  return {
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    winRate: parseFloat(winRate.toFixed(2)),
    numTrades,
    signals,
    maFastValues,
    maSlowValues,
    chartData,
  };
}

// Generate mock financial news
export const MOCK_NEWS: Record<string, NewsItem[]> = {
  ALL: [
    {
      id: 'n1',
      title: 'Fed signals rate stability amid moderate job growth.',
      source: 'Bloomberg',
      time: '2 hours ago',
      url: '#',
      summary: 'Federal Reserve officials emphasized that interest rates remain restrictive enough to cooling inflation down, signaling a pause in policy.',
    },
    {
      id: 'n2',
      title: 'Global Chip shortage eases, driving tech stocks rally.',
      source: 'Reuters',
      time: '4 hours ago',
      url: '#',
      summary: 'Tech stocks surged today as semiconductor supplies returned to normal levels, easing pressure on major consumer electronics and automotive producers.',
    },
  ],
  AAPL: [
    {
      id: 'a1',
      title: 'Apple leaks reveal next-generation AI chip designs.',
      source: 'TechCrunch',
      time: '30 mins ago',
      url: '#',
      summary: 'Leaked documents indicate that Apple\'s upcoming devices will feature custom M5 chips with dedicated AI accelerators built for local execution.',
    },
    {
      id: 'a2',
      title: 'Analysts bullish on iPhone sales growth in Asian markets.',
      source: 'MarketWatch',
      time: '5 hours ago',
      url: '#',
      summary: 'Brokerages increased their price targets for AAPL, citing higher-than-expected demand for premium iPhones and expanding service sector revenue.',
    },
  ],
  TSLA: [
    {
      id: 't1',
      title: 'Tesla Gigafactory Berlin expansion clears environmental review.',
      source: 'CleanTechnica',
      time: '1 hour ago',
      url: '#',
      summary: 'Tesla has received the official permit to expand its Berlin Gigafactory capacity, paving the way for higher output of Model Y and Model 3 vehicles.',
    },
    {
      id: 't2',
      title: 'Tesla robotaxi unveil date confirmed for late August.',
      source: 'Wired',
      time: '6 hours ago',
      url: '#',
      summary: 'Elon Musk announced that the company is on track to reveal its dedicated autonomous robotaxi design, triggering a 4% rise in pre-market trading.',
    },
  ],
};
