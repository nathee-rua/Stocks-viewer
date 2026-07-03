import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
  },
};

export default nextConfig;
