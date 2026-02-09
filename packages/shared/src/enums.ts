export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum ProviderCategory {
  LLM = 'LLM',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  MULTIMODAL = 'MULTIMODAL',
  AGGREGATOR = 'AGGREGATOR',
}

export enum ProviderSlug {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  MISTRAL = 'mistral',
  COHERE = 'cohere',
  RUNWAY = 'runway',
  REPLICATE = 'replicate',
  STABILITY = 'stability',
  PIKA = 'pika',
  HEYGEN = 'heygen',
  ELEVENLABS = 'elevenlabs',
  POE = 'poe',
  GENERIC_HTTP = 'generic_http',
}

export enum SocialPlatform {
  META = 'meta',
  YOUTUBE = 'youtube',
  LINKEDIN = 'linkedin',
  TIKTOK = 'tiktok',
  X = 'x',
}

export enum AdsPlatform {
  GOOGLE_ADS = 'google_ads',
  META_ADS = 'meta_ads',
  LINKEDIN_ADS = 'linkedin_ads',
  TIKTOK_ADS = 'tiktok_ads',
  X_ADS = 'x_ads',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHING = 'PUBLISHING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum AuditAction {
  USER_REGISTER = 'USER_REGISTER',
  USER_LOGIN = 'USER_LOGIN',
  PROVIDER_KEY_ADD = 'PROVIDER_KEY_ADD',
  PROVIDER_KEY_UPDATE = 'PROVIDER_KEY_UPDATE',
  PROVIDER_KEY_DELETE = 'PROVIDER_KEY_DELETE',
  PROVIDER_KEY_TEST = 'PROVIDER_KEY_TEST',
  OAUTH_CONNECT = 'OAUTH_CONNECT',
  OAUTH_DISCONNECT = 'OAUTH_DISCONNECT',
  POST_CREATE = 'POST_CREATE',
  POST_SCHEDULE = 'POST_SCHEDULE',
  POST_PUBLISH = 'POST_PUBLISH',
  TASK_CREATE = 'TASK_CREATE',
  TASK_ASSIGN = 'TASK_ASSIGN',
  AGENT_CREATE = 'AGENT_CREATE',
  AGENT_UPDATE = 'AGENT_UPDATE',
}
