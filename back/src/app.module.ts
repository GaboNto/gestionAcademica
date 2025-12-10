import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

import { PrismaModule } from "../prisma/prisma.module";

import { ColaboradoresModule } from './colaboradores/colaboradores.module';
import { CentrosModule } from './centros/centros.module';
import { TrabajadorModule } from './trabajador/trabajador.module';
import { EstudianteModule } from './estudiante/estudiante.module';
import { CartaModule } from './carta/carta.module';
import { TutorModule } from './tutor/tutor.module';
import { PracticasModule } from './practicas/practicas.module';
import { ActividadPracticaModule } from './actividad-practica/actividad-practica.module';
import { ActividadesModule } from './actividades/actividades.module';
import { AuthModule } from './auth/auth.module';
import { EncuestasModule } from './encuestas/encuestas.module';

@Module({
  imports: [
    PrismaModule,             
    ColaboradoresModule,
    CentrosModule,
    TrabajadorModule,
    EstudianteModule,
    CartaModule,                 // Nuevo
    TutorModule,                 // Tutores (Supervisor / Tallerista)
    PracticasModule,             // Gestión de prácticas
<<<<<<<<< Temporary merge branch 1
    ActividadPracticaModule,
    ActividadesModule,           // Listado de actividades (solo lectura para jefatura)
=========
    EncuestasModule,
>>>>>>>>> Temporary merge branch 2
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
