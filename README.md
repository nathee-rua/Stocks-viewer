# 📊 Online Stock Tracker — Professional Financial Dashboard

A professional, high-fidelity financial dashboard web application built with **Next.js 16 (App Router)** and styled with a custom dark glassmorphic design. Integrated with **Supabase PostgreSQL & Auth** for cross-device synchronization and real-time APIs (Finnhub & Alpha Vantage) for financial analytics.

🔗 **Production URL**: [https://stocks-viewer-jet.vercel.app](https://stocks-viewer-jet.vercel.app)

---

## ✨ Features Implemented

### 📈 1. Interactive Watchlist & Dashboard
- Live market summary cards highlighting AAPL, PYPL, TSLA, and AMZN with mini-sparklines.
- Dynamic color-coding and border flashes on real-time price changes.
- Multi-timeframe **Portfolio Performance Chart** and **Dividend Chart** built with Recharts.
- Real-time stock search box fetching data directly from `/api/stock/search`.

### 🕯️ 2. High-Performance Trading Charts
- High-fidelity candlestick and volume charts built on **lightweight-charts (v5)**.
- Integrated **Dual Moving Average Crossover Backtesting Engine** (MA Fast 5–50, MA Slow 20–200).
- Automatically calculates historical returns, win rate, and total trades, and overlays buy/sell signal markers directly on the candlestick chart.

### 💼 3. Portfolio & Transaction Log
- Capital metrics widget showcasing Total Invested, Portfolio Value, Net Profit/Loss, and Yield ROI.
- Tabular logs of all transactions with real-time profit calculations.
- Integrated CSV export to easily backup trade details.

### 🔒 4. Supabase Integration & Authentication
- Secure authentication (Sign In & Sign Up) with JWT session cookies and Route Middleware.
- PostgreSQL tables (`profiles`, `watchlists`, `transactions`, `backtest_results`) with Row Level Security (RLS) policies.
- Automatically synchronizes user configurations, watchlist selections, and transactions across all devices.

### 🤖 5. Configurable AI Financial Advisor
- Dynamic LLM support supporting **OpenAI (GPT-4o mini)**, **Google Gemini (2.5 Flash)**, **xAI Grok**, and **Ollama (local)**.
- Settings page to select the preferred model provider and safely store API keys.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Next.js 16.2 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, Custom Glassmorphism, CSS neon shadow variables
- **State Management**: TanStack Query (React Query v5) for caching and background refetching
- **Database & Auth**: Supabase PostgreSQL + Row Level Security (RLS)
- **Charts**: Lightweight-Charts v5, Recharts

---

## 🚀 Local Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/nathee-rua/Stocks-viewer.git
cd Stocks-viewer
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
FINNHUB_API_KEY=your-finnhub-token
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-token
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application locally.

---

## 🛡️ Database Schema (PostgreSQL)

Run the following SQL script in your Supabase SQL Editor to set up the database tables and Row Level Security:

```sql
-- Create profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  ai_provider text DEFAULT 'openai',
  ai_api_key text,
  created_at timestamptz DEFAULT now()
);

-- Create watchlists
CREATE TABLE public.watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  added_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(user_id, symbol)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can manage own watchlist" ON public.watchlists FOR ALL USING (auth.uid() = user_id);
```

---

## 📄 Investment Disclaimer
This application is for educational purposes only. Financial data may be delayed up to 15 minutes. Nothing contained within this system should be construed as investment advice.
