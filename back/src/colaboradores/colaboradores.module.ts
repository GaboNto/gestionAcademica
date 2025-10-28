import { Module } from '@nestjs/common';
import { ColaboradoresController } from './colaboradores.controller';
import { ColaboradoresService } from './colaboradores.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ColaboradoresController],
  providers: [ColaboradoresService]
})
export class ColaboradoresModule {}
