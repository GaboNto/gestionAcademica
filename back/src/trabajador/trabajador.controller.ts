import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateTrabajadorDto } from './dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto';
import { TrabajadoresService } from './trabajador.service';

@Controller('trabajadores')
export class TrabajadoresController {
  constructor(private readonly service: TrabajadoresService) {}

  @Post()
  create(@Body() dto: CreateTrabajadorDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe
  ) id: number, @Body() dto: UpdateTrabajadorDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
