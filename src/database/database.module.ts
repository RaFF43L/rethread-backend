import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.getOrThrow<string>('DB_HOST');
        const port = config.getOrThrow<number>('DB_PORT');
        const username = config.getOrThrow<string>('DB_USERNAME');
        const database = config.getOrThrow<string>('DB_NAME');

        console.log('Database config:', { host, port, username, database });

        return {
        type: 'postgres',
        host,
        port,
        username,
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database,
        entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
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
