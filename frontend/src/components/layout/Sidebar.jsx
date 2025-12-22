import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Atom, History, ChevronLeft, ChevronRight, Settings, FlaskConical, LayoutGrid, FileText } from "lucide-react";

export function Sidebar({ className, history, onHistoryClick, isCollapsed, toggleCollapse }) {
  return (
    <aside 
      className={cn(
        "flex flex-col border-r border-border bg-card/80 backdrop-blur-xl z-20 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Brand Header */}
      <div className={cn("h-16 flex items-center border-b border-border", isCollapsed ? "justify-center" : "px-6")}>
        <div className="flex items-center gap-2 text-primary">
           <Atom className="w-6 h-6 animate-spin-slow" />
           {!isCollapsed && (
             <div className="flex flex-col animate-in fade-in duration-300">
                <span className="font-bold tracking-wider font-display text-lg leading-none">CHEM.AI</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Synthesis Platform</span>
             </div>
           )}
        </div>
      </div>
      
      {/* Navigation (Mock) */}
      <div className="py-4 px-2 space-y-1">
          <NavItem icon={<LayoutGrid className="w-4 h-4"/>} label="Dashboard" active={true} collapsed={isCollapsed} />
          <NavItem icon={<FlaskConical className="w-4 h-4"/>} label="Experiments" collapsed={isCollapsed} />
          <NavItem icon={<FileText className="w-4 h-4"/>} label="Reports" collapsed={isCollapsed} />
      </div>

      <div className="h-px bg-border mx-4 my-2" />

      {/* History Section */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
         {!isCollapsed && (
            <div className="px-2 flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-2">
                <History className="w-3 h-3" /> Recent Activity
            </div>
         )}
         
         {history.map((record) => (
           <div 
             key={record.id} 
             onClick={() => onHistoryClick(record)}
             className={cn(
               "group rounded-md border border-transparent hover:bg-muted/50 hover:border-border transition-all cursor-pointer",
               isCollapsed ? "p-2 flex justify-center" : "p-3"
             )}
             title={record.prompt}
           >
              {isCollapsed ? (
                  <div className="w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary" />
              ) : (
                <>
                  <div className="text-sm font-medium truncate mb-1">{record.prompt}</div>
                  <div className="flex gap-1">
                      {record.results.map((r, i) => (
                          <span key={i} className="text-[9px] px-1.5 rounded-sm bg-primary/10 text-primary border border-primary/20">
                              {r.model_name.replace('model_', 'M-')}
                          </span>
                      ))}
                  </div>
                </>
              )}
           </div>
         ))}
      </div>

      {/* Footer / Collapse Toggle */}
      <div className="p-2 border-t border-border flex flex-col gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-center text-muted-foreground hover:text-foreground"
            onClick={toggleCollapse}
          >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <div className="flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> <span className="text-xs">Collapse</span></div>}
          </Button>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, collapsed }) {
    return (
        <div className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer",
            active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-2"
        )}>
            {icon}
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
        </div>
    )
}
