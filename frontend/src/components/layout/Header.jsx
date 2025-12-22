import React from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRightLeft, Sun, Moon, Share2, Download, Bell } from "lucide-react";
import { useTheme } from "next-themes";

export function Header({ mode, setMode }) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 transition-colors duration-300">
       <div className="flex items-center gap-6">
          <Tabs value={mode} onValueChange={setMode} className="w-[240px]">
            <TabsList className="bg-muted border border-border h-9">
              <TabsTrigger value="generate" className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">GENERATOR</TabsTrigger>
              <TabsTrigger value="edit" className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">EDITOR</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {mode === 'edit' && (
              <span className="hidden md:flex items-center gap-2 text-xs font-mono text-primary animate-pulse">
                  <ArrowRightLeft className="w-3.5 h-3.5"/> 
                  SYNC ACTIVE
              </span>
          )}
       </div>

       <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-9 h-9 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-foreground">
              <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-foreground">
              <Share2 className="w-4 h-4" />
          </Button>
          
          <div className="ml-2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-xs shadow-lg">
             E1
          </div>
       </div>
    </header>
  );
}
