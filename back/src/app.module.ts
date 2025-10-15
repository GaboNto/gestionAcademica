import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'prisma/prisma.module';
import { ColaboradoresModule } from './colaboradores/colaboradores.module';

@Module({
  imports: [PrismaModule, ColaboradoresModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
