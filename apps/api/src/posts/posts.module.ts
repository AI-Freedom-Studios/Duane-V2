import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostProcessor } from './post.processor';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'posts' }),
    AuditModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostProcessor],
  exports: [PostsService],
})
export class PostsModule {}
