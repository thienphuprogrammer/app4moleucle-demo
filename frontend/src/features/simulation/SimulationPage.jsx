import React, { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import axios from 'axios';
import { 
  Dna, Play, Activity, CheckCircle, Microscope 
} from "lucide-react";
import * as $3Dmol from '3dmol/build/3Dmol.js';
import { getApiUrl } from '@/lib/utils';
import { motion } from "framer-motion";

const TARGETS = [
    { id: "covid_protease", name: "SARS-CoV-2 Main Protease", description: "Viral replication target" },
    { id: "hiv_protease", name: "HIV-1 Protease", description: "Retroviral enzyme" },
    { id: "breast_cancer", name: "Estrogen Receptor Alpha", description: "Cancer therapy target" }
];

export default function SimulationPage() {
  const [history, setHistory] = useState([]);
  const [selectedLigand, setSelectedLigand] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Viewer
  const viewerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
      fetchHistory();
  }, []);

  const fetchHistory = async () => {
      try {
          const res = await axios.get(getApiUrl("/api/experiments/"));
          const histRes = await axios.get(getApiUrl("/api/molecules/history"));
          setHistory(histRes.data);
      } catch(e) {}
  }

  const runSimulation = async () => {
      if(!selectedLigand || !selectedTarget) return;
      setLoading(true);
      setResult(null);
      
      // Ensure container is ready for new render
      if(viewerRef.current) viewerRef.current.clear();

      try {
          const res = await axios.post(getApiUrl("/api/simulation/docking/run"), {
              ligand_smiles: selectedLigand.results[0].smiles,
              target_id: selectedTarget.id
          });
          setResult(res.data);
          
          // Delay render slightly to ensure DOM is ready if result state triggers layout change
          setTimeout(() => renderResult(res.data), 100);
          toast.success("Simulation complete");
      } catch(e) {
          toast.error("Simulation failed");
      } finally {
          setLoading(false);
      }
  }

  const renderResult = (data) => {
      if(!containerRef.current) {
          console.error("Container ref not found");
          return;
      }
      
      // Always create a new viewer to avoid state issues or clear existing
      let viewer = viewerRef.current;
      if (!viewer) {
          viewer = $3Dmol.createViewer(containerRef.current, { backgroundColor: 'white' });
          viewerRef.current = viewer;
      }
      viewer.clear();
      
      // Add Target (Cartoon)
      if(data.target_pdb) {
          viewer.addModel(data.target_pdb, "pdb");
          viewer.setStyle({model: 0}, {cartoon: {color: 'spectrum', opacity: 0.8}});
      } else {
          console.warn("No target PDB data");
      }
      
      // Add Ligand (Stick)
      if(data.ligand_pdb) {
          viewer.addModel(data.ligand_pdb, "pdb");
          viewer.setStyle({model: 1}, {stick: {colorscheme: 'greenCarbon', radius: 0.2}});
      } else {
          console.warn("No ligand PDB data");
      }
      
      viewer.zoomTo();
      viewer.render();
  }

  return (
    <MainLayout>
        <div className="flex h-full flex-col md:flex-row overflow-hidden bg-background">
            {/* Left Panel: Setup */}
            <div className="w-full md:w-96 border-r border-border bg-card/30 flex flex-col p-6 overflow-y-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                        <Microscope className="w-6 h-6 text-primary" />
                        Simulation Lab
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Molecular Docking & Interaction Analysis
                    </p>
                </div>

                {/* Step 1: Ligand */}
                <div className="mb-8 space-y-3">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">1</div>
                        Select Ligand
                    </div>
                    
                    {selectedLigand ? (
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex justify-between items-center">
                            <div>
                                <div className="font-bold text-sm text-primary">{selectedLigand.prompt}</div>
                                <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{selectedLigand.results[0].smiles}</div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLigand(null)}>Change</Button>
                        </div>
                    ) : (
                        <div className="h-40 overflow-y-auto border border-border/50 rounded-xl bg-background">
                            {history.map(item => (
                                <div key={item.id} 
                                     onClick={() => setSelectedLigand(item)}
                                     className="p-3 border-b border-border/50 hover:bg-muted/50 cursor-pointer text-sm"
                                >
                                    <div className="font-medium truncate">{item.prompt}</div>
                                    <div className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Step 2: Target */}
                <div className="mb-8 space-y-3">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">2</div>
                        Select Target
                    </div>
                    
                    <div className="space-y-2">
                        {TARGETS.map(t => (
                            <div key={t.id} 
                                 onClick={() => setSelectedTarget(t)}
                                 className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedTarget?.id === t.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'}`}
                            >
                                <div className="font-bold text-sm">{t.name}</div>
                                <div className={`text-[10px] ${selectedTarget?.id === t.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{t.description}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 3: Action */}
                <Button 
                    size="lg" 
                    className="w-full font-bold shadow-lg"
                    disabled={!selectedLigand || !selectedTarget || loading}
                    onClick={runSimulation}
                >
                    {loading ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                    {loading ? "Running Vina..." : "Start Simulation"}
                </Button>
            </div>

            {/* Right Panel: Visualization */}
            <div className="flex-1 bg-muted/10 relative p-0 overflow-hidden">
                <div className="w-full h-full relative">
                    <div ref={containerRef} className="w-full h-full bg-white relative z-0" />
                    
                    {!result && !loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none z-10">
                            <div className="w-32 h-32 bg-card rounded-full border-4 border-muted flex items-center justify-center mb-6 animate-pulse">
                                <Dna className="w-12 h-12 opacity-20" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-2">Ready for Analysis</h2>
                            <p className="max-w-md text-sm">Select a ligand and a protein target to begin the molecular docking simulation.</p>
                        </div>
                    )}

                    {/* Results Overlay */}
                    {result && (
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-background/90 backdrop-blur-xl p-6 rounded-2xl border border-border shadow-2xl z-20"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg">Docking Results</h3>
                                <div className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-bold border border-green-500/20 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> SUCCESS
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">Binding Affinity</div>
                                    <div className="text-3xl font-mono font-bold text-primary">{result.affinity} <span className="text-sm font-sans font-normal text-muted-foreground">kcal/mol</span></div>
                                </div>
                                
                                <div className="space-y-2 pt-4 border-t border-border/50">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Van der Waals</span>
                                        <span className="font-mono">{result.score_breakdown.van_der_waals}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Electrostatic</span>
                                        <span className="font-mono">{result.score_breakdown.electrostatic}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    </MainLayout>
  );
}
