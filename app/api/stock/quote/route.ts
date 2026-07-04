import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/api/cache';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Missing required parameter: symbol' },
      { status: 400 }
    );
  }

  const cacheKey = `quote:${symbol.toUpperCase()}`;
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
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch quote from Finnhub' },
        { status: 502 }
      );
    }

    const data = await response.json();
    setCache(cacheKey, data, 60);

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch quote from Finnhub' },
      { status: 502 }
    );
  }
}
