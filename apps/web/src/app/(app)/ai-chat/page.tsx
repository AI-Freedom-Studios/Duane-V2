'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  BrainCircuit,
  ShieldCheck,
  Wand2,
  ArrowUpRight,
  Clock3,
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
  { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'Anthropic', color: 'bg-orange-500' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', color: 'bg-blue-500' },
  { id: 'Llama-3.3-70B', name: 'Llama 3.3 70B', provider: 'Meta', color: 'bg-purple-500' },
  { id: 'DeepSeek-R1', name: 'DeepSeek R1', provider: 'DeepSeek', color: 'bg-indigo-500' },
  { id: 'Qwen-2.5-7B-T', name: 'Qwen 2.5 7B', provider: 'Alibaba', color: 'bg-red-500' },
];

const quickPrompts = [
  'Write a launch announcement for our new AI feature.',
  'Summarize today’s task progress into a founder update.',
  'Brainstorm 5 social post hooks for a product teaser.',
  'Turn a rough feature idea into a concise PRD outline.',
];

const AI_CHAT_MODEL_STORAGE_KEY = 'agentos-ai-chat-selected-model';

export default function AiChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const savedModel = window.localStorage.getItem(AI_CHAT_MODEL_STORAGE_KEY);
    if (!savedModel) return;

    const normalizedSavedModel =
      savedModel === 'deepseek-v3' || savedModel === 'DeepSeek-V3'
        ? 'DeepSeek-R1'
        : savedModel === 'claude-3.5-sonnet' || savedModel === 'Claude-Sonnet-4.5'
          ? 'claude-sonnet-4.5'
        : savedModel === 'llama-3.1-405b' || savedModel === 'Llama-3.1-405B'
            ? 'Llama-3.3-70B'
            : savedModel === 'mixtral-8x22b' || savedModel === 'mixtral8x22b-inst-fw' || savedModel === 'Mixtral8x22b-Inst-FW'
              ? 'gpt-4o'
              : savedModel === 'qwen-2.5-72b' || savedModel === 'Qwen-2.5-72B-T' || savedModel === 'Qwen3-32B-CS'
                ? 'Qwen-2.5-7B-T'
                : savedModel === 'command-r-plus' || savedModel === 'Command-R-Plus' || savedModel === 'Command-R' || savedModel === 'Aya-Expanse-32B'
                  ? 'gpt-4o'
                  : savedModel;
    if (llmModels.some((model) => model.id === normalizedSavedModel)) {
      setSelectedModel(normalizedSavedModel);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(AI_CHAT_MODEL_STORAGE_KEY, selectedModel);
  }, [selectedModel]);

  const chatMutation = useMutation({
    mutationFn: (data: { model: string; messages: Array<{ role: string; content: string }> }) =>
      api.post<{ content: string; model: string; provider: string }>('/poe/chat', data),
    onSuccess: (data) => {
      setChatError(null);
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
    onError: (error) => {
      setChatError(error instanceof Error ? error.message : 'Chat failed');
    },
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    setChatError(null);

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
      messages: updatedMessages.map((message) => ({ role: message.role, content: message.content })),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptFast = () => {
    setInput(quickPrompts[0]);
    requestAnimationFrame(() => composerRef.current?.focus());
  };

  const handleStayGrounded = () => {
    router.push('/integrations');
  };

  const selectedModelInfo = llmModels.find((model) => model.id === selectedModel);
  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant');
  const messageCount = messages.length;

  return (
    <div className="grid min-h-[calc(100vh-8rem)] gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="flex min-h-0 flex-col space-y-4">
        <div className="surface-glow overflow-hidden rounded-[2rem] border border-white/70 bg-white/75">
          <div className="relative overflow-hidden rounded-[2rem] p-6 sm:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(168,85,247,0.14),_transparent_24%),linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(248,250,252,0.82))]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  Prompt Studio
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">AI Chat Workspace</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Switch between flagship models, compare answers, and shape better prompts from one focused command surface powered by Poe.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/80 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Current model</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{selectedModelInfo?.name}</p>
                  <p className="text-xs text-slate-500">{selectedModelInfo?.provider}</p>
                </div>
                <div className="rounded-3xl border border-white/80 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Messages</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{messageCount}</p>
                  <p className="text-xs text-slate-500">Conversation turns in this session</p>
                </div>
                <div className="rounded-3xl border border-white/80 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Provider</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">Poe</p>
                  <p className="text-xs text-slate-500">Unified access layer</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setInput(prompt)}
                className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-left text-sm text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 rounded-full border-slate-200 bg-white/80 px-3 py-1 text-slate-600">
              <Zap className="h-3 w-3" /> Poe.com
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessages([])}
              disabled={messages.length === 0}
              className="rounded-full bg-white/80"
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        </div>

        <Card className="surface-glow flex min-h-0 flex-1 overflow-hidden border-white/70 bg-white/80">
          <CardContent className="flex h-full min-h-0 flex-col p-0">
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Conversation canvas</p>
                <p className="text-xs text-slate-500">
                  {selectedModelInfo?.name} is active. Shift+Enter adds a new line.
                </p>
              </div>
              {lastAssistantMessage && (
                <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                  <Clock3 className="h-3 w-3" />
                  Last reply at {lastAssistantMessage.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </Badge>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chatError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {chatError}
                </div>
              )}

              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-xl text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 shadow-lg">
                      <Sparkles className="h-9 w-9 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-950">Start a smarter conversation</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
                      Pick a model, drop in one of the quick prompts, and use the workspace to compare responses, refine wording, or draft production-ready copy.
                    </p>
                    <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={handlePromptFast}
                        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:border-violet-200 hover:bg-white"
                      >
                        <Wand2 className="h-5 w-5 text-violet-600" />
                        <p className="mt-3 text-sm font-semibold text-slate-900">Prompt fast</p>
                        <p className="mt-1 text-xs leading-6 text-slate-500">Use prebuilt starters to avoid blank-page friction.</p>
                        <p className="mt-3 text-xs font-semibold text-violet-700">Loads a starter into the composer</p>
                      </button>
                      <button
                        type="button"
                        onClick={handleStayGrounded}
                        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:border-emerald-200 hover:bg-white"
                      >
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        <p className="mt-3 text-sm font-semibold text-slate-900">Stay grounded</p>
                        <p className="mt-1 text-xs leading-6 text-slate-500">Everything routes through your Poe API integration.</p>
                        <p className="mt-3 text-xs font-semibold text-emerald-700">Opens Integrations so you can manage Poe access</p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => {
                const isUser = message.role === 'user';

                return (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${isUser ? 'justify-end' : ''}`}
                  >
                    {!isUser && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] rounded-[1.5rem] px-4 py-4 sm:px-5 ${
                        isUser
                          ? 'bg-slate-950 text-white shadow-sm'
                          : 'border border-slate-200 bg-slate-50/90 text-slate-900'
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em]">
                        <span className={isUser ? 'text-slate-300' : 'text-slate-500'}>
                          {isUser ? 'You' : message.provider || 'Assistant'}
                        </span>
                        {!isUser && message.model && (
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-slate-500">
                            {message.model}
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
                      <p className={`mt-3 text-[11px] ${isUser ? 'text-slate-400' : 'text-slate-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>

                    {isUser && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                );
              })}

              {chatMutation.isPending && (
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                      <span className="text-sm text-slate-500">
                        Thinking with {selectedModelInfo?.name}...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-200/80 p-4 sm:p-5">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-sm">
                <Textarea
                  placeholder={`Message ${selectedModelInfo?.name || 'AI'}...`}
                  rows={1}
                  ref={composerRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[56px] resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0"
                />
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-0.5">
                      {selectedModelInfo?.provider}
                    </Badge>
                    <span>Enter to send</span>
                    <span className="text-slate-300">•</span>
                    <span>Shift+Enter for new line</span>
                  </div>
                  <Button
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-2xl"
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
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <Card className="surface-glow overflow-hidden border-white/70 bg-white/80">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected engine</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">{selectedModelInfo?.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedModelInfo?.provider}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${selectedModelInfo?.color || 'bg-slate-500'} text-sm font-bold text-white`}>
                {selectedModelInfo?.name.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Session turns</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{messageCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Best for</p>
                <p className="mt-2 text-sm font-medium text-slate-950">Reasoning and drafting</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Routing</p>
                <p className="mt-2 text-sm font-medium text-slate-950">Poe aggregation layer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Model Browser</h3>
            <Badge variant="outline" className="rounded-full border-slate-200 bg-white/80 px-3 py-1 text-slate-600">
              {llmModels.length} models
            </Badge>
          </div>
          <div className="space-y-2">
            {llmModels.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedModel(model.id)}
                className={`surface-glow flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                  selectedModel === model.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-white/70 bg-white/80 hover:-translate-y-0.5 hover:bg-white'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${model.color} text-[10px] font-bold text-white`}>
                  {model.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-slate-950">{model.name}</p>
                  <p className="text-xs text-slate-500">{model.provider}</p>
                </div>
                {selectedModel === model.id && (
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden border-0 bg-gradient-to-br from-violet-100 via-white to-cyan-100">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/80 text-violet-600">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-950">Powered by Poe</p>
                <p className="text-xs text-slate-500">Unified model access</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              All models route through the Poe.com API. Add or test your Poe key in the Integrations Hub to keep chat available.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
