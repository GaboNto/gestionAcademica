import { Module } from '@nestjs/common';
import { CentrosService } from './centros.service';
import { CentrosController } from './centros.controller';

@Module({
  controllers: [CentrosController],
  providers: [CentrosService],
  exports: [CentrosService],
})
export class CentrosModule {}
