import { Module } from '@nestjs/common';
import { ActividadPracticaController } from './actividad-practica.controller';
import { ActividadPracticaService } from './actividad-practica.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ActividadPracticaController],
  providers: [ActividadPracticaService],
})
export class ActividadPracticaModule {}
