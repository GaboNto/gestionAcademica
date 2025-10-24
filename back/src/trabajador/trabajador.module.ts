import { Module } from '@nestjs/common';
import { TrabajadoresController } from './trabajador.controller';
import { TrabajadoresService } from './trabajador.service';

@Module({
  providers: [TrabajadoresService],
  controllers: [TrabajadoresController]
})
export class TrabajadorModule {}
