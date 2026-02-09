import type { UserRole, ProviderCategory, ProviderSlug, SocialPlatform, PostStatus, TaskStatus } from './enums';

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserDTO;
}

export interface ProviderDefinition {
  slug: ProviderSlug;
  name: string;
  category: ProviderCategory;
  description: string;
  website: string;
  requiredFields: string[];
  testEndpoint?: string;
}

export interface ProviderKeyDTO {
  id: string;
  providerSlug: ProviderSlug;
  label: string;
  lastTestedAt: string | null;
  lastTestStatus: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialAccountDTO {
  id: string;
  platform: SocialPlatform;
  platformAccountId: string;
  accountName: string;
  accountAvatar?: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

export interface PostDTO {
  id: string;
  content: string;
  mediaUrls: string[];
  status: PostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  targetAccounts: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentDTO {
  id: string;
  name: string;
  role: string;
  description: string;
  promptTemplate: string;
  tools: string[];
  isOrchestrator: boolean;
  teamId: string | null;
  createdAt: string;
}

export interface TeamDTO {
  id: string;
  name: string;
  description: string;
  agents: AgentDTO[];
}

export interface TaskDTO {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedAgentId: string | null;
  assignedAgent?: AgentDTO;
  parentTaskId: string | null;
  result: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogDTO {
  id: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface JobStatusDTO {
  id: string;
  queue: string;
  status: string;
  progress: number;
  data: Record<string, unknown>;
  createdAt: string;
  finishedAt: string | null;
}
