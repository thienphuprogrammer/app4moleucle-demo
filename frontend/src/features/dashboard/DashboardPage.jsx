import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import Molecule3DViewer from '@/components/Molecule3DViewer';
import JSMEEditor from '@/components/JSMEEditor';
import axios from 'axios';
import { 
  Loader2, Atom, FlaskConical, Copy, Eraser, 
  Sparkles, CheckCircle2 
} from "lucide-react";

const DASHBOARD_API = process.env.REACT_APP_BACKEND_URL + "/api/molecules";

export default function DashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState(["model_a"]);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeSmiles, setActiveSmiles] = useState(null); 
  const [mode, setMode] = useState("generate"); // generate | edit

  // API Methods
  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await axios.post(`${DASHBOARD_API}/generate`, {
        prompt,
        models: selectedModels
      });
      setResults(res.data.results);
      if (res.data.results.length > 0) {
        setActiveSmiles(res.data.results[0].smiles);
        toast.success("Molecule generated successfully");
      }
      fetchHistory();
    } catch (e) {
      toast.error("Generation failed");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
        const res = await axios.get(`${DASHBOARD_API}/history`);
        setHistory(res.data);
    } catch(e) {
        console.error("Failed to fetch history");
    }
  }

  const copySmiles = () => {
      if(activeSmiles) {
          navigator.clipboard.writeText(activeSmiles);
          toast.success("SMILES copied to clipboard");
      }
  }

  const clearEditor = () => {
      setActiveSmiles("");
      toast.info("Editor cleared");
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <MainLayout 
        history={history} 
        onHistoryClick={(record) => {
            setResults(record.results);
            if(record.results.length > 0) setActiveSmiles(record.results[0].smiles);
            setPrompt(record.prompt);
        }}
        mode={mode}
        setMode={setMode}
    >
        <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row h-full">
            
            {/* Left Panel */}
            <div className={`
                transition-all duration-500 ease-in-out border-r border-border bg-card z-10 overflow-y-auto flex flex-col
                ${mode === 'edit' ? 'w-full md:w-1/2 p-0' : 'w-full md:w-[400px] p-0'}
            `}>
                
                {/* GENERATOR MODE */}
                {mode === 'generate' && (
                    <div className="flex flex-col h-full animate-in slide-in-from-left duration-300">
                        <div className="p-6 border-b border-border bg-muted/20">
                            <h2 className="text-lg font-semibold mb-1">New Synthesis</h2>
                            <p className="text-sm text-muted-foreground">Describe your molecule properties below.</p>
                        </div>
                        
                        <div className="p-6 space-y-6 flex-1">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Prompt</label>
                                <textarea 
                                    className="w-full bg-muted/50 border border-input focus:border-primary text-foreground p-4 min-h-[140px] rounded-lg resize-none text-base placeholder:text-muted-foreground/70 focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
                                    placeholder="e.g. A small organic molecule with an aromatic ring..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">AI Models</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {["model_a", "model_b", "model_c"].map(m => (
                                        <div key={m} 
                                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedModels.includes(m) ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card border-border hover:border-primary/50'}`}
                                            onClick={() => {
                                                if(selectedModels.includes(m)) setSelectedModels(prev => prev.filter(x => x !== m));
                                                else setSelectedModels(prev => [...prev, m]);
                                            }}
                                        >
                                            <div className={`w-4 h-4 rounded-full mr-3 border flex items-center justify-center transition-colors ${selectedModels.includes(m) ? 'bg-primary border-primary' : 'bg-transparent border-muted-foreground'}`}>
                                                {selectedModels.includes(m) && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                                            </div>
                                            <div>
                                                <span className="text-sm font-semibold block">{m.replace('_', ' ').toUpperCase()}</span>
                                                <span className="text-xs text-muted-foreground">Standard Chemical Transformer</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border bg-muted/20">
                            <Button 
                                onClick={handleGenerate} 
                                disabled={loading || !prompt}
                                className="w-full h-12 text-base font-bold uppercase tracking-wide shadow-lg hover:shadow-xl transition-all"
                            >
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                                Generate Structure
                            </Button>
                        </div>
                    </div>
                )}

                {/* EDITOR MODE */}
                {mode === 'edit' && (
                    <div className="flex flex-col h-full animate-in fade-in duration-300">
                        <div className="h-12 border-b border-border bg-muted/30 flex justify-between items-center px-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"/>
                                <span className="text-xs font-bold text-foreground tracking-wide">2D EDITOR</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={copySmiles} className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                    <Copy className="w-3.5 h-3.5 mr-1.5" /> <span className="text-[10px] font-bold">COPY</span>
                                </Button>
                                <Button variant="ghost" size="sm" onClick={clearEditor} className="h-8 px-2 text-muted-foreground hover:text-destructive">
                                    <Eraser className="w-3.5 h-3.5 mr-1.5" /> <span className="text-[10px] font-bold">CLEAR</span>
                                </Button>
                            </div>
                        </div>
                        
                        <div className="flex-1 relative bg-white">
                             <div className="absolute inset-0">
                                <JSMEEditor onChange={(s) => setActiveSmiles(s)} initialSmiles={activeSmiles} />
                             </div>
                        </div>

                        <div className="h-8 bg-card border-t border-border flex items-center px-4 justify-between text-[10px] font-mono text-muted-foreground">
                             <span>JSME ENGINE v2025</span>
                             <span className="truncate max-w-[200px]">{activeSmiles || "EMPTY"}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Visualization */}
            <div className="flex-1 bg-muted/10 relative flex flex-col">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
                
                {mode === 'edit' && (
                   <div className="h-12 border-b border-border bg-card/50 backdrop-blur-sm flex justify-between items-center px-4 z-10">
                       <span className="text-xs font-bold text-primary tracking-wide flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-primary"/>
                           3D PREVIEW
                       </span>
                   </div>
                )}

                {activeSmiles ? (
                   <div className={`w-full h-full ${mode === 'edit' ? '' : 'p-6'} grid grid-cols-1 ${mode === 'generate' && results.length > 1 ? 'md:grid-cols-2 gap-4' : 'grid-cols-1'}`}>
                      {/* Main Viewer */}
                      <div className={`relative h-full flex flex-col gap-2 ${mode === 'generate' && results.length > 1 ? 'md:col-span-1' : 'md:col-span-2'}`}>
                         <div className="flex-1 rounded-xl overflow-hidden border border-border shadow-sm bg-card relative">
                            <Molecule3DViewer smiles={activeSmiles} className="w-full h-full" />
                         </div>
                         
                         {mode === 'generate' && (
                            <div className="flex justify-between items-center px-2 py-2">
                                <span className="font-mono text-xs text-muted-foreground">SMILES: <span className="text-foreground select-all font-medium">{activeSmiles.substring(0, 30)}...</span></span>
                                <div className="flex gap-2">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 font-medium">Valid Structure</span>
                                </div>
                            </div>
                         )}
                      </div>

                      {/* Comparison View */}
                      {mode === 'generate' && results.length > 1 && (
                         <div className="h-full flex flex-col gap-4 overflow-y-auto pr-2 pb-2">
                            {results.filter(r => r.smiles !== activeSmiles).map((res, idx) => (
                               <div key={idx} className="h-1/2 min-h-[200px] relative group cursor-pointer border border-border hover:border-primary/50 bg-card rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md"
                                    onClick={() => setActiveSmiles(res.smiles)}>
                                   <Molecule3DViewer smiles={res.smiles} />
                                   <div className="absolute top-2 left-2 bg-background/80 backdrop-blur px-2 py-1 text-[10px] font-bold text-foreground border border-border rounded shadow-sm">
                                       {res.model_name.toUpperCase()}
                                   </div>
                               </div>
                            ))}
                         </div>
                      )}
                   </div>
               ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                       <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                           <Atom className="w-12 h-12 opacity-50" />
                       </div>
                       <h2 className="text-2xl font-light text-foreground mb-2">Ready to Synthesize</h2>
                       <p className="max-w-md text-sm">Enter a description on the left or switch to the Editor to begin your molecular design journey.</p>
                   </div>
               )}
            </div>
        </div>
    </MainLayout>
  );
}
