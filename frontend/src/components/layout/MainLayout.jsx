import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout({ children, history, onHistoryClick, mode, setMode }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-300">
            <Sidebar 
                history={history} 
                onHistoryClick={onHistoryClick} 
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            
            <div className="flex-1 flex flex-col relative min-w-0">
                <Header mode={mode} setMode={setMode} />
                <main className="flex-1 relative overflow-hidden flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    );
}
