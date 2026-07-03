export interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface SearchResult {
  symbol: string;
  description: string;
}

export interface NewsItem {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number;
}

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const res = await fetch(endpoint);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'API request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getQuote(symbol: string): Promise<QuoteData> {
  const data = await fetchAPI<any>(`/api/stock/quote?symbol=${encodeURIComponent(symbol)}`);
  return { symbol, price: data.c, change: data.d, changePercent: data.dp, high: data.h, low: data.l, open: data.o, previousClose: data.pc, timestamp: data.t };
}

export async function getHistoricalData(symbol: string, from?: number, to?: number): Promise<CandleData[]> {
  let url = `/api/stock/historical?symbol=${encodeURIComponent(symbol)}`;
  if (from) url += `&from=${from}`;
  if (to) url += `&to=${to}`;
  const data = await fetchAPI<{ candles: CandleData[] }>(url);
  return data.candles;
}

export async function searchStocks(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) return [];
  const data = await fetchAPI<{ results: SearchResult[] }>(`/api/stock/search?q=${encodeURIComponent(query)}`);
  return data.results;
}

export async function getNews(symbol: string): Promise<NewsItem[]> {
  const data = await fetchAPI<{ news: NewsItem[] }>(`/api/news?symbol=${encodeURIComponent(symbol)}`);
  return data.news;
}
