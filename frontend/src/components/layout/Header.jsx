"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRightLeft, Sun, Moon, Share2, Bell, Search, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function Header({ mode, setMode, onOpenMobileMenu }) {
  const { theme, setTheme } = useTheme();

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50"
    >
       <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-muted-foreground"
            onClick={onOpenMobileMenu}
          >
             <Menu className="w-6 h-6" />
          </Button>

          {/* Mode Switcher */}
          <div className="bg-muted/50 p-1 rounded-xl border border-border/50">
            <Tabs value={mode} onValueChange={setMode} className="w-[200px] md:w-[280px]">
              <TabsList className="bg-transparent border-0 h-9 md:h-10 gap-1 w-full">
                <TabsTrigger 
                  value="generate" 
                  className="w-1/2 rounded-lg text-xs md:text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:font-bold transition-all text-muted-foreground"
                >
                  GENERATOR
                </TabsTrigger>
                <TabsTrigger 
                  value="edit" 
                  className="w-1/2 rounded-lg text-xs md:text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:font-bold transition-all text-muted-foreground"
                >
                  EDITOR
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {mode === 'edit' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
              >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-primary animate-pulse"/> 
                  <span className="text-xs font-mono font-semibold text-primary">REAL-TIME SYNC</span>
              </motion.div>
          )}
       </div>

       <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-full border border-border/50">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8 md:w-9 md:h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-background"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </Button>

            <Button variant="ghost" size="icon" className="hidden sm:inline-flex w-8 h-8 md:w-9 md:h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-background">
                <Bell className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex w-8 h-8 md:w-9 md:h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-background">
                <Search className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="pl-4 border-l border-border/50 flex items-center gap-3 cursor-pointer group">
             <div className="flex flex-col items-end hidden lg:flex">
                <span className="text-sm font-semibold text-foreground leading-none">Dr. Chemist</span>
                <span className="text-[10px] text-muted-foreground">Premium Plan</span>
             </div>
             <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-primary-foreground font-bold shadow-lg ring-2 ring-background group-hover:scale-105 transition-transform text-xs md:text-sm">
                DC
             </div>
          </div>
       </div>
    </motion.header>
  );
}
