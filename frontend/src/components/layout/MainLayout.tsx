'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { GenerationRecord } from '@/lib/types';

interface MainLayoutProps {
  children: React.ReactNode;
  history?: GenerationRecord[];
  onHistoryClick?: (record: GenerationRecord) => void;
  mode?: 'generate' | 'edit';
  setMode?: (mode: 'generate' | 'edit') => void;
}

export function MainLayout({ children, history, onHistoryClick, mode, setMode }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-300">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} history={history} onHistoryClick={onHistoryClick} />
      <div className="flex-1 flex flex-col relative min-w-0">
        <Header mode={mode} setMode={setMode} />
        <main className="flex-1 relative overflow-hidden flex flex-col">{children}</main>
      </div>
    </div>
  );
}
