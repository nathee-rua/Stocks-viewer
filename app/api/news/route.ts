import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/api/cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Missing required parameter: symbol' },
      { status: 400 }
    );
  }

  const cacheKey = `news:${symbol.toUpperCase()}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const toDate = today.toISOString().split('T')[0];
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

    const response = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${fromDate}&to=${toDate}&token=${process.env.FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch news from Finnhub' },
        { status: 502 }
      );
    }

    const data = await response.json();

    interface RawNewsItem {
      id: number | string;
      headline?: string;
      summary?: string;
      source?: string;
      url?: string;
      image?: string;
      datetime?: number;
    }

    const news = ((data as RawNewsItem[]) || []).slice(0, 20).map((item) => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      source: item.source,
      url: item.url,
      image: item.image,
      datetime: item.datetime,
    }));

    const result = { news };
    setCache(cacheKey, result, 600);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch news from Finnhub' },
      { status: 502 }
    );
  }
}
