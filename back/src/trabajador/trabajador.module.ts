import { Module } from '@nestjs/common';
import { TrabajadoresController } from './trabajador.controller';
import { TrabajadoresService } from './trabajador.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [TrabajadoresService, PrismaService],
  controllers: [TrabajadoresController],
})
export class TrabajadorModule {}
