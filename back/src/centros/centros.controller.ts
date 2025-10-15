import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CentrosService } from './centros.service';
import { CreateCentroDto } from './dto/create-centro.dto';
import { UpdateCentroDto } from './dto/update-centro.dto';
import { QueryCentroDto } from './dto/query-centro.dto';

@Controller('centros')
export class CentrosController {
  constructor(private readonly service: CentrosService) {}

  @Post()
  create(@Body() dto: CreateCentroDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() q: QueryCentroDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCentroDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
