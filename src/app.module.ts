import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './common/database/database.module';
import { AppErrorFilter } from './shared/http/app-error.filter';
import { CognitoAuthGuard } from './common/guards/cognito-auth.guard';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    DatabaseModule,
    AuthModule,
    ProductsModule,
    UsersModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AppErrorFilter },
    { provide: APP_GUARD, useClass: CognitoAuthGuard },
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
})
export class AppModule {}
