'use client';

import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from 'react';

declare global {
  interface Window {
    JSApplet?: any;
    jsmeOnLoad?: () => void;
  }
}

interface JSMEEditorProps {
  onChange?: (smiles: string) => void;
  initialSmiles?: string;
  width?: string | number;
  height?: string | number;
}

export interface JSMEEditorRef {
  reset: () => void;
  undo: () => void;
  redo: () => void;
  getSmiles: () => string;
  setSmiles: (smiles: string) => void;
}

export const JSMEEditor = forwardRef<JSMEEditorRef, JSMEEditorProps>(
  ({ onChange, initialSmiles, width = '100%', height = '100%' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const jsmeRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const lastSmilesRef = useRef<string>('');

    // Load JSME script
    useEffect(() => {
      if (typeof window === 'undefined') return;

      const loadJSME = () => {
        if (window.JSApplet) {
          setIsLoaded(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://jsme-editor.github.io/dist/jsme/jsme.nocache.js';
        script.async = true;
        
        window.jsmeOnLoad = () => {
          setIsLoaded(true);
        };

        script.onload = () => {
          // JSME loads asynchronously after script loads
          const checkJSME = setInterval(() => {
            if (window.JSApplet) {
              clearInterval(checkJSME);
              setIsLoaded(true);
            }
          }, 100);

          // Timeout after 10 seconds
          setTimeout(() => clearInterval(checkJSME), 10000);
        };

        document.body.appendChild(script);
      };

      loadJSME();
    }, []);

    // Initialize JSME applet
    useEffect(() => {
      if (!isLoaded || !containerRef.current || !window.JSApplet) return;
      if (jsmeRef.current) return; // Already initialized

      try {
        const containerId = `jsme-container-${Date.now()}`;
        containerRef.current.id = containerId;

        jsmeRef.current = new window.JSApplet.JSME(containerId, '100%', '100%', {
          options: 'query,hydrogens,paste,border,removehs,zoom',
        });

        // Set initial SMILES if provided
        if (initialSmiles && jsmeRef.current) {
          setTimeout(() => {
            try {
              jsmeRef.current.readMolecule(initialSmiles);
              lastSmilesRef.current = initialSmiles;
            } catch (e) {
              console.error('Error setting initial SMILES:', e);
            }
          }, 500);
        }

        // Set up change callback
        jsmeRef.current.setCallBack('AfterStructureModified', (jsmeEvent: any) => {
          try {
            const smiles = jsmeRef.current.smiles();
            if (smiles !== lastSmilesRef.current) {
              lastSmilesRef.current = smiles;
              onChange?.(smiles);
            }
          } catch (e) {
            console.error('Error getting SMILES:', e);
          }
        });

        setIsReady(true);
      } catch (e) {
        console.error('Error initializing JSME:', e);
      }
    }, [isLoaded, initialSmiles, onChange]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (jsmeRef.current) {
          jsmeRef.current.reset();
          lastSmilesRef.current = '';
          onChange?.('');
        }
      },
      undo: () => {
        if (jsmeRef.current?.undo) {
          jsmeRef.current.undo();
        }
      },
      redo: () => {
        if (jsmeRef.current?.redo) {
          jsmeRef.current.redo();
        }
      },
      getSmiles: () => {
        return jsmeRef.current?.smiles() || '';
      },
      setSmiles: (smiles: string) => {
        if (jsmeRef.current) {
          jsmeRef.current.readMolecule(smiles);
          lastSmilesRef.current = smiles;
        }
      },
    }), [onChange]);

    return (
      <div className="relative w-full h-full">
        <div
          ref={containerRef}
          style={{ width, height, minHeight: '300px' }}
          className="jsme-editor-container"
        />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground font-medium">Loading JSME Editor...</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

JSMEEditor.displayName = 'JSMEEditor';
