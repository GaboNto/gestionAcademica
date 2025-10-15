import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'prisma/prisma.module';
import { ColaboradoresModule } from './colaboradores/colaboradores.module';
import { CentrosModule } from './centros/centros.module';
import { TrabajadorModule } from './trabajador/trabajador.module';

@Module({
  imports: [PrismaModule, ColaboradoresModule, CentrosModule, TrabajadorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
