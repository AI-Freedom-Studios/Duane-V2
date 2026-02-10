'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Send,
  Loader2,
  Zap,
  Bot,
  User,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  provider?: string;
  timestamp: Date;
}

const llmModels = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', color: 'bg-green-500' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', color: 'bg-orange-500' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', color: 'bg-blue-500' },
  { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', provider: 'Meta', color: 'bg-purple-500' },
  { id: 'mixtral-8x22b', name: 'Mixtral 8x22B', provider: 'Mistral', color: 'bg-cyan-500' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', color: 'bg-indigo-500' },
  { id: 'qwen-2.5-72b', name: 'Qwen 2.5 72B', provider: 'Alibaba', color: 'bg-red-500' },
  { id: 'command-r-plus', name: 'Command R+', provider: 'Cohere', color: 'bg-pink-500' },
];

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: (data: { model: string; messages: Array<{ role: string; content: string }> }) =>
      api.post<{ content: string; model: string; provider: string }>('/poe/chat', data),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          model: data.model,
          provider: data.provider,
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    chatMutation.mutate({
      model: selectedModel,
      messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedModelInfo = llmModels.find((m) => m.id === selectedModel);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Chat</h1>
            <p className="text-sm text-muted-foreground">
              Chat with 600+ AI models via Poe.com API
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" /> Poe.com
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessages([])}
              disabled={messages.length === 0}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        </div>

        {/* Messages */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="flex h-full flex-col p-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold">Start a conversation</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Choose a model from the sidebar and start chatting. All models are accessed through your Poe.com API key.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.model && (
                      <p className="mt-1 text-[10px] opacity-60">
                        {message.model} via {message.provider}
                      </p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-2xl bg-muted px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder={`Message ${selectedModelInfo?.name || 'AI'}...`}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[44px] resize-none"
                />
                <Button
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  onClick={handleSend}
                  disabled={!input.trim() || chatMutation.isPending}
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Sidebar */}
      <div className="w-72 shrink-0 space-y-4">
        <h3 className="font-semibold text-sm">Select Model</h3>
        <div className="space-y-2">
          {llmModels.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => setSelectedModel(model.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                selectedModel === model.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'hover:bg-accent/50'
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${model.color} text-white text-[10px] font-bold`}>
                {model.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{model.name}</p>
                <p className="text-[11px] text-muted-foreground">{model.provider}</p>
              </div>
            </button>
          ))}
        </div>

        <Card className="border-0 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <p className="font-semibold text-sm">Powered by Poe</p>
            </div>
            <p className="text-xs text-muted-foreground">
              All models are accessed through the Poe.com API. Add your API key in the Integrations Hub.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
