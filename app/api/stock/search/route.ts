import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/api/cache';
import { INITIAL_STOCKS } from '@/lib/stockStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'Missing required parameter: q' },
      { status: 400 }
    );
  }

  const queryUpper = query.toUpperCase();
  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getCached<any>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // 1. Search locally in INITIAL_STOCKS
  const localMatches = Object.values(INITIAL_STOCKS)
    .filter(
      (stock) =>
        stock.symbol.toUpperCase().includes(queryUpper) ||
        stock.name.toUpperCase().includes(queryUpper)
    )
    .map((stock) => ({
      symbol: stock.symbol,
      description: stock.name,
    }));

  let results = [...localMatches];

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${process.env.FINNHUB_API_KEY}`
    );

    if (response.ok) {
      const data = await response.json();

      interface RawSearchItem {
        symbol: string;
        description: string;
        type: string;
      }

      const apiResults = ((data.result as RawSearchItem[]) || [])
        .filter((item) => item.type === 'Common Stock' || item.type === 'Index' || item.type === 'ETF')
        .map((item) => ({
          symbol: item.symbol,
          description: item.description,
        }));

      // Merge avoiding duplicates
      const seen = new Set(results.map((r) => r.symbol.toUpperCase()));
      for (const item of apiResults) {
        if (!seen.has(item.symbol.toUpperCase())) {
          seen.add(item.symbol.toUpperCase());
          results.push(item);
        }
      }
    }
  } catch {
    // Fall back to local results
  }

  // Limit to top 15 results
  results = results.slice(0, 15);

  const result = { results };
  setCache(cacheKey, result, 600);

  return NextResponse.json(result);
}
