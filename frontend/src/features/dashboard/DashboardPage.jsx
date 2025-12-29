import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from "sonner";
import Molecule3DViewer from '@/components/Molecule3DViewer';
import { ProStructureEditor } from '@/components/ProStructureEditor';
import { useDebounce } from '@/hooks/use-debounce';
import axios from 'axios';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Sparkles, CheckCircle2, ChevronRight, ChevronLeft,
  LayoutList, Box, Maximize2, Quote, Calendar, Edit2, Check, X, RefreshCw, Copy,
  FileText, Beaker, Atom, Cpu, Wand2, ArrowRight, Info, AlertCircle
} from "lucide-react";
import { cn, getApiUrl } from "@/lib/utils";
import { format } from "date-fns";

const DASHBOARD_API = getApiUrl("/api/molecules");
const KNOWLEDGE_API = getApiUrl("/api/knowledge");

// Updated model list - matching backend
const AVAILABLE_MODELS = [
  { id: 'your_model', name: 'Your Model', description: 'Custom trained model', icon: Cpu },
  { id: 'molt5', name: 'MolT5', description: 'Transformer for molecules', icon: Beaker },
  { id: 'chemberta', name: 'ChemBERTa', description: 'BERT-based chemistry model', icon: Atom },
];

export default function DashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState(["your_model"]);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeSmiles, setActiveSmiles] = useState(null); 
  const [activeModel, setActiveModel] = useState(null); 
  const [activeRecord, setActiveRecord] = useState(null); 
  const [mode, setMode] = useState("generate"); 
  const [isResultListOpen, setIsResultListOpen] = useState(true);
  const [inputMode, setInputMode] = useState("text"); // 'text' or 'smiles'
  const [smilesInput, setSmilesInput] = useState("");
  
  // Molecule-to-Text state
  const [mol2textLoading, setMol2textLoading] = useState(false);
  const [mol2textResult, setMol2textResult] = useState(null);
  
  // Edit Description State
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescValue, setEditDescValue] = useState("");

  const debouncedSmiles = useDebounce(activeSmiles, 800);

  const handleGenerate = async (overridePrompt = null, overrideModels = null) => {
    const finalPrompt = overridePrompt || prompt;
    const finalModels = overrideModels || selectedModels;
    
    if (!finalPrompt) return;
    if (finalModels.length === 0) {
      toast.error("Please select at least one model");
      return;
    }
    
    setLoading(true);
    setMol2textResult(null);
    
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

  const handleSmilesVisualize = async () => {
    if (!smilesInput.trim()) {
      toast.error("Please enter a SMILES string");
      return;
    }
    
    // Directly visualize the SMILES
    setActiveSmiles(smilesInput.trim());
    setActiveModel("user_input");
    setResults([{
      model_name: "user_input",
      smiles: smilesInput.trim(),
      confidence: 1.0,
      execution_time: 0
    }]);
    
    // Create a pseudo-record
    setActiveRecord({
      id: `smiles-${Date.now()}`,
      prompt: `SMILES: ${smilesInput.trim()}`,
      created_at: new Date().toISOString(),
      results: [{
        model_name: "user_input",
        smiles: smilesInput.trim(),
        confidence: 1.0,
        execution_time: 0
      }]
    });
    
    setIsResultListOpen(true);
    toast.success("SMILES visualized successfully");
  };

  const handleMol2Text = async () => {
    if (!activeSmiles) {
      toast.error("No molecule selected");
      return;
    }
    
    setMol2textLoading(true);
    try {
      const res = await axios.post(`${KNOWLEDGE_API}/mol2text`, {
        smiles: activeSmiles
      });
      
      if (res.data.success) {
        setMol2textResult(res.data.description);
        toast.success("Description generated");
      } else {
        toast.error(res.data.error || "Failed to generate description");
      }
    } catch (e) {
      toast.error("Failed to generate description");
      console.error(e);
    } finally {
      setMol2textLoading(false);
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
          
          const updatedRecord = { ...activeRecord, prompt: editDescValue };
          setActiveRecord(updatedRecord);
          setPrompt(editDescValue);
          setIsEditingDesc(false);
          fetchHistory();
          toast.success("Description updated");
      } catch(e) {
          toast.error("Failed to update description");
      }
  }

  const handleCopySmiles = () => {
    if (activeSmiles) {
      navigator.clipboard.writeText(activeSmiles);
      toast.success("SMILES copied to clipboard");
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
            setMol2textResult(null);
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
                   ${mode === 'edit' ? 'w-full md:w-1/2 p-2 md:p-4' : 'w-full md:w-[450px] p-0'}
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
                                <h2 className="text-xl md:text-2xl font-display font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                                  Text to Molecule
                                </h2>
                                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed hidden md:block">
                                    Generate molecular structures from natural language descriptions using AI models.
                                </p>
                            </div>
                            
                            <div className="p-4 md:p-6 space-y-5 flex-1 overflow-y-auto">
                                {/* Input Mode Tabs */}
                                <Tabs value={inputMode} onValueChange={setInputMode} className="w-full">
                                  <TabsList className="grid w-full grid-cols-2 h-10">
                                    <TabsTrigger value="text" className="text-xs font-bold gap-2">
                                      <FileText className="w-3.5 h-3.5" />
                                      Text Description
                                    </TabsTrigger>
                                    <TabsTrigger value="smiles" className="text-xs font-bold gap-2">
                                      <Atom className="w-3.5 h-3.5" />
                                      SMILES Input
                                    </TabsTrigger>
                                  </TabsList>
                                  
                                  <TabsContent value="text" className="mt-4 space-y-5">
                                    {/* Text Input */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            Natural Language Description
                                        </label>
                                        <div className="relative group">
                                            <textarea 
                                                className="w-full bg-background border-2 border-border/50 focus:border-primary text-foreground p-4 min-h-[120px] rounded-xl resize-none text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm group-hover:border-border"
                                                placeholder="e.g. A molecule with an aromatic ring and two hydroxyl groups..."
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                            />
                                            <div className="absolute bottom-3 right-3 text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                                                {prompt.length} chars
                                            </div>
                                        </div>
                                    </div>

                                    {/* Model Selection */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            Select AI Models
                                        </label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {AVAILABLE_MODELS.map(model => {
                                              const Icon = model.icon;
                                              const isSelected = selectedModels.includes(model.id);
                                              return (
                                                <div key={model.id} 
                                                    className={cn(
                                                        "flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden",
                                                        isSelected 
                                                            ? 'bg-primary/5 border-primary shadow-md shadow-primary/5' 
                                                            : 'bg-background border-border/50 hover:border-primary/30 hover:bg-muted/30'
                                                    )}
                                                    onClick={() => {
                                                        if(isSelected) setSelectedModels(prev => prev.filter(x => x !== model.id));
                                                        else setSelectedModels(prev => [...prev, model.id]);
                                                    }}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg mr-3 flex items-center justify-center transition-all",
                                                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                    )}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="text-sm font-bold block">{model.name}</span>
                                                        <span className="text-xs text-muted-foreground">{model.description}</span>
                                                    </div>
                                                    {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                                </div>
                                              );
                                            })}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                          <Info className="w-3 h-3" />
                                          Select multiple models to compare results
                                        </p>
                                    </div>
                                  </TabsContent>
                                  
                                  <TabsContent value="smiles" className="mt-4 space-y-4">
                                    {/* SMILES Input */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            SMILES String
                                        </label>
                                        <Input 
                                            className="h-12 font-mono text-sm"
                                            placeholder="e.g. CC(=O)OC1=CC=CC=C1C(=O)O"
                                            value={smilesInput}
                                            onChange={(e) => setSmilesInput(e.target.value)}
                                        />
                                    </div>
                                    
                                    {/* Common Examples */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            Common Examples
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                          {[
                                            { name: 'Aspirin', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O' },
                                            { name: 'Caffeine', smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C' },
                                            { name: 'Ethanol', smiles: 'CCO' },
                                            { name: 'Benzene', smiles: 'c1ccccc1' },
                                          ].map(ex => (
                                            <Button 
                                              key={ex.name}
                                              variant="outline" 
                                              size="sm"
                                              className="text-xs justify-start"
                                              onClick={() => setSmilesInput(ex.smiles)}
                                            >
                                              {ex.name}
                                            </Button>
                                          ))}
                                        </div>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                            </div>

                            {/* Action Button */}
                            <div className="p-4 md:p-6 border-t border-border/50 bg-background/50 backdrop-blur-sm sticky bottom-0 z-20">
                                {inputMode === 'text' ? (
                                  <Button 
                                      onClick={() => handleGenerate()} 
                                      disabled={loading || !prompt || selectedModels.length === 0}
                                      className="w-full h-12 text-sm font-bold tracking-wide shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl"
                                  >
                                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                      Generate Molecule{selectedModels.length > 1 ? 's' : ''}
                                  </Button>
                                ) : (
                                  <Button 
                                      onClick={handleSmilesVisualize} 
                                      disabled={!smilesInput.trim()}
                                      className="w-full h-12 text-sm font-bold tracking-wide shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl"
                                  >
                                      <Atom className="mr-2 h-4 w-4" />
                                      Visualize SMILES
                                  </Button>
                                )}
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
            <div className={cn(
                "flex-1 bg-muted/20 relative flex flex-col p-4 md:p-6 overflow-hidden",
                mode === 'generate' ? 'h-[50vh] md:h-full border-t md:border-t-0 md:border-l border-border' : 'h-1/2 md:h-full'
            )}>
                {/* Background Decor */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                   <div className="flex items-center gap-3">
                       <h3 className="text-xs md:text-sm font-bold text-foreground tracking-wide flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-primary animate-pulse"/>
                           3D VISUALIZATION
                       </h3>
                   </div>
                   
                   <div className="flex items-center gap-2">
                     {activeSmiles && (
                       <>
                         <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCopySmiles}
                            className="h-8 text-xs font-semibold gap-2 border-border/50 bg-background/50 backdrop-blur hover:bg-primary/10"
                         >
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Copy SMILES</span>
                         </Button>
                         <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleMol2Text}
                            disabled={mol2textLoading}
                            className="h-8 text-xs font-semibold gap-2 border-border/50 bg-background/50 backdrop-blur hover:bg-primary/10"
                         >
                            {mol2textLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">Describe</span>
                         </Button>
                       </>
                     )}
                     {mode === 'generate' && results.length > 0 && (
                       <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsResultListOpen(!isResultListOpen)}
                          className="h-8 text-xs font-semibold gap-2 border-border/50 bg-background/50 backdrop-blur hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                       >
                          <LayoutList className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isResultListOpen ? "Hide" : "Show"} Results</span>
                       </Button>
                     )}
                   </div>
                </div>

                {activeSmiles ? (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="w-full h-full flex flex-col md:flex-row gap-4 md:gap-6 relative"
                   >
                      {/* Main Viewer */}
                      <div className="flex-1 flex flex-col gap-4 min-w-0 transition-all duration-300 h-full">
                         <div className="flex-1 rounded-2xl overflow-hidden border-2 border-border/50 shadow-lg bg-card relative group hover:border-primary/30 transition-all min-h-[250px]">
                            <Molecule3DViewer smiles={debouncedSmiles || activeSmiles} className="w-full h-full" />
                            
                            {/* Active Model Label */}
                            {activeModel && (
                                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur px-3 py-1.5 rounded-lg border border-border shadow-sm flex items-center gap-2 z-10">
                                    <Box className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-xs font-bold uppercase">{activeModel.replace('_', ' ')}</span>
                                </div>
                            )}
                            
                            {/* SMILES Display */}
                            <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur px-3 py-2 rounded-lg border border-border shadow-sm z-10">
                              <div className="text-xs font-bold text-muted-foreground mb-1">SMILES</div>
                              <code className="text-xs font-mono text-foreground break-all">{activeSmiles}</code>
                            </div>
                         </div>
                         
                         {/* Mol2Text Result */}
                         {mol2textResult && (
                           <motion.div 
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="bg-card border border-border rounded-xl p-4 shadow-sm"
                           >
                             <div className="flex items-center gap-2 mb-2">
                               <Wand2 className="w-4 h-4 text-primary" />
                               <span className="text-xs font-bold text-muted-foreground uppercase">AI Description</span>
                             </div>
                             <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                               {mol2textResult}
                             </p>
                           </motion.div>
                         )}
                      </div>

                      {/* Results List */}
                      <AnimatePresence>
                      {mode === 'generate' && results.length > 1 && isResultListOpen && (
                         <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 280, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="flex-shrink-0 flex flex-col gap-3 overflow-hidden md:h-full"
                         >
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                              Model Comparison ({results.length} results)
                            </div>
                            <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-2 scrollbar-hide">
                                {results.map((res, idx) => {
                                   const isActive = res.smiles === activeSmiles;
                                   const modelInfo = AVAILABLE_MODELS.find(m => m.id === res.model_name) || {};
                                   const Icon = modelInfo.icon || Cpu;
                                   
                                   return (
                                       <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 * idx }}
                                            className={cn(
                                                "relative group cursor-pointer border-2 rounded-xl overflow-hidden transition-all shadow-sm",
                                                isActive 
                                                    ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                                                    : "border-border/50 bg-card hover:border-primary/50 hover:bg-muted/30"
                                            )}
                                            onClick={() => {
                                                setActiveSmiles(res.smiles);
                                                setActiveModel(res.model_name);
                                                setMol2textResult(null);
                                            }}
                                       >
                                           <div className="h-24 rounded-lg overflow-hidden bg-background relative pointer-events-none m-1">
                                               <Molecule3DViewer smiles={res.smiles} />
                                           </div>
                                           
                                           <div className="p-3">
                                               <div className="flex justify-between items-center mb-1">
                                                   <div className="flex items-center gap-2">
                                                     <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                                                     <span className={cn("text-xs font-bold", isActive ? "text-primary" : "text-foreground")}>
                                                         {modelInfo.name || res.model_name}
                                                     </span>
                                                   </div>
                                                   
                                                   <div className="flex gap-1 items-center">
                                                       <span className="text-[10px] text-muted-foreground">
                                                         {(res.confidence * 100).toFixed(0)}%
                                                       </span>
                                                       {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                                                   </div>
                                               </div>
                                               <code className="text-[10px] font-mono text-muted-foreground block truncate">
                                                 {res.smiles}
                                               </code>
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
                       <p className="text-sm text-muted-foreground max-w-md relative z-10">
                         Enter a text description or SMILES string to visualize molecular structures in 3D.
                       </p>
                   </div>
               )}
            </div>
        </div>
    </MainLayout>
  );
}
