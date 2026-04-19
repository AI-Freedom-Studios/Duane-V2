import { Module } from '@nestjs/common';
import { Json2VideoController } from './json2video.controller';
import { Json2VideoService } from './json2video.service';

@Module({
  controllers: [Json2VideoController],
  providers: [Json2VideoService],
})
export class Json2VideoModule {}
