export interface AIProvider {
  id: string;
  name: string;
  generateAnalysis(
    symbol: string,
    maFast: number,
    maSlow: number,
    currentPrice: number,
    apiKey: string
  ): Promise<string>;
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  openai: {
    id: 'openai',
    name: 'OpenAI (GPT-4o mini)',
    async generateAnalysis(symbol, maFast, maSlow, currentPrice, apiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert financial adviser and technical analyst.',
            },
            {
              role: 'user',
              content: `Analyze the stock ${symbol} currently trading at $${currentPrice}. The technical configuration is: MA Fast (Period: ${maFast}) and MA Slow (Period: ${maSlow}). Write a concise, 4-bullet technical pattern analysis ending with a clear Recommendation: ACCUMULATE, BUY, HOLD, or SELL. Format in Markdown.`,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error?.message || `OpenAI API returned status ${res.status}`);
      }

      const data = await res.json();
      return data.choices[0].message.content;
    },
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini (2.5 Flash)',
    async generateAnalysis(symbol, maFast, maSlow, currentPrice, apiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze the stock ${symbol} currently trading at $${currentPrice}. The technical configuration is: MA Fast (Period: ${maFast}) and MA Slow (Period: ${maSlow}). Write a concise, 4-bullet technical pattern analysis ending with a clear Recommendation: ACCUMULATE, BUY, HOLD, or SELL. Format in Markdown.`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            },
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error?.message || `Gemini API returned status ${res.status}`);
      }

      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    },
  },
  grok: {
    id: 'grok',
    name: 'xAI Grok',
    async generateAnalysis(symbol, maFast, maSlow, currentPrice, apiKey) {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-2-1212',
          messages: [
            {
              role: 'system',
              content: 'You are a professional financial advisor specializing in algorithmic trading.',
            },
            {
              role: 'user',
              content: `Analyze the stock ${symbol} currently trading at $${currentPrice}. The technical configuration is: MA Fast (Period: ${maFast}) and MA Slow (Period: ${maSlow}). Write a concise, 4-bullet technical pattern analysis ending with a clear Recommendation: ACCUMULATE, BUY, HOLD, or SELL. Format in Markdown.`,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error?.message || `Grok API returned status ${res.status}`);
      }

      const data = await res.json();
      return data.choices[0].message.content;
    },
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Localhost)',
    async generateAnalysis(symbol, maFast, maSlow, currentPrice) {
      // Ollama runs locally, we connect to local server
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3',
          prompt: `Analyze the stock ${symbol} currently trading at $${currentPrice}. The technical configuration is: MA Fast (Period: ${maFast}) and MA Slow (Period: ${maSlow}). Write a concise, 4-bullet technical pattern analysis ending with a clear Recommendation: ACCUMULATE, BUY, HOLD, or SELL. Format in Markdown.`,
          stream: false,
        }),
      });

      if (!res.ok) {
        throw new Error(`Ollama local server returned status ${res.status}. Make sure Ollama is running.`);
      }

      const data = await res.json();
      return data.response;
    },
  },
};
