import { Module } from '@nestjs/common';
import { ActividadPracticaController } from './actividad-practica.controller';
import { ActividadPracticaService } from './actividad-practica.service';
import { PrismaModule } from 'prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      dest: './uploads/actividades', 
    }),
  ],
  controllers: [ActividadPracticaController],
  providers: [ActividadPracticaService],
})
export class ActividadPracticaModule {}
