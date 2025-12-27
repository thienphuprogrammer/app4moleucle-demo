"use client";

import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Atom, History, ChevronLeft, ChevronRight, 
  FlaskConical, LayoutGrid, FileText, BookOpen, X, Microscope 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from 'next/navigation';

export function Sidebar({ className, history, onHistoryClick, isCollapsed, toggleCollapse, isMobile, isOpen, onClose }) {
  const router = useRouter();
  const pathname = usePathname();
  const activePath = pathname;

  // Mobile Drawer Wrapper
  if (isMobile) {
      return (
          <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    />
                    {/* Drawer */}
                    <motion.aside 
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={cn(
                            "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-2xl flex flex-col",
                            className
                        )}
                    >
                         <SidebarContent 
                            history={history} 
                            onHistoryClick={(r) => { if(onHistoryClick) onHistoryClick(r); onClose(); }} 
                            activePath={activePath}
                            router={router}
                            isCollapsed={false}
                            isMobile={true}
                            onClose={onClose}
                         />
                    </motion.aside>
                </>
            )}
          </AnimatePresence>
      );
  }

  // Desktop Sidebar
  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 72 : 280 }}
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card/50 backdrop-blur-xl z-20 h-full shadow-sm relative",
        className
      )}
    >
        <SidebarContent 
            history={history} 
            onHistoryClick={onHistoryClick} 
            activePath={activePath}
            router={router}
            isCollapsed={isCollapsed}
            toggleCollapse={toggleCollapse}
        />
    </motion.aside>
  );
}

// Extracted Content to reuse for both Mobile and Desktop
function SidebarContent({ history, onHistoryClick, activePath, router, isCollapsed, toggleCollapse, isMobile, onClose }) {
    return (
        <>
            {/* Brand Header */}
            <div className={cn("h-16 flex items-center border-b border-border/50", isCollapsed ? "justify-center" : "px-6 justify-between")}>
                <div className="flex items-center gap-3 text-primary cursor-pointer" onClick={() => router.push('/')}>
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse" />
                    <Atom className="w-8 h-8 relative z-10" />
                </div>
                
                <AnimatePresence>
                    {!isCollapsed && (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex flex-col overflow-hidden whitespace-nowrap"
                    >
                        <span className="font-bold tracking-tight font-display text-xl leading-none bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            CHEM.AI
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] mt-0.5">
                            Research Lab
                        </span>
                    </motion.div>
                    )}
                </AnimatePresence>
                </div>

                {isMobile && (
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5 text-muted-foreground" />
                    </Button>
                )}
            </div>
            
            {/* Navigation */}
            <div className="py-6 px-3 space-y-1">
                <NavItem 
                    icon={<LayoutGrid className="w-5 h-5"/>} 
                    label="Dashboard" 
                    active={activePath === "/"} 
                    collapsed={isCollapsed} 
                    onClick={() => router.push('/')}
                />
                <NavItem 
                    icon={<FlaskConical className="w-5 h-5"/>} 
                    label="Experiments" 
                    active={activePath?.startsWith("/experiments")} 
                    collapsed={isCollapsed} 
                    onClick={() => router.push('/experiments')}
                />
                <NavItem 
                    icon={<Microscope className="w-5 h-5"/>} 
                    label="Simulation Lab" 
                    active={activePath === "/simulation"} 
                    collapsed={isCollapsed} 
                    onClick={() => router.push('/simulation')}
                />
                <NavItem 
                    icon={<BookOpen className="w-5 h-5"/>} 
                    label="Knowledge Base" 
                    active={activePath === "/knowledge"} 
                    collapsed={isCollapsed} 
                    onClick={() => router.push('/knowledge')}
                />
            </div>

            <div className="mx-6 my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* History Section - Only show on Dashboard for now, or adapt */}
            {activePath === "/" && history && (
                <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
                    {!isCollapsed && (
                        <div className="px-3 flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-bold mb-4">
                            <History className="w-3.5 h-3.5" /> Recent Synthesis
                        </div>
                    )}
                    
                    <div className="space-y-1">
                    {history.map((record, i) => (
                        <motion.div 
                        key={record.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => onHistoryClick && onHistoryClick(record)}
                        className={cn(
                            "group rounded-xl border border-transparent hover:bg-accent/50 hover:border-border/50 transition-all cursor-pointer relative overflow-hidden",
                            isCollapsed ? "p-3 flex justify-center" : "p-3"
                        )}
                        title={record.prompt}
                        >
                            {isCollapsed ? (
                                <div className="w-2.5 h-2.5 rounded-full bg-primary/50 group-hover:bg-primary ring-2 ring-transparent group-hover:ring-primary/20 transition-all" />
                            ) : (
                            <>
                                <div className="text-sm font-medium text-foreground/90 truncate mb-1.5 group-hover:text-primary transition-colors">
                                {record.prompt}
                                </div>
                                <div className="flex gap-1.5">
                                    {record.results.map((r, i) => (
                                        <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium border border-primary/10">
                                            {r.model_name.replace('model_', 'M-').toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            </>
                            )}
                        </motion.div>
                    ))}
                    </div>
                </div>
            )}

            {/* Footer / Collapse Toggle (Desktop Only) */}
            {!isMobile && (
                <div className={cn("p-4 border-t border-border/50", activePath !== "/" && "mt-auto")}>
                    <Button 
                        variant="ghost" 
                        className={cn(
                        "w-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all", 
                        isCollapsed ? "px-0 justify-center h-10 w-10 mx-auto" : "justify-between px-4"
                        )}
                        onClick={toggleCollapse}
                    >
                        {!isCollapsed && <span className="text-sm font-medium">Collapse Sidebar</span>}
                        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-4 h-4" />}
                    </Button>
                </div>
            )}
        </>
    )
}

function NavItem({ icon, label, active, collapsed, onClick }) {
    return (
        <div 
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group relative overflow-hidden",
                active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                collapsed && "justify-center px-2 py-3"
            )}
        >
            {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
            
            <span className={cn("relative z-10 transition-transform group-hover:scale-110 duration-200", active && "scale-110")}>
              {icon}
            </span>
            
            {!collapsed && (
              <span className="text-sm relative z-10">{label}</span>
            )}
        </div>
    )
}
