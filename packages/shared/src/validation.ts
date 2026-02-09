import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const providerKeyCreateSchema = z.object({
  providerSlug: z.string().min(1),
  label: z.string().min(1).max(100),
  apiKey: z.string().min(1),
  additionalFields: z.record(z.string()).optional(),
});

export const providerKeyUpdateSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  apiKey: z.string().min(1).optional(),
  additionalFields: z.record(z.string()).optional(),
});

export const postCreateSchema = z.object({
  content: z.string().min(1).max(10000),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  targetAccountIds: z.array(z.string()).min(1),
  scheduledAt: z.string().datetime().optional(),
});

export const postUpdateSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  targetAccountIds: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const agentCreateSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  description: z.string().max(2000).optional().default(''),
  promptTemplate: z.string().max(10000).optional().default(''),
  tools: z.array(z.string()).optional().default([]),
  isOrchestrator: z.boolean().optional().default(false),
  teamId: z.string().optional().nullable(),
});

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(''),
  assignedAgentId: z.string().optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProviderKeyCreateInput = z.infer<typeof providerKeyCreateSchema>;
export type ProviderKeyUpdateInput = z.infer<typeof providerKeyUpdateSchema>;
export type PostCreateInput = z.infer<typeof postCreateSchema>;
export type PostUpdateInput = z.infer<typeof postUpdateSchema>;
export type AgentCreateInput = z.infer<typeof agentCreateSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
