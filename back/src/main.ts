import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  // ============================
  // 1) TODAS LAS RUTAS TENDRÁN PREFIJO /api
  // ============================
  app.setGlobalPrefix('api');

  const rootPath = process.cwd();
  const uploadsPath = join(rootPath, 'uploads');
  const clientPath = join(rootPath, 'public');

  // ============================
  // Servir archivos subidos
  // ============================
  app.useStaticAssets(uploadsPath, { prefix: '/uploads' });

  // ============================
  // Servir Frontend Angular
  // ============================
  app.useStaticAssets(clientPath);

  // ============================
  // 2) Fallback para SPA Angular
  // ============================
  app.use((req, res, next) => {
    const url = req.url;

    // No interceptar NADA de la API
    if (url.startsWith('/api') || url.startsWith('/uploads')) {
      return next();
    }

    // Solo GET debe servir Angular (POST/PUT/DELETE → backend)
    if (req.method !== 'GET') {
      return next();
    }

    // Servir Angular index.html
    return res.sendFile(join(clientPath, 'index.html'));
  });

  // ============================
  // Validaciones globales
  // ============================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(3000, '0.0.0.0');
}

bootstrap();
