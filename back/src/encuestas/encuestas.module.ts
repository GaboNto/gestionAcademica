import { Module } from '@nestjs/common';
import { EncuestasController } from './encuestas.controller';
import { EncuestasService } from './encuestas.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [EncuestasController],
  providers: [EncuestasService, PrismaService],
  exports: [EncuestasService],
})
export class EncuestasModule {}
