import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Molecule3DViewer from '../components/Molecule3DViewer';
import JSMEEditor from '../components/JSMEEditor';
import axios from 'axios';
import { 
  Loader2, Atom, FlaskConical, History, Share2, Download, 
  ArrowRightLeft, Eraser, Copy, Info, maximize, Minimize 
} from "lucide-react";

const DASHBOARD_API = process.env.REACT_APP_BACKEND_URL + "/api/molecules";

const Dashboard = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState(["model_a"]);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeSmiles, setActiveSmiles] = useState(null); 
  const [mode, setMode] = useState("generate"); // generate | edit

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

  React.useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#020408] text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar - History */}
      <aside className="w-64 hidden md:flex flex-col border-r border-slate-800/50 bg-[#05080e]/90 backdrop-blur-xl z-20">
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-2 text-lime-400 mb-1">
             <Atom className="w-5 h-5 animate-spin-slow" />
             <h1 className="font-bold tracking-wider font-display text-lg">VOID LAB</h1>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Molecular Synthesis</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
           <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
              <History className="w-3 h-3" /> Recent Syntheses
           </div>
           {history.map((record) => (
             <div 
               key={record.id} 
               onClick={() => {
                   setResults(record.results);
                   if(record.results.length > 0) setActiveSmiles(record.results[0].smiles);
                   setPrompt(record.prompt);
               }}
               className="group p-3 rounded-lg border border-slate-800/50 bg-slate-900/30 hover:bg-slate-800 hover:border-lime-500/30 transition-all cursor-pointer"
             >
                <div className="text-sm text-slate-300 font-medium truncate mb-1">{record.prompt}</div>
                <div className="flex gap-2">
                    {record.results.map((r, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-lime-900/20 text-lime-400 border border-lime-500/10">
                            {r.model_name}
                        </span>
                    ))}
                </div>
             </div>
           ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full">
        {/* Top Control Bar */}
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-6 bg-[#020408]/80 backdrop-blur-md z-30">
           <div className="flex items-center gap-4">
              <Tabs value={mode} onValueChange={setMode} className="w-[200px]">
                <TabsList className="bg-slate-900 border border-slate-800">
                  <TabsTrigger value="generate" className="data-[state=active]:bg-lime-500 data-[state=active]:text-black font-mono text-xs">GENERATE</TabsTrigger>
                  <TabsTrigger value="edit" className="data-[state=active]:bg-lime-500 data-[state=active]:text-black font-mono text-xs">EDITOR</TabsTrigger>
                </TabsList>
              </Tabs>
              {mode === 'edit' && <span className="text-xs font-mono text-lime-500/80 flex items-center gap-1"><ArrowRightLeft className="w-3 h-3"/> SYNC ACTIVE</span>}
           </div>
           <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white"><Share2 className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white"><Download className="w-4 h-4" /></Button>
              <div className="w-8 h-8 rounded-full bg-lime-500/20 border border-lime-500/50 flex items-center justify-center text-lime-400 font-bold text-xs">E1</div>
           </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Panel: Dynamic Width based on Mode */}
            <div className={`
                transition-all duration-500 ease-in-out border-r border-slate-800/50 bg-[#020408] z-10 overflow-y-auto flex flex-col
                ${mode === 'edit' ? 'w-full md:w-1/2 p-0' : 'w-full md:w-96 p-6'}
            `}>
               
               {mode === 'generate' && (
                 <div className="space-y-6 animate-in slide-in-from-left duration-500">
                    <div>
                        <label className="text-xs text-lime-500 font-mono uppercase tracking-wider mb-2 block">Input Description</label>
                        <textarea 
                           className="w-full bg-slate-900/50 border border-slate-800 focus:border-lime-500/50 text-slate-200 p-4 min-h-[120px] rounded-lg resize-none font-light text-lg placeholder:text-slate-600 focus:ring-1 focus:ring-lime-500/20 transition-all"
                           placeholder="e.g. A small organic molecule with an aromatic ring..."
                           value={prompt}
                           onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>

                    <div>
                       <label className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3 block">Select Models</label>
                       <div className="grid grid-cols-1 gap-2">
                          {["model_a", "model_b", "model_c"].map(m => (
                              <div key={m} className={`flex items-center p-3 rounded border cursor-pointer transition-all ${selectedModels.includes(m) ? 'bg-lime-500/10 border-lime-500/50' : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'}`}
                                   onClick={() => {
                                       if(selectedModels.includes(m)) setSelectedModels(prev => prev.filter(x => x !== m));
                                       else setSelectedModels(prev => [...prev, m]);
                                   }}
                              >
                                  <div className={`w-3 h-3 rounded-full mr-3 ${selectedModels.includes(m) ? 'bg-lime-400 shadow-[0_0_10px_rgba(132,204,22,0.5)]' : 'bg-slate-700'}`} />
                                  <span className="text-sm font-mono uppercase text-slate-300">{m.replace('_', ' ').toUpperCase()}</span>
                              </div>
                          ))}
                       </div>
                    </div>

                    <Button 
                       onClick={handleGenerate} 
                       disabled={loading || !prompt}
                       className="w-full bg-lime-500 hover:bg-lime-400 text-black font-bold h-12 uppercase tracking-widest shadow-[0_0_20px_rgba(132,204,22,0.2)] hover:shadow-[0_0_30px_rgba(132,204,22,0.4)] transition-all"
                    >
                       {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-2 h-4 w-4" />}
                       Initiate Synthesis
                    </Button>
                 </div>
               )}

               {mode === 'edit' && (
                  <div className="h-full flex flex-col bg-slate-950 animate-in fade-in duration-500">
                      {/* Pro Header */}
                      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex justify-between items-center shadow-lg z-10">
                          <div className="flex flex-col">
                             <span className="text-xs text-lime-400 font-mono font-bold tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse"/>
                                MOLECULAR BLUEPRINT
                             </span>
                             <span className="text-[10px] text-slate-500">2D STRUCTURAL EDITOR</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={copySmiles} className="h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-800" title="Copy SMILES">
                                  <Copy className="w-3.5 h-3.5 mr-1" /> <span className="text-[10px] font-mono">COPY</span>
                              </Button>
                              <div className="w-px h-4 bg-slate-800 mx-1"></div>
                              <Button variant="ghost" size="sm" onClick={clearEditor} className="h-7 px-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20" title="Clear Canvas">
                                  <Eraser className="w-3.5 h-3.5 mr-1" /> <span className="text-[10px] font-mono">CLEAR</span>
                              </Button>
                          </div>
                      </div>

                      {/* Editor Container with Tech Borders */}
                      <div className="flex-1 relative p-4 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] bg-slate-900/50">
                          {/* Corner Accents */}
                          <div className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 border-lime-500/50 z-10"></div>
                          <div className="absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 border-lime-500/50 z-10"></div>
                          <div className="absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 border-lime-500/50 z-10"></div>
                          <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-lime-500/50 z-10"></div>

                          <div className="w-full h-full shadow-2xl rounded-sm overflow-hidden border border-slate-700/50 relative">
                             {/* JSME Wrapper */}
                             <div className="absolute inset-0 bg-white">
                                <JSMEEditor onChange={(s) => setActiveSmiles(s)} initialSmiles={activeSmiles} />
                             </div>
                          </div>
                      </div>

                      {/* Footer Stats */}
                      <div className="h-8 border-t border-slate-800 bg-slate-950 flex items-center px-4 justify-between">
                          <div className="flex items-center gap-4">
                              <span className="text-[10px] text-slate-500 font-mono">STATUS: <span className="text-lime-500">EDITING</span></span>
                              <span className="text-[10px] text-slate-500 font-mono">ENGINE: <span className="text-slate-300">JSME 2025</span></span>
                          </div>
                          <span className="text-[10px] text-slate-600 font-mono truncate max-w-[200px]" title={activeSmiles}>
                              {activeSmiles || "NO STRUCTURE"}
                          </span>
                      </div>
                  </div>
               )}

            </div>

            {/* Right Panel: Visualization */}
            <div className="flex-1 bg-[#05080e] relative flex flex-col">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05)_0%,transparent_70%)] pointer-events-none" />
               
               {mode === 'edit' && (
                   <div className="px-6 py-3 border-b border-slate-800/50 bg-slate-900/20 absolute top-0 left-0 right-0 z-10 flex justify-between items-center backdrop-blur-sm">
                       <span className="text-xs text-blue-400 font-mono font-bold tracking-wider flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>
                           3D REAL-TIME VIEWER
                       </span>
                       <span className="text-[10px] text-slate-500 uppercase">3Dmol.js RENDERER</span>
                   </div>
               )}

               {activeSmiles ? (
                   <div className={`w-full h-full ${mode === 'edit' ? 'pt-12' : 'p-6'} grid grid-cols-1 ${mode === 'generate' && results.length > 1 ? 'md:grid-cols-2 gap-4' : 'grid-cols-1'}`}>
                      {/* Main Viewer */}
                      <div className={`relative h-full flex flex-col gap-2 ${mode === 'generate' && results.length > 1 ? 'md:col-span-1' : 'md:col-span-2'}`}>
                         <Molecule3DViewer smiles={activeSmiles} className="flex-1 border-slate-800" />
                         
                         {mode === 'generate' && (
                            <div className="flex justify-between items-center px-2">
                                <span className="font-mono text-xs text-slate-500">SMILES: <span className="text-lime-400 select-all">{activeSmiles.substring(0, 30)}...</span></span>
                                <div className="flex gap-2">
                                    <span className="text-[10px] px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">CONFIDENCE: 98.2%</span>
                                </div>
                            </div>
                         )}
                      </div>

                      {/* Comparison View (Only in Generate mode) */}
                      {mode === 'generate' && results.length > 1 && (
                         <div className="h-full flex flex-col gap-4 overflow-y-auto pr-2">
                            {results.filter(r => r.smiles !== activeSmiles).map((res, idx) => (
                               <div key={idx} className="h-1/2 min-h-[200px] relative group cursor-pointer border border-slate-800 hover:border-lime-500/50 rounded-lg overflow-hidden transition-all"
                                    onClick={() => setActiveSmiles(res.smiles)}>
                                   <Molecule3DViewer smiles={res.smiles} />
                                   <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 text-[10px] text-lime-400 border border-lime-500/30 rounded">
                                       {res.model_name.toUpperCase()}
                                   </div>
                               </div>
                            ))}
                         </div>
                      )}
                   </div>
               ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                       <Atom className="w-24 h-24 mb-6 opacity-20 animate-pulse" />
                       <h2 className="text-2xl font-light tracking-widest text-slate-500">SYSTEM IDLE</h2>
                       <p className="text-sm font-mono mt-2 text-slate-700">AWAITING MOLECULAR INPUT</p>
                   </div>
               )}

            </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
