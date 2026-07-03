'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Disclaimer from './Disclaimer';
import QueryProvider from './QueryProvider';
import { StockProvider, useStock } from '../context/StockContext';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useStock();

  const isAuthPage = pathname === '/login';

  useEffect(() => {
    if (isLoaded && !user && !isAuthPage) {
      router.push('/login');
    }
  }, [user, isLoaded, pathname, router, isAuthPage]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-purple border-t-transparent" />
      </div>
    );
  }

  if (!user && !isAuthPage) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-purple border-t-transparent" />
      </div>
    );
  }

  // Hide header and sidebar on login page
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-background text-white antialiased flex flex-col justify-between">
        <main className="flex-1 flex items-center justify-center">
          {children}
        </main>
        <Disclaimer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white antialiased">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div
        className="min-h-screen flex flex-col transition-all duration-300"
        style={{ paddingLeft: sidebarOpen ? '16rem' : '5rem' }}
      >
        {/* Header */}
        <Header />

        {/* Main View Grid */}
        <main className="flex-1 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Disclaimer Footer */}
        <Disclaimer />
      </div>
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <StockProvider>
        <MainLayoutContent>{children}</MainLayoutContent>
      </StockProvider>
    </QueryProvider>
  );
}
