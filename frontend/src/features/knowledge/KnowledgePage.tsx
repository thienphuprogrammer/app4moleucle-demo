'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Send, Bot, User, BookOpen, Sparkles } from 'lucide-react';

import { MainLayout } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { knowledgeApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

export function KnowledgePage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm your molecular assistant. Ask me about chemical structures, properties, or synthesis methods." },
  ]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await knowledgeApi.chat({ query: userMsg.content, session_id: sessionId || undefined });
      if (!sessionId) setSessionId(res.session_id);
      const botMsg: ChatMessage = {
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      toast.error('Failed to get answer');
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error retrieving that information.' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleTopicClick = (topic: string) => {
    setQuery(topic);
  };

  return (
    <MainLayout>
      <div className="flex h-full flex-col md:flex-row overflow-hidden">
        {/* Sidebar - Topics */}
        <div className="w-full md:w-80 border-r border-border bg-card/30 hidden md:flex flex-col">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Knowledge Base
            </h2>
            <p className="text-xs text-muted-foreground mt-1">RAG-powered molecular intelligence.</p>
          </div>
          <div className="p-4 space-y-2">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Suggested Topics</div>
            {['What is aspirin?', 'Explain ethanol properties', 'Describe caffeine structure', 'What are NSAIDs?'].map((topic) => (
              <div
                key={topic}
                onClick={() => handleTopicClick(topic)}
                className="p-3 rounded-xl bg-card border border-border/50 hover:border-primary/50 cursor-pointer transition-all text-sm font-medium text-foreground/80 hover:text-primary"
              >
                {topic}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background relative">
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-4 max-w-3xl', msg.role === 'user' ? 'ml-auto flex-row-reverse' : '')}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm',
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={cn(
                    'p-4 rounded-2xl text-sm leading-relaxed shadow-sm',
                    msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border border-border/50 rounded-tl-sm'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/20 flex flex-wrap gap-2">
                      {msg.sources.map((src, i) => (
                        <span key={i} className="text-[10px] bg-background/20 px-2 py-1 rounded-full opacity-80">
                          Source: {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-3xl">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="bg-card border border-border/50 p-4 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </motion.div>
            )}
          </div>

          <div className="p-4 md:p-6 bg-background/80 backdrop-blur-md border-t border-border/50">
            <div className="max-w-3xl mx-auto relative">
              <Input
                className="h-12 pl-4 pr-12 rounded-full bg-muted/30 border-border/50 focus:border-primary shadow-sm"
                placeholder="Ask about a molecule..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={loading}
              />
              <Button
                size="icon"
                className="absolute right-1 top-1 h-10 w-10 rounded-full"
                onClick={handleSend}
                disabled={loading || !query.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> AI can make mistakes. Verify chemical data.
              </span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
