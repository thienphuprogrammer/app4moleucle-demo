'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Atom, LayoutGrid, FlaskConical, Microscope, BookOpen,
  History, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn, truncate, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui';
import type { GenerationRecord } from '@/lib/types';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  history?: GenerationRecord[];
  onHistoryClick?: (record: GenerationRecord) => void;
}

const navItems = [
  { icon: LayoutGrid, label: 'Dashboard', href: '/' },
  { icon: FlaskConical, label: 'Experiments', href: '/experiments' },
  { icon: Microscope, label: 'Simulation Lab', href: '/simulation' },
  { icon: BookOpen, label: 'Knowledge Base', href: '/knowledge' },
];

export function Sidebar({ collapsed, setCollapsed, history = [], onHistoryClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex-col border-r border-border bg-card/50 backdrop-blur-xl z-20 h-full shadow-sm relative hidden md:flex',
        collapsed ? 'w-16' : 'w-[280px]'
      )}
      style={{ width: collapsed ? 64 : 280 }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center border-b border-border/50 px-6 justify-between">
        <div className="flex items-center gap-3 text-primary cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse" />
            <Atom className="w-8 h-8 relative z-10" />
          </div>
          <motion.div
            initial={false}
            animate={{ opacity: collapsed ? 0 : 1, x: collapsed ? -10 : 0 }}
            className="flex flex-col overflow-hidden whitespace-nowrap"
          >
            <span className="font-bold tracking-tight font-display text-xl leading-none bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              CHEM.AI
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] mt-0.5">Research Lab</span>
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <div className="py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group relative overflow-hidden',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
              <span className={cn('relative z-10 transition-transform group-hover:scale-110 duration-200', isActive && 'scale-110')}>
                <Icon className="w-5 h-5" />
              </span>
              {!collapsed && <span className="text-sm relative z-10">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      {!collapsed && <div className="mx-6 my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />}

      {/* History */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
          <div className="px-3 flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-bold mb-4">
            <History className="w-3.5 h-3.5" /> Recent Synthesis
          </div>
          <div className="space-y-1">
            {history.slice(0, 10).map((record) => (
              <div
                key={record.id}
                onClick={() => onHistoryClick?.(record)}
                className="px-3 py-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-all group"
              >
                <p className="text-sm text-foreground font-medium truncate group-hover:text-primary">
                  {truncate(record.prompt, 30)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(record.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapse Button */}
      <div className="p-4 border-t border-border/50">
        <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all justify-between px-4" onClick={() => setCollapsed(!collapsed)}>
          {!collapsed && <span className="text-sm font-medium">Collapse Sidebar</span>}
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  );
}
