import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import axios from 'axios';
import { 
  FlaskConical, Plus, ChevronLeft, Layers, CheckSquare, Square 
} from "lucide-react";
import { useParams, useNavigate } from 'react-router-dom';
import Molecule3DViewer from '@/components/Molecule3DViewer';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

const API = process.env.REACT_APP_BACKEND_URL + "/api/experiments";

export default function ExperimentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [experiment, setExperiment] = useState(null);
  const [runs, setRuns] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Overlay State
  const [selectedRunIds, setSelectedRunIds] = useState([]); 
  const [activeSmiles, setActiveSmiles] = useState(null);
  const [overlaySmiles, setOverlaySmiles] = useState(null);

  const fetchDetail = async () => {
      try {
          const [expRes, runsRes] = await Promise.all([
              axios.get(`${API}/${id}`),
              axios.get(`${API}/${id}/runs`)
          ]);
          setExperiment(expRes.data);
          setRuns(runsRes.data);
          
          if(runsRes.data.length > 0) {
              setActiveSmiles(runsRes.data[0].results[0].smiles); // Default to latest
          }
      } catch(e) {
          toast.error("Failed to load experiment");
      }
  }

  const handleGenerate = async () => {
      if(!prompt) return;
      setLoading(true);
      try {
          await axios.post(`${API}/${id}/generate`, { prompt, models: ["model_a"] });
          setPrompt("");
          toast.success("Generation complete");
          fetchDetail(); // Refresh list
      } catch(e) {
          toast.error("Failed to generate");
      } finally {
          setLoading(false);
      }
  }

  const toggleSelection = (runId, smiles) => {
      let newSelected = [...selectedRunIds];
      if(newSelected.includes(runId)) {
          newSelected = newSelected.filter(i => i !== runId);
          if (activeSmiles === smiles) setActiveSmiles(null);
          if (overlaySmiles === smiles) setOverlaySmiles(null);
      } else {
          if(newSelected.length >= 2) {
              // Replace oldest selection? Or just block?
              // Let's replace the overlay (second item)
              newSelected.pop(); 
          }
          newSelected.push(runId);
      }
      
      setSelectedRunIds(newSelected);
      
      // Logic for viewer
      // If 1 item selected -> Main
      // If 2 items selected -> Main + Overlay
      const selectedRuns = runs.filter(r => newSelected.includes(r.id));
      if (selectedRuns.length > 0) setActiveSmiles(selectedRuns[0].results[0].smiles);
      if (selectedRuns.length > 1) setOverlaySmiles(selectedRuns[1].results[0].smiles);
      else setOverlaySmiles(null);
  }

  useEffect(() => {
      fetchDetail();
  }, [id]);

  if(!experiment) return <div className="p-8">Loading...</div>

  return (
    <MainLayout>
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="h-16 border-b border-border bg-background/50 flex items-center px-6 gap-4 sticky top-0 z-10 backdrop-blur">
                <Button variant="ghost" size="icon" onClick={() => navigate('/experiments')}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-lg font-bold flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-primary" />
                        {experiment.name}
                    </h1>
                    <p className="text-xs text-muted-foreground">Experiment ID: {experiment.id.substring(0,8)}...</p>
                </div>
                
                <div className="ml-auto flex items-center gap-2">
                    {selectedRunIds.length === 2 && (
                        <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold flex items-center gap-2 animate-in fade-in">
                            <Layers className="w-3 h-3" /> OVERLAY MODE ACTIVE
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Runs List */}
                <div className="w-80 border-r border-border bg-card/30 flex flex-col">
                    <div className="p-4 border-b border-border/50 bg-muted/20">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Generation Runs</h3>
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-sm"
                                placeholder="New Prompt..."
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                            />
                            <Button size="sm" onClick={handleGenerate} disabled={loading}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {runs.map(run => {
                            const isSelected = selectedRunIds.includes(run.id);
                            return (
                                <div 
                                    key={run.id}
                                    className={cn(
                                        "p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50",
                                        isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-transparent"
                                    )}
                                    onClick={() => toggleSelection(run.id, run.results[0].smiles)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-bold text-foreground line-clamp-1">{run.prompt}</span>
                                        {isSelected ? <CheckSquare className="w-3 h-3 text-primary" /> : <Square className="w-3 h-3 text-muted-foreground" />}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground flex justify-between">
                                        <span>{format(new Date(run.created_at), 'HH:mm:ss')}</span>
                                        <span className="font-mono">{run.results[0].model_name}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Main: Viewer */}
                <div className="flex-1 bg-muted/10 relative p-6">
                    <div className="w-full h-full bg-card rounded-2xl border-2 border-border/50 shadow-xl overflow-hidden relative">
                        <Molecule3DViewer 
                            smiles={activeSmiles} 
                            overlaySmiles={overlaySmiles}
                            className="w-full h-full" 
                        />
                        
                        {/* Legend */}
                        <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur p-3 rounded-lg border border-border text-xs space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-400" />
                                <span>Main Structure (CPK)</span>
                            </div>
                            {overlaySmiles && (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#00FFFF] opacity-70" />
                                    <span>Overlay (Cyan)</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </MainLayout>
  );
}
