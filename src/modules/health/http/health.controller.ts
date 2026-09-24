import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { GetHealthStatusUseCase } from '../application/use-cases/get-health-status.usecase';

// Thin HTTP adapter for the health check.
@Controller('/health')
export class HealthController {
  constructor(private readonly getHealthStatus: GetHealthStatusUseCase) {}

  @Public()
  @Get()
  checkHealth() {
    return this.getHealthStatus.execute();
  }
}
