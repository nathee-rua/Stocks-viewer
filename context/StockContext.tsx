'use client';

import React, { createContext, useContext } from 'react';
import { useStockStore } from '../hooks/useStockStore';

type StockContextType = ReturnType<typeof useStockStore>;

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const store = useStockStore();
  return (
    <StockContext.Provider value={store}>
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
}
