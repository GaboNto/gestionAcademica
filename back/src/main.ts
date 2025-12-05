import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  const rootPath = process.cwd();
  const uploadsPath = join(rootPath, 'uploads');
  const clientPath = join(rootPath, 'public');

  // Servir uploads
  app.useStaticAssets(uploadsPath, { prefix: '/uploads' });

  // Servir frontend Angular
  app.useStaticAssets(clientPath);

  // Fallback SOLO para rutas que no sean API (y solo GET)
  app.use((req, res, next) => {
    const url = req.url;

    // Si NO es GET, que lo maneje Nest (POST, PUT, DELETE, etc.)
    if (req.method !== 'GET') {
      return next();
    }

    // Rutas de API que NO debemos interceptar
    if (
      url.startsWith('/api') ||
      url.startsWith('/centros') ||
      url.startsWith('/trabajadores') ||
      url.startsWith('/practicas') ||
      url.startsWith('/estudiante') ||
      url.startsWith('/colaboradores') ||
      url.startsWith('/tutores') ||
      url.startsWith('/encuestas') ||
      url.startsWith('/actividad-practica') ||
      url.startsWith('/uploads')
    ) {
      return next();
    }

    // Para el resto (rutas de Angular), servir index.html
    return res.sendFile(join(clientPath, 'index.html'));
  });

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
