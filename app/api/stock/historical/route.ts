import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/api/cache';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const resolution = searchParams.get('resolution') || 'D';
  const now = Math.floor(Date.now() / 1000);
  const from = searchParams.get('from') || String(now - 365 * 24 * 60 * 60);
  const to = searchParams.get('to') || String(now);

  if (!symbol) {
    return NextResponse.json(
      { error: 'Missing required parameter: symbol' },
      { status: 400 }
    );
  }

  const cacheKey = `historical:${symbol.toUpperCase()}:${resolution}:${from}:${to}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  let token = process.env.FINNHUB_API_KEY || '';
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stock_api_key')
        .eq('id', user.id)
        .single();
      if (profile?.stock_api_key) {
        token = profile.stock_api_key;
      }
    }
  } catch {
    // Fall back
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${encodeURIComponent(resolution)}&from=${from}&to=${to}&token=${token}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch historical data from Finnhub' },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.s === 'no_data') {
      return NextResponse.json(
        { error: 'No data available for the given symbol and time range' },
        { status: 404 }
      );
    }

    const candles = data.t.map((timestamp: number, i: number) => ({
      time: new Date(timestamp * 1000).toISOString().split('T')[0],
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i],
    }));

    const result = { candles };
    setCache(cacheKey, result, 300);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch historical data from Finnhub' },
      { status: 502 }
    );
  }
}
