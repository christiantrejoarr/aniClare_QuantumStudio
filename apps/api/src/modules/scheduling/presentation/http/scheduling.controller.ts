import { Controller, Get } from '@nestjs/common';
import { SchedulingFacade } from '../../public/scheduling-facade';

@Controller('therapists')
export class SchedulingController {
  constructor(private readonly scheduling: SchedulingFacade) {}

  @Get()
  list() {
    return this.scheduling.list();
  }
}
