import { Module } from '@nestjs/common';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { ProviderRegistry } from './provider-registry';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ProvidersController],
  providers: [ProvidersService, ProviderRegistry],
  exports: [ProvidersService, ProviderRegistry],
})
export class ProvidersModule {}
