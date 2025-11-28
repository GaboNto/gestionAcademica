import { Controller, Get, Query } from '@nestjs/common';
import { EstudianteService } from './estudiante.service';

@Controller('estudiante')
export class EstudianteController {
  constructor(private readonly service: EstudianteService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}

