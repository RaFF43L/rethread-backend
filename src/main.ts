import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const basicAuth = require('express-basic-auth') as typeof import('express-basic-auth');
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerPassword = process.env.SWAGGER_PASSWORD;
  if (swaggerPassword) {
    app.use(
      '/docs',
      basicAuth({
        users: { admin: swaggerPassword },
        challenge: true,
      }),
    );
  }

  const config = new DocumentBuilder()
    .setTitle('Rethread API')
    .setDescription('API documentation for the Rethread backend')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
