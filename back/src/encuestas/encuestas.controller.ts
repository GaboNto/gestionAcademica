import { Controller, Get } from '@nestjs/common';
import { EncuestasService } from './encuestas.service';

@Controller('encuestas')
export class EncuestasController {
  constructor(private readonly encuestasService: EncuestasService) {}

  @Get()
  findAll() {
    // Por ahora solo devuelve un arreglo vacío o un mensaje.
    // Luego aquí conectas con la BD si quieres persistir las encuestas.
    return this.encuestasService.findAll();
  }
}
