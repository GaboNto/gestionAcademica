import { Module } from '@nestjs/common';
import { PracticasController } from './practicas.controller';
import { PracticasService } from './practicas.service';

@Module({
  controllers: [PracticasController],
  providers: [PracticasService]
})
export class PracticasModule {}
