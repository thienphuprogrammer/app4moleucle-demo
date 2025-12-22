import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useMediaQuery } from '@/hooks/use-media-query';

export function MainLayout({ children, history, onHistoryClick, mode, setMode }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Custom hook or simple check
    const isMobile = useMediaQuery("(max-width: 768px)");

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-300">
            {/* Desktop Sidebar */}
            <Sidebar 
                className="hidden md:flex"
                history={history} 
                onHistoryClick={onHistoryClick} 
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isMobile={false}
            />
            
            {/* Mobile Sidebar (Drawer) */}
            <Sidebar 
                className="md:hidden"
                history={history} 
                onHistoryClick={onHistoryClick}
                isMobile={true}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />
            
            <div className="flex-1 flex flex-col relative min-w-0">
                <Header 
                    mode={mode} 
                    setMode={setMode} 
                    onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
                />
                <main className="flex-1 relative overflow-hidden flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    );
}
