import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { EstudianteService } from './estudiante.service';
import { QueryEstudianteDto } from './dto/query-estudiante.dto';

@Controller('estudiante')
export class EstudianteController {
  constructor(private readonly service: EstudianteService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  findAll(@Query() q: QueryEstudianteDto) {
    return this.service.findAll(q);
  }

  @Get(':rut')
  findOne(@Param('rut') rut: string) {
    return this.service.findOne(rut);
  }
}
