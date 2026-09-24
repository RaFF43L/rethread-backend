import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: string;
}

// Returns the service liveness status. Trivial today, but kept as a use case so
// the health check can later aggregate dependency probes without touching HTTP.
@Injectable()
export class GetHealthStatusUseCase {
  execute(): HealthStatus {
    return { status: 'ok' };
  }
}
