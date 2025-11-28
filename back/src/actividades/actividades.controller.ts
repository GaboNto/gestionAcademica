import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ActividadesService, ActividadCarrera, type PagedResult } from './actividades.service';
import { QueryActividadesDto } from './dto/query-actividades.dto';

@Controller('actividades')
export class ActividadesController {
  constructor(private readonly service: ActividadesService) {}

  @Get()
  list(@Query() query: QueryActividadesDto): PagedResult<ActividadCarrera> {
    return this.service.list(query);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }
}
