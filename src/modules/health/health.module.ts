import { Module } from '@nestjs/common';
import { GetHealthStatusUseCase } from './application/use-cases/get-health-status.usecase';
import { HealthController } from './http/health.controller';

@Module({
  controllers: [HealthController],
  providers: [GetHealthStatusUseCase],
})
export class HealthModule {}
