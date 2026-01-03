"use client";

import type { Message, User } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, Bot } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import MessageItem from "./message-item";
import { handleAiQuery } from "@/lib/api";
import { USERS } from "@/lib/data";

interface AiChatViewProps {
  currentUser: User;
}

const AiChatHeader = () => {
  return (
    <header className="flex items-center justify-between p-3 border-b border-border shadow-sm bg-secondary">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muted rounded-full">
          <Bot className="h-5 w-5 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Nexus AI</h2>
      </div>
    </header>
  );
};

export default function AiChatView({ currentUser }: AiChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Combine users and AI bot for message rendering
  const allUsersAndBots = [...USERS];
  const nexusAiUser = allUsersAndBots.find(u => u.id === 'nexus-ai');
  if (!nexusAiUser) {
    allUsersAndBots.push({ id: 'nexus-ai', name: 'Nexus AI', avatarUrl: 'https://picsum.photos/seed/999/40/40', status: 'online' });
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      content,
      timestamp: format(new Date(), "p"),
      channelId: "ai-chat",
      type: "text",
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    const botTypingMessage: Message = {
      id: `msg-typing-${Date.now()}`,
      senderId: "nexus-ai",
      content: "Nexus AI is thinking...",
      timestamp: format(new Date(), "p"),
      channelId: "ai-chat",
      type: "bot",
    };
    setMessages((prev) => [...prev, botTypingMessage]);

    const contextMessages = messages
      .slice(-50)
      .map((m) => `${allUsersAndBots.find((u) => u.id === m.senderId)?.name}: ${m.content}`);

    const result = await handleAiQuery(content, contextMessages);

    const botMessage: Message = {
      id: `msg-bot-${Date.now()}`,
      senderId: "nexus-ai",
      content: result.message,
      timestamp: format(new Date(), "p"),
      channelId: "ai-chat",
      type: "bot",
    };
    setMessages((prev) =>
      prev.filter((m) => m.id !== botTypingMessage.id).concat(botMessage)
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <AiChatHeader />
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground mt-8">
              <Bot className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold">Welcome to Nexus AI</h3>
              <p className="text-sm">Ask me anything! I can help you with your work, summarize conversations, and more.</p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              sender={allUsersAndBots.find((u) => u.id === msg.senderId)!}
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
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border bg-secondary">
        <div className="relative">
          <Input
            placeholder="Ask Nexus AI..."
            className="pr-12 bg-background"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(inputValue)}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button size="icon" onClick={() => sendMessage(inputValue)} disabled={!inputValue.trim()}>
              <Send />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
