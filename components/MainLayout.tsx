'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { StockProvider } from '../context/StockContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <StockProvider>
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
        </div>
      </div>
    </StockProvider>
  );
}
