import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Habilitar CORS para permitir peticiones desde el frontend
  app.enableCors();

  // Servir archivos estáticos desde la carpeta uploads
  // En desarrollo: __dirname = back/src, necesitamos subir un nivel
  // En producción: __dirname = back/dist/src, necesitamos subir dos niveles
  // Usamos process.cwd() para obtener la raíz del proyecto (back/)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: false,
    transform: true,
    transformOptions: { enableImplicitConversion: true }
  }));
  await app.listen(3000);
}
bootstrap();