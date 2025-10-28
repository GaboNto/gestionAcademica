import { Module } from '@nestjs/common';
import { PracticasController } from './practicas.controller';
import { PracticasService } from './practicas.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PracticasController],
  providers: [PracticasService]
})
export class PracticasModule {}
