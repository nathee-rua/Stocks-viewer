import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AI_PROVIDERS } from '@/lib/ai/aiProviders';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Enforce authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { symbol, maFast, maSlow, currentPrice } = await request.json();
    if (!symbol || !maFast || !maSlow || !currentPrice) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch user profile settings for AI provider
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('ai_provider, ai_api_key')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Could not fetch user profile settings' }, { status: 500 });
    }

    const providerId = profile.ai_provider || 'openai';
    const provider = AI_PROVIDERS[providerId];

    if (!provider) {
      return NextResponse.json({ error: `Unsupported AI provider: ${providerId}` }, { status: 400 });
    }

    // Use user-specific API key, fallback to system environment variables for testing
    let apiKey = profile.ai_api_key;
    if (!apiKey) {
      if (providerId === 'openai') apiKey = process.env.OPENAI_API_KEY;
      else if (providerId === 'gemini') apiKey = process.env.GEMINI_API_KEY;
      else if (providerId === 'grok') apiKey = process.env.GROK_API_KEY;
    }

    // Ollama does not need an API key
    if (providerId !== 'ollama' && !apiKey) {
      return NextResponse.json({
        error: `API Key for ${provider.name} is missing. Please set it in Settings.`,
        needsConfig: true
      }, { status: 400 });
    }

    const analysis = await provider.generateAnalysis(
      symbol,
      maFast,
      maSlow,
      currentPrice,
      apiKey || ''
    );

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('AI Analysis Error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred during AI analysis' }, { status: 500 });
  }
}
