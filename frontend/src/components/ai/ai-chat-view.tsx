"use client";

import type { Message, User } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send, Bot, Loader2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import MessageItem from "../chat/message-item";
import { USERS } from "@/lib/data";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface AiChatViewProps {
  currentUser: User;
}

const AiChatHeader = () => {
  return (
    <header className="flex items-center justify-between p-4 border-b border-white/5 bg-background/80 backdrop-blur-xl transition-all">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg ring-1 ring-primary/20">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Nexus AI</h2>
          <p className="text-[10px] text-muted-foreground">Powered by RAG & OpenRouter</p>
        </div>
      </div>
    </header>
  );
};

export default function AiChatView({ currentUser }: AiChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const mockNexusUser: User = { id: 'nexus-ai', name: 'Nexus AI', avatar: 'https://ui-avatars.com/api/?name=Nexus+AI&background=7c3aed&color=fff', status: 'online', customStatus: 'Helper Bot' };
  const allUsersAndBots = [...USERS, mockNexusUser];

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isThinking) return;

    // Add User Message
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      senderId: currentUser.id,
      content,
      timestamp: new Date().toISOString(), // Use ISO for consistency
      channelId: "ai-chat",
      type: "text",
    };

    // Optimistic update
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInputValue("");
    setIsThinking(true);

    try {
      // Convert to OpenAI Format
      const apiMessages = currentMessages.map(m => ({
        role: m.senderId === 'nexus-ai' ? 'assistant' : 'user',
        content: m.content
      }));

      const response = await api.chat(apiMessages);

      if (response) {
        const botMessage: Message = {
          id: `msg-${Date.now()}-bot`,
          senderId: "nexus-ai",
          // Handle deepseek/openai content structure
          content: response.content || "I couldn't generate a response.",
          timestamp: new Date().toISOString(),
          channelId: "ai-chat",
          type: "bot",
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        senderId: "nexus-ai",
        content: "Sorry, I encountered an error connecting to the AI brain.",
        timestamp: new Date().toISOString(),
        channelId: "ai-chat",
        type: "bot",
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({ title: "AI Error", description: "Failed to get response.", variant: "destructive" });
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

      <AiChatHeader />
      <ScrollArea className="flex-1" viewportRef={scrollAreaRef} >
        <div className="p-4 space-y-6 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground mt-12 flex flex-col items-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4 ring-1 ring-primary/20">
                <Bot className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Welcome to Nexus Intelligence</h3>
              <p className="text-sm max-w-md">
                I have access to your <span className="text-primary font-medium">Resources</span>, <span className="text-primary font-medium">Users</span>, and <span className="text-primary font-medium">Rooms</span>.
                <br /> Try asking: <span className="italic">"Who is online?"</span> or <span className="italic">"Do we have any AWS keys?"</span>
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              sender={allUsersAndBots.find((u) => u.id === msg.senderId) || mockNexusUser}
              currentUser={currentUser}
              onUpdateMessage={() => { }}
              onDeleteMessage={() => { }}
              onReact={() => { }}
              onReply={() => { }}
              onTogglePin={() => { }}
              onViewProfile={() => { }}
              users={allUsersAndBots}
              allMessages={messages}
            />
          ))}

          {isThinking && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="bg-secondary/40 backdrop-blur-md rounded-2xl rounded-tl-none p-3 px-4 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground font-medium animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="relative max-w-3xl mx-auto">
          <Input
            placeholder="Ask anything..."
            className="pr-12 bg-secondary/50 border-white/10 focus:bg-secondary transition-all h-12"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(inputValue)}
            disabled={isThinking}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button size="icon" onClick={() => sendMessage(inputValue)} disabled={!inputValue.trim() || isThinking} className="h-8 w-8">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
