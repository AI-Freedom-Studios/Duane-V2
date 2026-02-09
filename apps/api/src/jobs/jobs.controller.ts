import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  @Get()
  list() {
    return { data: [], message: 'Job monitoring endpoint. Connect to BullMQ dashboard for detailed view.' };
  }
}
