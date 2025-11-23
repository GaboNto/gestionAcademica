import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ActividadPracticaService } from './actividad-practica.service';
import { CreateActividadPracticaDto } from './dto/crear-act-practica.dto';
import { UpdateActividadPracticaDto } from './dto/actualizar-act-practica.dto';
import { QueryActividadPracticaDto } from './dto/consulta-act-practica.dto';

@Controller('actividad-practica')
export class ActividadPracticaController {
  constructor(private readonly service: ActividadPracticaService) {}

  @Post()
  create(@Body() dto: CreateActividadPracticaDto) {
    // Si falta campo obligatorio, el ValidationPipe lanza 400.
    // En el front puedes mostrar: "Debe completar todos los campos requeridos."
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() q: QueryActividadPracticaDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateActividadPracticaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
