import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthorizationRequestsModule } from './authorization-requests/authorization-requests.module';
import { ColaboradoresModule } from './colaboradores/colaboradores.module';
import { CentrosModule } from './centros/centros.module';
import { TrabajadorModule } from './trabajador/trabajador.module';
import { PracticasModule } from './practicas/practicas.module';
import { EstudianteModule } from './estudiante/estudiante.module';

@Module({
  imports: [PrismaModule, AuthorizationRequestsModule, ColaboradoresModule, CentrosModule, TrabajadorModule, PracticasModule, EstudianteModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
