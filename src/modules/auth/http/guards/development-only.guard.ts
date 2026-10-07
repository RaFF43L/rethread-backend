import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Hides development helpers in production by answering as if the route did not exist.
@Injectable()
export class DevelopmentOnlyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(): boolean {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new NotFoundException();
    }
    return true;
  }
}
