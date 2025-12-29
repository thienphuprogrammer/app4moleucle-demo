'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus, FlaskConical, Calendar, Play, Trash2, ChevronRight,
  Loader2, Sparkles, Box, Beaker, Atom, Cpu, CheckCircle2,
} from 'lucide-react';

import { MainLayout } from '@/components/layout';
import { Button, Input, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { Molecule3DViewer } from '@/components/molecules';
import { experimentsApi, moleculesApi } from '@/lib/api';
import { cn, formatDate, truncate } from '@/lib/utils';
import { AVAILABLE_MODELS, type Experiment, type GenerationRecord, type SingleModelResult } from '@/lib/types';

const MODEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  your_model: Cpu,
  molt5: Beaker,
  chemberta: Atom,
};

export function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [runs, setRuns] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newExpName, setNewExpName] = useState('');
  const [newExpDesc, setNewExpDesc] = useState('');
  
  // Generation state
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['your_model']);
  const [generating, setGenerating] = useState(false);
  const [activeSmiles, setActiveSmiles] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<GenerationRecord | null>(null);

  const fetchExperiments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await experimentsApi.list();
      setExperiments(data);
    } catch (e) {
      toast.error('Failed to load experiments');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRuns = useCallback(async (experimentId: string) => {
    try {
      const data = await experimentsApi.getRuns(experimentId);
      setRuns(data);
    } catch (e) {
      console.error('Failed to load runs');
    }
  }, []);

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  useEffect(() => {
    if (selectedExperiment) {
      fetchRuns(selectedExperiment.id);
    }
  }, [selectedExperiment, fetchRuns]);

  const handleCreateExperiment = async () => {
    if (!newExpName.trim()) {
      toast.error('Please enter experiment name');
      return;
    }
    try {
      const exp = await experimentsApi.create({ name: newExpName, description: newExpDesc });
      setExperiments((prev) => [exp, ...prev]);
      setNewExpName('');
      setNewExpDesc('');
      setCreateDialogOpen(false);
      setSelectedExperiment(exp);
      toast.success('Experiment created');
    } catch (e) {
      toast.error('Failed to create experiment');
    }
  };

  const handleGenerate = async () => {
    if (!selectedExperiment || !prompt.trim()) return;
    if (selectedModels.length === 0) {
      toast.error('Please select at least one model');
      return;
    }

    setGenerating(true);
    try {
      const record = await experimentsApi.generateInExperiment(selectedExperiment.id, {
        prompt,
        models: selectedModels,
      });
      setRuns((prev) => [record, ...prev]);
      setActiveRun(record);
      if (record.results.length > 0) {
        setActiveSmiles(record.results[0].smiles);
      }
      setPrompt('');
      toast.success('Generation complete');
      // Update experiment run count
      setSelectedExperiment((prev) => prev ? { ...prev, run_count: (prev.run_count || 0) + 1 } : null);
    } catch (e) {
      toast.error('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId) ? prev.filter((x) => x !== modelId) : [...prev, modelId]
    );
  };

  return (
    <MainLayout>
      <div className="flex h-full overflow-hidden">
        {/* Left Panel - Experiments List */}
        <div className="w-80 border-r border-border bg-card/30 flex flex-col">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" />
                Experiments
              </h2>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>

            {/* Create Experiment Form */}
            <AnimatePresence>
              {createDialogOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <Input
                    placeholder="Experiment name"
                    value={newExpName}
                    onChange={(e) => setNewExpName(e.target.value)}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newExpDesc}
                    onChange={(e) => setNewExpDesc(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateExperiment} className="flex-1">
                      Create
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Experiments List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : experiments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No experiments yet.
                <br />
                Create your first experiment!
              </div>
            ) : (
              experiments.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => {
                    setSelectedExperiment(exp);
                    setActiveRun(null);
                    setActiveSmiles(null);
                  }}
                  className={cn(
                    'p-3 rounded-xl cursor-pointer transition-all border-2',
                    selectedExperiment?.id === exp.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-transparent hover:border-border hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{exp.name}</h3>
                      {exp.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{exp.description}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {exp.run_count || 0} runs
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(exp.updated_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedExperiment ? (
            <>
              {/* Experiment Header */}
              <div className="p-6 border-b border-border/50 bg-card/30">
                <h1 className="text-2xl font-bold">{selectedExperiment.name}</h1>
                {selectedExperiment.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedExperiment.description}</p>
                )}
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Generation Panel */}
                <div className="w-[400px] border-r border-border p-4 flex flex-col overflow-y-auto">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    New Generation
                  </h3>

                  <div className="space-y-4 flex-1">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">Prompt</label>
                      <textarea
                        className="w-full bg-background border border-border text-foreground p-3 min-h-[100px] rounded-lg resize-none text-sm"
                        placeholder="Describe the molecule..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">Models</label>
                      <div className="space-y-2">
                        {AVAILABLE_MODELS.map((model) => {
                          const Icon = MODEL_ICONS[model.id] || Cpu;
                          const isSelected = selectedModels.includes(model.id);
                          return (
                            <div
                              key={model.id}
                              onClick={() => toggleModel(model.id)}
                              className={cn(
                                'flex items-center p-2 rounded-lg border cursor-pointer transition-all',
                                isSelected ? 'bg-primary/10 border-primary' : 'border-border hover:border-primary/50'
                              )}
                            >
                              <Icon className={cn('w-4 h-4 mr-2', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                              <span className="text-sm font-medium flex-1">{model.name}</span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generating || !prompt.trim() || selectedModels.length === 0}
                    className="w-full mt-4"
                  >
                    {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Generate
                  </Button>

                  {/* Runs History */}
                  <div className="mt-6">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                      Run History ({runs.length})
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {runs.map((run) => (
                        <div
                          key={run.id}
                          onClick={() => {
                            setActiveRun(run);
                            if (run.results.length > 0) {
                              setActiveSmiles(run.results[0].smiles);
                            }
                          }}
                          className={cn(
                            'p-3 rounded-lg border cursor-pointer transition-all',
                            activeRun?.id === run.id ? 'bg-primary/10 border-primary' : 'border-border hover:border-primary/50'
                          )}
                        >
                          <p className="text-sm font-medium truncate">{truncate(run.prompt, 40)}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <span>{run.results.length} results</span>
                            <span>•</span>
                            <span>{formatDate(run.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Visualization Panel */}
                <div className="flex-1 p-6 bg-muted/10 flex flex-col">
                  {activeSmiles ? (
                    <>
                      <div className="flex-1 rounded-2xl overflow-hidden border border-border bg-card relative min-h-[400px]">
                        <Molecule3DViewer smiles={activeSmiles} className="w-full h-full" />
                        <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur px-3 py-2 rounded-lg border border-border">
                          <code className="text-xs font-mono text-foreground break-all">{activeSmiles}</code>
                        </div>
                      </div>

                      {activeRun && activeRun.results.length > 1 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">All Results</h4>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {activeRun.results.map((res, idx) => (
                              <div
                                key={idx}
                                onClick={() => setActiveSmiles(res.smiles)}
                                className={cn(
                                  'flex-shrink-0 w-32 h-24 rounded-lg border overflow-hidden cursor-pointer transition-all',
                                  res.smiles === activeSmiles ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                                )}
                              >
                                <Molecule3DViewer smiles={res.smiles} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Generate a molecule or select a run to view</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FlaskConical className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-bold mb-2">Select an Experiment</h2>
                <p className="text-sm">Choose an experiment from the list or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
