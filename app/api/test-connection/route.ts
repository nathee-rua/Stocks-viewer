import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { type, provider, key } = await request.json();

    if (!key || key.trim() === '') {
      return NextResponse.json({ success: false, error: 'API key is empty' }, { status: 400 });
    }

    if (type === 'stock') {
      // Test Finnhub connection
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${key}`);
      if (!res.ok) {
        return NextResponse.json({ success: false, error: 'Connection test failed. Invalid API key.' });
      }
      const data = await res.json();
      if (data.error || (data.c === 0 && data.t === 0)) {
        return NextResponse.json({ success: false, error: 'Connection test failed. Invalid symbol or authentication error.' });
      }
      return NextResponse.json({ success: true, message: 'Stock API connection test successful!' });
    } else if (type === 'ai') {
      // Test AI connection
      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 5,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json({ success: false, error: err.error?.message || `OpenAI test failed with status ${res.status}` });
        }
        return NextResponse.json({ success: true, message: 'OpenAI API connection test successful!' });
      } else if (provider === 'gemini') {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'test' }] }],
              generationConfig: { maxOutputTokens: 5 },
            }),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json({ success: false, error: err.error?.message || `Gemini test failed with status ${res.status}` });
        }
        return NextResponse.json({ success: true, message: 'Gemini API connection test successful!' });
      } else if (provider === 'grok') {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: 'grok-2-1212',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 5,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json({ success: false, error: err.error?.message || `Grok test failed with status ${res.status}` });
        }
        return NextResponse.json({ success: true, message: 'Grok API connection test successful!' });
      } else if (provider === 'ollama') {
        const res = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3',
            prompt: 'test',
            stream: false,
          }),
        });
        if (!res.ok) {
          return NextResponse.json({ success: false, error: `Ollama test failed with status ${res.status}` });
        }
        return NextResponse.json({ success: true, message: 'Ollama connection test successful!' });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid configuration' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Network error occurred during connection test' });
  }
}
