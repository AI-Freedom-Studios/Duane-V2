import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProvidersModule } from './providers/providers.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { SocialModule } from './social/social.module';
import { PostsModule } from './posts/posts.module';
import { AgentsModule } from './agents/agents.module';
import { TasksModule } from './tasks/tasks.module';
import { AuditModule } from './audit/audit.module';
import { JobsModule } from './jobs/jobs.module';
import { PoeModule } from './poe/poe.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : 'localhost',
        port: process.env.REDIS_URL ? parseInt(new URL(process.env.REDIS_URL).port || '6379') : 6379,
      },
    }),
    PrismaModule,
    AuthModule,
    ProvidersModule,
    IntegrationsModule,
    SocialModule,
    PostsModule,
    AgentsModule,
    TasksModule,
    AuditModule,
    JobsModule,
    PoeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
