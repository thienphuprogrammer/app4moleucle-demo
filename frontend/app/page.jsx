"use client";

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import DashboardPage from '@/features/dashboard/DashboardPage';
import axios from 'axios';
import { getApiUrl } from '@/lib/utils';

export default function Page() {
  const [history, setHistory] = useState([]);
  
  const fetchHistory = async () => {
    try {
        const res = await axios.get(getApiUrl("/api/molecules/history"));
        setHistory(res.data);
    } catch(e) {}
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  // DashboardPage expects props to handle layout internally?
  // Actually MainLayout is inside DashboardPage in previous code.
  // Refactor: We should move MainLayout to a higher level or wrapping component.
  // BUT: DashboardPage uses MainLayout. ExperimentsPage uses MainLayout.
  // In Next.js App Router, layout.jsx wraps everything.
  // So we should remove MainLayout from individual pages and put it in app/layout?
  // NO: Sidebar state (collapsed) is UI state. MainLayout handles Sidebar + Header.
  // Let's keep using MainLayout as a wrapper for now inside pages, or create a template.
  
  // Wait, the Sidebar needs `history` prop.
  // Ideally, `history` should be global state or fetched in MainLayout.
  // For MVP migration, I will keep passing it down.
  
  return (
      <DashboardPage />
  );
}
