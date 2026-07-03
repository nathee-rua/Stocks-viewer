import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/api/cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'Missing required parameter: q' },
      { status: 400 }
    );
  }

  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${process.env.FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch search results from Finnhub' },
        { status: 502 }
      );
    }

    const data = await response.json();

    interface RawSearchItem {
      symbol: string;
      description: string;
      type: string;
    }

    const results = ((data.result as RawSearchItem[]) || [])
      .filter((item) => item.type === 'Common Stock')
      .slice(0, 10)
      .map((item) => ({
        symbol: item.symbol,
        description: item.description,
      }));

    const result = { results };
    setCache(cacheKey, result, 600);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch search results from Finnhub' },
      { status: 502 }
    );
  }
}
