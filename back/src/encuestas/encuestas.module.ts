// Módulo de NestJS que agrupa controlador, servicio y Prisma para encuestas
import { Module } from '@nestjs/common';
import { EncuestasController } from './encuestas.controller';
import { EncuestasService } from './encuestas.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  // Controlador que expone las rutas HTTP
  controllers: [EncuestasController],

  // Servicios que usa este módulo
  providers: [EncuestasService, PrismaService],

  // Permite que otros módulos utilicen EncuestasService
  exports: [EncuestasService],
})
export class EncuestasModule {}
