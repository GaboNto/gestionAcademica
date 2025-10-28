import { Module } from '@nestjs/common';
import { CentrosService } from './centros.service';
import { CentrosController } from './centros.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CentrosController],
  providers: [CentrosService],
  exports: [CentrosService],
})
export class CentrosModule {}
