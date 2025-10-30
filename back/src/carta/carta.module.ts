import { Module } from '@nestjs/common';
import { CartaController } from './carta.controller';
import { CartaService } from './carta.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [CartaController],
  providers: [CartaService, PrismaService],
})
export class CartaModule {}
