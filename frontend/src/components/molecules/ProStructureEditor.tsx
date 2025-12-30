'use client';

import React, { useRef, useCallback } from 'react';
import { JSMEEditor, type JSMEEditorRef } from './JSMEEditor';
import { Molecule3DViewer } from './Molecule3DViewer';
import { Button } from '@/components/ui/button';
import { 
  Undo2, Redo2, Copy, Trash2, 
  Beaker, Command, Box, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProStructureEditorProps {
  activeSmiles: string;
  setActiveSmiles: (smiles: string) => void;
  className?: string;
}

export function ProStructureEditor({ activeSmiles, setActiveSmiles, className }: ProStructureEditorProps) {
  const editorRef = useRef<JSMEEditorRef>(null);

  const handleCopy = useCallback(() => {
    if (activeSmiles) {
      navigator.clipboard.writeText(activeSmiles);
      toast.success('SMILES copied to clipboard');
    } else {
      toast.error('No structure to copy');
    }
  }, [activeSmiles]);

  const handleClear = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.reset();
      setActiveSmiles('');
      toast.info('Canvas cleared');
    }
  }, [setActiveSmiles]);

  const handleUndo = useCallback(() => {
    editorRef.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    editorRef.current?.redo();
  }, []);

  const handleSmilesChange = useCallback((smiles: string) => {
    setActiveSmiles(smiles);
  }, [setActiveSmiles]);

  return (
    <div className={cn('flex flex-col lg:flex-row h-full gap-4', className)}>
      {/* JSME Editor Panel */}
      <div className="flex-1 flex flex-col bg-card rounded-xl shadow-lg overflow-hidden border border-border/50 min-h-[400px]">
        {/* Toolbar */}
        <div className="h-14 border-b border-border bg-background/50 flex justify-between items-center px-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
              <Beaker className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground tracking-wide block">2D DESIGNER</span>
              <span className="text-[10px] text-muted-foreground">Molecular Blueprint</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border border-border/50 shadow-inner">
            <ToolbarButton icon={<Undo2 className="w-4 h-4" />} label="Undo" onClick={handleUndo} />
            <ToolbarButton icon={<Redo2 className="w-4 h-4" />} label="Redo" onClick={handleRedo} />
            <div className="w-px h-4 bg-border mx-1" />
            <ToolbarButton 
              icon={<Trash2 className="w-4 h-4" />} 
              label="Reset" 
              onClick={handleClear} 
              hoverColor="hover:text-destructive hover:bg-destructive/10" 
            />
          </div>

          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy} 
              className="h-8 px-3 text-xs font-bold shadow-sm hover:border-primary/50"
              disabled={!activeSmiles}
            >
              <Copy className="w-3.5 h-3.5 mr-2" /> COPY
            </Button>
          </div>
        </div>
        
        {/* Editor Canvas */}
        <div className="flex-1 relative bg-white overflow-hidden group min-h-[300px]">
          {/* Dot Pattern Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-50" />
          
          <div className="absolute inset-0">
            <JSMEEditor 
              ref={editorRef}
              onChange={handleSmilesChange}
              initialSmiles={activeSmiles}
            />
          </div>
        </div>

        {/* Status Footer */}
        <div className="h-10 bg-muted/30 border-t border-border flex items-center px-4 justify-between text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-background border border-border/50">
            <div className={cn(
              'w-1.5 h-1.5 rounded-full',
              activeSmiles ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
            )} />
            <span className="font-semibold text-foreground">
              {activeSmiles ? 'READY' : 'DRAW STRUCTURE'}
            </span>
          </div>
          <div className="flex items-center gap-2 max-w-[250px] opacity-70">
            <Command className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{activeSmiles || 'NO STRUCTURE'}</span>
          </div>
        </div>
      </div>

      {/* 3D Viewer Panel */}
      <div className="flex-1 flex flex-col bg-card rounded-xl shadow-lg overflow-hidden border border-border/50 min-h-[400px]">
        {/* 3D Viewer Header */}
        <div className="h-14 border-b border-border bg-background/50 flex justify-between items-center px-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-sm">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground tracking-wide block">3D PREVIEW</span>
              <span className="text-[10px] text-muted-foreground">Real-time Visualization</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-border/50">
              <RotateCcw className="w-3 h-3 inline mr-1" />
              Drag to rotate
            </div>
          </div>
        </div>

        {/* 3D Viewer Canvas */}
        <div className="flex-1 relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-[300px]">
          {activeSmiles ? (
            <Molecule3DViewer smiles={activeSmiles} className="w-full h-full" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 border border-border/50">
                <Box className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium">Draw a molecule to see 3D preview</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Use the 2D editor on the left</p>
            </div>
          )}
        </div>

        {/* 3D Viewer Footer */}
        <div className="h-10 bg-muted/30 border-t border-border flex items-center px-4 justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Powered by</span>
            <span className="font-bold text-blue-500">3Dmol.js</span>
          </div>
          {activeSmiles && (
            <div className="text-muted-foreground font-mono truncate max-w-[200px]">
              {activeSmiles}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ 
  icon, 
  label, 
  onClick, 
  hoverColor 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void; 
  hoverColor?: string;
}) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={onClick} 
      className={cn(
        'w-8 h-8 rounded-lg text-muted-foreground transition-all',
        hoverColor || 'hover:text-foreground hover:bg-background hover:shadow-sm'
      )}
      title={label}
    >
      {icon}
    </Button>
  );
}
