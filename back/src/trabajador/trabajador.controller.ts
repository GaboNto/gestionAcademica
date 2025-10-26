import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateTrabajadorDto } from './dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto';
import { TrabajadoresService } from './trabajador.service';

@Controller('trabajadores')
export class TrabajadoresController {
  constructor(private readonly service: TrabajadoresService) {}

  // LISTAR con filtros: ?centroId=&rol=&search=&page=&limit=
  @Get()
  list(
    @Query('centroId') centroId?: string,
    @Query('rol') rol?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.service.list({
      centroId: centroId ? Number(centroId) : undefined,
      rol: rol?.trim() || undefined,
      search: search?.trim() || undefined,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
  }

  @Post()
  create(@Body() dto: CreateTrabajadorDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTrabajadorDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
