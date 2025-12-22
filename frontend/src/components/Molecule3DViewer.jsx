import React, { useEffect, useRef } from 'react';
import * as $3Dmol from '3dmol/build/3Dmol.js';
import axios from 'axios';

const Molecule3DViewer = ({ smiles, className, overlaySmiles }) => {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize viewer if not already
    // If props change significantly, we might want to reset, but 3Dmol handles updates well.
    if (!viewerRef.current) {
        const viewer = $3Dmol.createViewer(containerRef.current, {
          backgroundColor: 'rgba(0,0,0,0)', 
        });
        viewerRef.current = viewer;
    }
    
    const viewer = viewerRef.current;
    
    const loadModels = async () => {
        viewer.clear(); // Clear scene
        
        // 1. Load Main Molecule
        if (smiles) {
             try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/molecules/3d`, {
                    params: { smiles }
                });
                
                if(response.data && response.data.sdf) {
                    const model = viewer.addModel(response.data.sdf, "sdf");
                    // Main: Standard CPK/Jmol colors
                    model.setStyle({}, { stick: { radius: 0.15, colorscheme: "Jmol" }, sphere: { scale: 0.25 } });
                }
             } catch(e) { console.error(e); }
        }

        // 2. Load Overlay Molecule (Comparison)
        if (overlaySmiles) {
             try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/molecules/3d`, {
                    params: { smiles: overlaySmiles }
                });
                
                if(response.data && response.data.sdf) {
                    const model = viewer.addModel(response.data.sdf, "sdf");
                    // Overlay: Unicolor (e.g., Cyan transparent) to distinguish
                    // Or specific stick style
                    model.setStyle({}, { 
                        stick: { radius: 0.15, color: '#00FFFF', opacity: 0.7 }, 
                        sphere: { scale: 0.25, color: '#00FFFF', opacity: 0.7 } 
                    });
                }
             } catch(e) { console.error(e); }
        }

        viewer.zoomTo();
        viewer.render();
    }

    loadModels();

    return () => {
       // cleanup if needed
    };
  }, [smiles, overlaySmiles]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full min-h-[300px] bg-transparent ${className}`}
    >
    </div>
  );
};

export default Molecule3DViewer;
