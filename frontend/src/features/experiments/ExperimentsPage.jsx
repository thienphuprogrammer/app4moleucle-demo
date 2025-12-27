import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import axios from 'axios';
import { 
  FlaskConical, Plus, ArrowRight, FolderOpen, Calendar
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { getApiUrl } from '@/lib/utils';

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newExpName, setNewExpName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const fetchExperiments = async () => {
      try {
          const res = await axios.get(getApiUrl("/api/experiments/"));
          setExperiments(res.data);
      } catch(e) {
          toast.error("Failed to load experiments");
      } finally {
          setLoading(false);
      }
  }

  const handleCreate = async () => {
      if(!newExpName.trim()) return;
      try {
          await axios.post(getApiUrl("/api/experiments/"), { name: newExpName });
          setNewExpName("");
          setIsDialogOpen(false);
          toast.success("Experiment created");
          fetchExperiments();
      } catch(e) {
          toast.error("Failed to create experiment");
      }
  }

  useEffect(() => {
      fetchExperiments();
  }, []);

  return (
    <MainLayout>
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">Experiments Lab</h1>
                    <p className="text-sm text-muted-foreground">Manage your research projects and molecular collections.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-bold shadow-lg shadow-primary/20 w-full md:w-auto">
                            <Plus className="w-4 h-4 mr-2" /> New Experiment
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Experiment</DialogTitle>
                            <DialogDescription>
                                Create a folder to organize your molecular synthesis runs.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label htmlFor="name" className="text-sm font-medium">Experiment Name</label>
                                <Input id="name" value={newExpName} onChange={(e) => setNewExpName(e.target.value)} placeholder="e.g. Cancer Research Phase 1" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate}>Create Project</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1,2,3].map(i => <div key={i} className="h-40 bg-muted/20 animate-pulse rounded-xl" />)
                ) : experiments.map(exp => (
                    <div 
                        key={exp.id} 
                        onClick={() => router.push(`/experiments/${exp.id}`)}
                        className="group bg-card border border-border/50 hover:border-primary/50 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-5 h-5 text-primary" />
                        </div>
                        
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                            <FlaskConical className="w-6 h-6" />
                        </div>
                        
                        <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{exp.name}</h3>
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{exp.description || "No description provided."}</p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                            <div className="flex items-center gap-1">
                                <FolderOpen className="w-3.5 h-3.5" />
                                <span>{exp.run_count} Runs</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{format(new Date(exp.updated_at), 'MMM d, yyyy')}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </MainLayout>
  );
}
