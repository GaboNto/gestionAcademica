import { IsEnum } from 'class-validator';
import { EstadoPractica } from './crear-practica.dto';

export class ActualizarEstadoDto {
  @IsEnum(EstadoPractica)
  estado!: EstadoPractica;
}

