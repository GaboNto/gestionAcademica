import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { PracticasService } from './practicas.service';
import { CreatePracticaDto } from './dto/crear-practica.dto';
import { ConsultasPracticasDto } from './dto/consultar-practicas-dto';
import { ConsultasJefaturaDto } from './dto/consultar-jefatura.dto';
import { Sse } from '@nestjs/common';
import { Observable, map } from 'rxjs';


@Controller('practicas')
export class PracticasController {
  constructor(private readonly service: PracticasService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() dto: CreatePracticaDto) {
    //  - "Debe completar todos los campos requeridos." (desde el service)
    return this.service.create(dto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async list(@Query() q: ConsultasPracticasDto) {
    return this.service.list(q);
  }

  // Panel jefatura 
  @Get('jefatura')
  @UsePipes(new ValidationPipe({ transform: true }))
  async listForJefatura(@Query() q: ConsultasJefaturaDto) {
    return this.service.listForJefatura(q);
  }
  
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
  
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.service.stream$.pipe(
        map((data) => ({ data }) as MessageEvent),
    );
    }

}
