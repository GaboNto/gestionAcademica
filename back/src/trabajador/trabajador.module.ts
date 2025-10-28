import { Module } from '@nestjs/common';
import { TrabajadoresController } from './trabajador.controller';
import { TrabajadoresService } from './trabajador.service';
import { PrismaModule } from 'prisma/prisma.module';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [PrismaModule],
  providers: [TrabajadoresService, PrismaService],
  controllers: [TrabajadoresController],
})
export class TrabajadorModule {}
