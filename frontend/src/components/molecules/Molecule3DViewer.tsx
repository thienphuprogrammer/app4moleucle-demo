'use client';

import React, { useEffect, useRef, useState } from 'react';
import { moleculesApi } from '@/lib/api';

interface Molecule3DViewerProps {
  smiles: string;
  className?: string;
  overlaySmiles?: string;
}

export function Molecule3DViewer({ smiles, className, overlaySmiles }: Molecule3DViewerProps) {
  const viewerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [is3DmolLoaded, setIs3DmolLoaded] = useState(false);
  const $3DmolRef = useRef<any>(null);

  // Dynamically load 3Dmol only on client side
  useEffect(() => {
    if (typeof window !== 'undefined' && !$3DmolRef.current) {
      import('3dmol/build/3Dmol.js')
        .then((module) => {
          $3DmolRef.current = module.default || module;
          setIs3DmolLoaded(true);
        })
        .catch((err) => {
          console.error('Failed to load 3Dmol:', err);
        });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || !is3DmolLoaded || !$3DmolRef.current) return;

    const $3Dmol = $3DmolRef.current;

    // Initialize viewer if not already
    if (!viewerRef.current) {
      const viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: 'rgba(0,0,0,0)',
      });
      viewerRef.current = viewer;
    }

    const viewer = viewerRef.current;

    const loadModels = async () => {
      viewer.clear();

      // Load Main Molecule
      if (smiles) {
        try {
          const response = await moleculesApi.get3DStructure(smiles);
          if (response && response.sdf) {
            const model = viewer.addModel(response.sdf, 'sdf');
            model.setStyle({}, { stick: { radius: 0.15, colorscheme: 'Jmol' }, sphere: { scale: 0.25 } });
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Load Overlay Molecule (Comparison)
      if (overlaySmiles) {
        try {
          const response = await moleculesApi.get3DStructure(overlaySmiles);
          if (response && response.sdf) {
            const model = viewer.addModel(response.sdf, 'sdf');
            model.setStyle({}, {
              stick: { radius: 0.15, color: '#00FFFF', opacity: 0.7 },
              sphere: { scale: 0.25, color: '#00FFFF', opacity: 0.7 },
            });
          }
        } catch (e) {
          console.error(e);
        }
      }

      viewer.zoomTo();
      viewer.render();
    };

    loadModels();
  }, [smiles, overlaySmiles, is3DmolLoaded]);

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-[300px] bg-transparent ${className}`}>
      {!is3DmolLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
