import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { DatabaseModule } from './database/database.module';
import { ErrorHandlerFilter } from './common/filters/error-handler.filter';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, AuthModule, ProductsModule],
  providers: [{ provide: APP_FILTER, useClass: ErrorHandlerFilter }],
})
export class AppModule {}
