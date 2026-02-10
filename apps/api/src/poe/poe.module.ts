import { Module } from '@nestjs/common';
import { PoeController } from './poe.controller';
import { PoeService } from './poe.service';

@Module({
  controllers: [PoeController],
  providers: [PoeService],
  exports: [PoeService],
})
export class PoeModule {}
