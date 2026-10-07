import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.getOrThrow<string>('DATABASE_URL');
        return {
          type: 'postgres',
          url,
          entities: [
            `${__dirname}/../../modules/**/entities/*.entity{.ts,.js}`,
            `${__dirname}/../../modules/**/infra/database/typeorm/*.schema{.ts,.js}`,
          ],
          // The production image only ships compiled code, so pending migrations
          // are applied on boot instead of through the ts-node CLI.
          migrations: [`${__dirname}/migrations/*{.ts,.js}`],
          migrationsTableName: 'migrations',
          migrationsRun: config.get<string>('DB_MIGRATIONS_RUN') !== 'false',
          synchronize:
            config.get<string>('DB_SYNCHRONIZE') === 'true' ||
            config.get<string>('NODE_ENV') !== 'production',
          logging: config.get<string>('NODE_ENV') === 'development',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
