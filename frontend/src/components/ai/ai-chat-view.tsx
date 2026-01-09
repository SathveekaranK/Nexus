"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send, Bot, Loader2, Sparkles, User as UserIcon } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface AiChatViewProps {
  currentUser: any;
}

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: any[];
  name?: string;
}

const AiChatHeader = () => {
  return (
    <header className="flex items-center justify-between p-4 border-b border-white/5 bg-background/80 backdrop-blur-xl transition-all">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg ring-1 ring-primary/20">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Nexus AI
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/20">V3</span>
          </h2>
          <p className="text-[10px] text-muted-foreground">Enterprise Assistant • Personal Manager</p>
        </div>
      </div>
    </header>
  );
};

export default function AiChatView({ currentUser }: AiChatViewProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I am Nexus AI V3. I can help you manage the workspace, control music, analyze chats, and more. How can I assist you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await api.getAiHistory();
        if (history && history.length > 0) {
          setMessages(history);
        }
      } catch (error) {
        console.warn("Failed to load AI history", error);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Send the entire conversation history context to the backend
      const assistantMsg = await api.chat([...messages, userMsg]);

      // The backend returns the final assistant message (after tool execution loops)
      setMessages(prev => [...prev, assistantMsg]);

    } catch (error: any) {
      console.error("AI Error:", error);
      toast({
        title: "AI Error",
        description: error.response?.data?.error || "Failed to communicate with Nexus AI.",
        variant: "destructive"
      });
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered a system error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

      <AiChatHeader />

      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-6 max-w-3xl mx-auto pb-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role !== 'user' && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-white/5">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div className={`max-w-[80%] space-y-2`}>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-secondary/50 border border-white/5 text-foreground rounded-tl-none'
                    }`}
                >
                  {/* Handle Tool Calls visualization if needed, currently just hiding or text */}
                  {msg.content ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="italic text-muted-foreground">Executed action...</div>
                  )}
                </div>
                {/* Timestamp or Status could go here */}
              </div>

              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <UserIcon className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-white/5">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-secondary/50 border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground animate-pulse">Nexus AI is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-background/80 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-3xl mx-auto relative flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Nexus AI to manage tasks, play music, or analyze data..."
            className="pr-12 py-6 bg-secondary/50 border-white/10 focus-visible:ring-primary/20 backdrop-blur-sm"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="absolute right-2 top-1.5 h-9 w-9 rounded-full transition-all hover:scale-105 active:scale-95 bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3 text-yellow-500/50" />
            Nexus AI can make mistakes. Verify critical actions.
          </p>
        </div>
      </div>
    </div>
  );
}
