// Controlador HTTP para las encuestas (API REST para el front Angular)
import {Controller,Get,Post,Body,Param,Res,BadRequestException,Patch} from '@nestjs/common';
import { EncuestasService } from './encuestas.service';
import type { Response } from 'express';

@Controller('encuestas') // Prefijo de ruta: /encuestas
export class EncuestasController {
  constructor(private readonly encuestasService: EncuestasService) {}

  // GET http://localhost:3000/encuestas
  // Lista todas las encuestas (estudiantes + colaboradores)
  @Get()
  async findAll() {
    return this.encuestasService.findAll();
  }

  // ---------- CATÁLOGOS PARA EL FRONT ----------

  // GET http://localhost:3000/encuestas/estudiantes
  // Catálogo de estudiantes para selects
  @Get('estudiantes')
  async catalogoEstudiantes() {
    return this.encuestasService.getCatalogoEstudiantes();
  }

  // GET http://localhost:3000/encuestas/centros
  // Catálogo de centros educativos
  @Get('centros')
  async catalogoCentros() {
    return this.encuestasService.getCatalogoCentros();
  }

  // GET http://localhost:3000/encuestas/colaboradores
  // Catálogo de colaboradores/profesores
  @Get('colaboradores')
  async catalogoColaboradores() {
    return this.encuestasService.getCatalogoColaboradores();
  }

  // GET http://localhost:3000/encuestas/tutores
  // Catálogo de tutores/supervisores
  @Get('tutores')
  async catalogoTutores() {
    return this.encuestasService.getCatalogoTutores();
  }

  // ---------- DETALLE Y CREACIÓN DE ENCUESTAS ----------

  // GET http://localhost:3000/encuestas/:id
  // Devuelve una encuesta por su ID
  @Get(':id')
  async findOne(@Param('id') idParam: string) {
    const id = Number(idParam);
    if (isNaN(id)) throw new BadRequestException('ID inválido');
    return this.encuestasService.findOne(id);
  }

  // POST http://localhost:3000/encuestas
  // Crea una nueva encuesta (tipo + data)
  @Post()
  async create(@Body() payload: any) {
    return this.encuestasService.create(payload);
  }

  // GET http://localhost:3000/encuestas/export/excel
  // Genera y devuelve el Excel de encuestas de estudiantes
  @Get('export/excel')
  async exportExcel(@Res() res: Response) {
    return this.encuestasService.exportEncuestasEstudiantesExcel(res);
  }

  // PATCH http://localhost:3000/encuestas/:id/abiertas
  // Actualiza solo respuestas abiertas de una encuesta existente
  @Patch(':id/abiertas')
  async actualizarAbiertas(
    @Param('id') idParam: string,
    @Body()
    body: {
      respuestas: { preguntaId: number; respuestaAbierta: string }[];
    },
  ) {
    const id = Number(idParam);
    if (isNaN(id)) throw new BadRequestException('ID inválido');

    return this.encuestasService.actualizarRespuestasAbiertas(id, body);
  }

}
