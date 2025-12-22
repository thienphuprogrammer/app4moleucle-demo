import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import Molecule3DViewer from '@/components/Molecule3DViewer';
import { ProStructureEditor } from '@/components/ProStructureEditor';
import { useDebounce } from '@/hooks/use-debounce';
import axios from 'axios';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Sparkles, CheckCircle2, ChevronRight, ChevronLeft,
  LayoutList, Box, Maximize2, Quote, Calendar, Edit2, Check, X, RefreshCw, Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const DASHBOARD_API = process.env.REACT_APP_BACKEND_URL + "/api/molecules";

export default function DashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState(["model_a"]);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeSmiles, setActiveSmiles] = useState(null); 
  const [activeModel, setActiveModel] = useState(null); 
  const [activeRecord, setActiveRecord] = useState(null); 
  const [mode, setMode] = useState("generate"); 
  const [isResultListOpen, setIsResultListOpen] = useState(true); 
  
  // Edit Description State
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescValue, setEditDescValue] = useState("");

  const debouncedSmiles = useDebounce(activeSmiles, 800);

  const handleGenerate = async (overridePrompt = null, overrideModels = null) => {
    const finalPrompt = overridePrompt || prompt;
    const finalModels = overrideModels || selectedModels;
    
    if (!finalPrompt) return;
    setLoading(true);
    try {
      const res = await axios.post(`${DASHBOARD_API}/generate`, {
        prompt: finalPrompt,
        models: finalModels
      });
      handleNewResult(res.data, finalPrompt);
    } catch (e) {
      toast.error("Generation failed");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNewResult = (data, usedPrompt) => {
      setResults(data.results);
      if (data.results.length > 0) {
        const first = data.results[0];
        setActiveSmiles(first.smiles);
        setActiveModel(first.model_name);
        
        const newRecord = {
            id: data.id,
            prompt: usedPrompt,
            created_at: new Date().toISOString(),
            results: data.results
        };
        setActiveRecord(newRecord);
        setIsResultListOpen(true);
        toast.success("Molecule generated successfully");
      }
      fetchHistory();
  }

  const handleRegenerate = async (modelsToRun) => {
      if(!activeRecord) return;
      setLoading(true);
      try {
          // Use the specific regenerate endpoint or just call generate again with same prompt
          // Calling generate creates a new record which is what we want for "lưu lại các chất quá khứ"
          const res = await axios.post(`${DASHBOARD_API}/generate`, {
            prompt: activeRecord.prompt,
            models: modelsToRun
          });
          handleNewResult(res.data, activeRecord.prompt);
      } catch(e) {
          toast.error("Regeneration failed");
      } finally {
          setLoading(false);
      }
  }

  const handleSaveDescription = async () => {
      if(!activeRecord) return;
      try {
          await axios.patch(`${DASHBOARD_API}/history/${activeRecord.id}`, {
              prompt: editDescValue
          });
          
          // Update local state
          const updatedRecord = { ...activeRecord, prompt: editDescValue };
          setActiveRecord(updatedRecord);
          setPrompt(editDescValue);
          setIsEditingDesc(false);
          fetchHistory(); // Refresh sidebar
          toast.success("Description updated");
      } catch(e) {
          toast.error("Failed to update description");
      }
  }

  const fetchHistory = async () => {
    try {
        const res = await axios.get(`${DASHBOARD_API}/history`);
        setHistory(res.data);
    } catch(e) {
        console.error("Failed to fetch history");
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <MainLayout 
        history={history} 
        onHistoryClick={(record) => {
            setResults(record.results);
            if(record.results.length > 0) {
                const first = record.results[0];
                setActiveSmiles(first.smiles);
                setActiveModel(first.model_name);
            }
            setActiveRecord(record);
            setPrompt(record.prompt);
            setEditDescValue(record.prompt);
        }}
        mode={mode}
        setMode={setMode}
    >
        <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row h-full">
            
            {/* Left Panel - Input/Editor */}
            <motion.div 
                layout
                className={`
                   transition-all duration-500 ease-in-out border-r border-border bg-card/50 z-10 overflow-y-auto flex flex-col relative
                   ${mode === 'edit' ? 'w-full md:w-1/2 p-2 md:p-4' : 'w-full md:w-[420px] p-0'}
                   ${mode === 'generate' ? 'h-[50vh] md:h-full' : 'h-1/2 md:h-full'} 
                   md:h-full
                `}
            >
                <AnimatePresence mode="wait">
                    {mode === 'generate' ? (
                        <motion.div 
                            key="generator"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col h-full"
                        >
                            <div className="p-6 md:p-8 border-b border-border/50 bg-gradient-to-b from-muted/30 to-transparent">
                                <h2 className="text-xl md:text-2xl font-display font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">New Synthesis</h2>
                                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed hidden md:block">
                                    Describe the chemical properties or structure you wish to generate. Our AI models will translate natural language into valid molecular structures.
                                </p>
                            </div>
                            
                            <div className="p-4 md:p-8 space-y-6 md:space-y-8 flex-1">
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        Input Prompt
                                    </label>
                                    <div className="relative group">
                                        <textarea 
                                            className="w-full bg-background border-2 border-border/50 focus:border-primary text-foreground p-4 md:p-5 min-h-[120px] md:min-h-[160px] rounded-2xl resize-none text-sm md:text-base leading-relaxed placeholder:text-muted-foreground/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm group-hover:border-border"
                                            placeholder="e.g. A potent inhibitor with a pyridine ring and two hydroxyl groups..."
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                        />
                                        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                                            {prompt.length} chars
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        Select Models
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-1 gap-2 md:gap-3">
                                        {["model_a", "model_b", "model_c"].map(m => (
                                            <div key={m} 
                                                className={`
                                                    flex items-center p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden
                                                    ${selectedModels.includes(m) 
                                                        ? 'bg-primary/5 border-primary shadow-md shadow-primary/5' 
                                                        : 'bg-background border-border/50 hover:border-primary/30 hover:bg-muted/30'}
                                                `}
                                                onClick={() => {
                                                    if(selectedModels.includes(m)) setSelectedModels(prev => prev.filter(x => x !== m));
                                                    else setSelectedModels(prev => [...prev, m]);
                                                }}
                                            >
                                                <div className={`
                                                    w-4 h-4 md:w-5 md:h-5 rounded-full mr-3 md:mr-4 border-2 flex items-center justify-center transition-all duration-300
                                                    ${selectedModels.includes(m) ? 'bg-primary border-primary scale-110' : 'bg-transparent border-muted-foreground scale-100'}
                                                `}>
                                                    {selectedModels.includes(m) && <CheckCircle2 className="w-3 md:w-3.5 h-3 md:h-3.5 text-primary-foreground" />}
                                                </div>
                                                <div>
                                                    <span className="text-xs md:text-sm font-bold block tracking-tight">{m.replace('_', ' ').toUpperCase()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 md:p-8 border-t border-border/50 bg-background/50 backdrop-blur-sm sticky bottom-0 z-20">
                                <Button 
                                    onClick={() => handleGenerate()} 
                                    disabled={loading || !prompt}
                                    className="w-full h-12 md:h-14 text-sm md:text-base font-bold tracking-wide shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl"
                                >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 md:h-5 md:w-5" />}
                                    Initiate Synthesis
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="editor"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-full rounded-2xl overflow-hidden border border-border/50 shadow-2xl"
                        >
                            <ProStructureEditor 
                                activeSmiles={activeSmiles} 
                                setActiveSmiles={setActiveSmiles} 
                                className="h-full border-0"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Right Panel: Visualization & Results */}
            <div className={`
                flex-1 bg-muted/20 relative flex flex-col p-4 md:p-6 overflow-hidden
                ${mode === 'generate' ? 'h-[50vh] md:h-full border-t md:border-t-0 md:border-l border-border' : 'h-1/2 md:h-full'}
            `}>
                {/* Background Decor */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
                
                {/* Header for View */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                   <div className="flex items-center gap-3">
                       <h3 className="text-xs md:text-sm font-bold text-foreground tracking-wide flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-primary animate-pulse"/>
                           3D VISUALIZATION
                       </h3>
                   </div>
                   
                   {mode === 'generate' && results.length > 0 && (
                       <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsResultListOpen(!isResultListOpen)}
                          className="h-8 text-xs font-semibold gap-2 border-border/50 bg-background/50 backdrop-blur hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                       >
                          <LayoutList className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isResultListOpen ? "Hide Results" : "Show Results"}</span>
                       </Button>
                   )}
                </div>

                {activeSmiles ? (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="w-full h-full flex flex-col md:flex-row gap-4 md:gap-6 relative"
                   >
                      {/* Main Viewer */}
                      <div className="flex-1 flex flex-col gap-4 min-w-0 transition-all duration-300 h-full">
                         <div className="flex-1 rounded-2xl overflow-hidden border-2 border-border/50 shadow-lg bg-card relative group hover:border-primary/30 transition-all min-h-[300px]">
                            <Molecule3DViewer smiles={debouncedSmiles || activeSmiles} className="w-full h-full" />
                            
                            {/* Active Model Label */}
                            {activeModel && (
                                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur px-3 py-1.5 rounded-lg border border-border shadow-sm flex items-center gap-2 z-10">
                                    <Box className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-xs font-bold uppercase">{activeModel.replace('_', ' ')}</span>
                                </div>
                            )}

                             {/* CONTEXT CARD - HIDDEN ON MOBILE KEYBOARD OPEN implies tricky logic, sticking to display always or hidden on very small screens */}
                             {activeRecord && (
                                <div className="hidden sm:flex absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-md p-4 rounded-xl border border-border shadow-lg flex-col gap-2 z-10 max-w-[500px]">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        <Quote className="w-3 h-3 text-primary" />
                                        <span>Source Description</span>
                                        {activeRecord.created_at && (
                                            <span className="ml-auto flex items-center gap-1 font-normal opacity-70">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(activeRecord.created_at), 'MMM d, h:mm a')}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {isEditingDesc ? (
                                        <div className="flex flex-col gap-2">
                                            <textarea 
                                                value={editDescValue}
                                                onChange={(e) => setEditDescValue(e.target.value)}
                                                className="w-full text-sm font-medium bg-muted/50 border border-border rounded p-2 focus:ring-1 focus:ring-primary outline-none resize-none"
                                                rows={2}
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" variant="ghost" onClick={() => setIsEditingDesc(false)} className="h-7 text-xs"><X className="w-3 h-3 mr-1"/> Cancel</Button>
                                                <Button size="sm" onClick={handleSaveDescription} className="h-7 text-xs"><Check className="w-3 h-3 mr-1"/> Save</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="group/text relative">
                                            <p className="text-sm font-medium text-foreground italic line-clamp-2 pr-6">
                                                "{activeRecord.prompt}"
                                            </p>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="absolute -top-1 -right-1 w-6 h-6 opacity-0 group-hover/text:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    setEditDescValue(activeRecord.prompt);
                                                    setIsEditingDesc(true);
                                                }}
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                         </div>
                      </div>

                      {/* Collapsible Results List - Stacked on Mobile if Open */}
                      <AnimatePresence>
                      {mode === 'generate' && results.length > 0 && isResultListOpen && (
                         <motion.div 
                            initial={{ width: 0, opacity: 0, height: 0 }}
                            animate={{ 
                                width: window.innerWidth > 768 ? 280 : "100%", 
                                opacity: 1, 
                                height: window.innerWidth > 768 ? "auto" : 200 
                            }}
                            exit={{ width: 0, opacity: 0, height: 0 }}
                            className="flex-shrink-0 flex flex-col gap-3 overflow-hidden md:h-full"
                         >
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Generated Candidates</div>
                            <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-2 scrollbar-hide">
                                {results.map((res, idx) => {
                                   const isActive = res.smiles === activeSmiles;
                                   return (
                                       <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 * idx }}
                                            className={cn(
                                                "relative group cursor-pointer border-2 rounded-xl overflow-hidden transition-all shadow-sm p-1",
                                                isActive 
                                                    ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                                                    : "border-border/50 bg-card hover:border-primary/50 hover:bg-muted/30"
                                            )}
                                            onClick={() => {
                                                setActiveSmiles(res.smiles);
                                                setActiveModel(res.model_name);
                                            }}
                                       >
                                           <div className="h-24 md:h-32 rounded-lg overflow-hidden bg-background relative pointer-events-none">
                                               <Molecule3DViewer smiles={res.smiles} />
                                           </div>
                                           
                                           <div className="p-3">
                                               <div className="flex justify-between items-center mb-1">
                                                   <span className={cn("text-xs font-bold uppercase", isActive ? "text-primary" : "text-foreground")}>
                                                       {res.model_name.replace('_', ' ')}
                                                   </span>
                                                   
                                                   <div className="flex gap-1">
                                                       <Button 
                                                            size="icon" 
                                                            variant="ghost" 
                                                            className="w-5 h-5 h-5 rounded-full hover:bg-primary hover:text-white"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRegenerate([res.model_name]);
                                                            }}
                                                       >
                                                           <RefreshCw className="w-3 h-3" />
                                                       </Button>
                                                       {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                                                   </div>
                                               </div>
                                           </div>
                                       </motion.div>
                                   );
                                })}
                            </div>
                         </motion.div>
                      )}
                      </AnimatePresence>
                   </motion.div>
               ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center relative">
                       <div className="w-64 h-64 bg-primary/5 rounded-full absolute blur-3xl animate-pulse" />
                       <div className="w-24 h-24 bg-card rounded-3xl border border-border shadow-xl flex items-center justify-center mb-6 relative z-10 rotate-3 transition-transform hover:rotate-0">
                           <Sparkles className="w-10 h-10 text-primary" />
                       </div>
                       <h2 className="text-xl md:text-3xl font-display font-bold text-foreground mb-3 relative z-10">Ready to Discover</h2>
                   </div>
               )}
            </div>
        </div>
    </MainLayout>
  );
}
