import React, { useEffect, useRef } from 'react';
import * as $3Dmol from '3dmol/build/3Dmol.js';
import axios from 'axios';

const Molecule3DViewer = ({ smiles, className }) => {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize viewer
    // Use 'white' or transparent background to let CSS handle theming
    const viewer = $3Dmol.createViewer(containerRef.current, {
      backgroundColor: 'rgba(0,0,0,0)', 
    });
    viewerRef.current = viewer;

    // Load molecule data
    if (smiles) {
        const fetchAndLoad = async () => {
             try {
                // Use our own backend proxy/generator instead of external Cactus API
                // This avoids CORS and improves reliability
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/molecules/3d`, {
                    params: { smiles }
                });
                
                if(response.data && response.data.sdf) {
                    const sdf = response.data.sdf;
                    viewer.addModel(sdf, "sdf");
                    viewer.setStyle({}, { stick: { radius: 0.15, colorscheme: "Jmol" }, sphere: { scale: 0.25 } });
                    viewer.zoomTo();
                    viewer.render();
                } else {
                    console.error("Failed to generate 3D structure");
                }
             } catch(e) {
                 console.error("3D Generation Error:", e);
                 // Fallback: Try to render 2D-to-3D via 3Dmol's internal heuristics if SDF fetch fails
                 // (Though 3Dmol usually needs coords)
             }
        }
        fetchAndLoad();
    }

    return () => {
       // cleanup if needed
    };
  }, [smiles]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full min-h-[300px] bg-transparent ${className}`}
    >
    </div>
  );
};

export default Molecule3DViewer;
