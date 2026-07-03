'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, Wallet, BrainCircuit, Calendar, User, CheckSquare, ChevronRight, Menu as MenuIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'MENU',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Portfolio & Logs', href: '/portfolio', icon: Wallet },
      ],
    },
    {
      title: 'TOOLS & AI',
      items: [
        { name: 'AI Analyzer', href: '/stock/AAPL', icon: BrainCircuit, badge: 'NEW' },
        { name: 'Trending Stocks', href: '/#trending', icon: TrendingUp },
      ],
    },
    {
      title: 'UTILITIES',
      items: [
        { name: 'Calendar', href: '#', icon: Calendar },
        { name: 'User Profile', href: '#', icon: User },
        { name: 'Tasks', href: '#', icon: CheckSquare },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen border-r border-card-border bg-sidebar transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-purple/20 text-accent-purple shadow-neon-purple">
            <TrendingUp size={20} />
          </div>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold tracking-tight text-white"
            >
              Stock<span className="text-accent-purple">Tracker</span>
            </motion.span>
          )}
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-white"
        >
          <MenuIcon size={18} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-6 px-4 py-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
        {menuItems.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-2">
            {isOpen && (
              <h3 className="px-3 text-xs font-semibold tracking-wider text-muted/60">
                {group.title}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item, idx) => {
                const isActive = pathname === item.href || (item.name === 'AI Analyzer' && pathname.startsWith('/stock/'));
                const Icon = item.icon;

                return (
                  <li key={idx}>
                    <Link
                      href={item.href}
                      className={`relative flex items-center justify-between rounded-lg px-3 py-2.5 transition-all group ${
                        isActive
                          ? 'bg-accent-purple/10 text-white font-medium shadow-sm'
                          : 'text-muted hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          className={`transition-colors ${
                            isActive ? 'text-accent-purple' : 'text-muted group-hover:text-white'
                          }`}
                        />
                        {isOpen && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </div>

                      {isOpen && item.badge && (
                        <span className="rounded bg-accent-purple/20 px-1.5 py-0.5 text-[10px] font-medium text-accent-purple">
                          {item.badge}
                        </span>
                      )}

                      {isOpen && !item.badge && isActive && (
                        <ChevronRight size={14} className="text-accent-purple" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
