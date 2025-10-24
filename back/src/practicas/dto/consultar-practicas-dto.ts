import { IsEnum, IsOptional } from 'class-validator';
import { EstadoPractica } from './crear-practica.dto';

export class ConsultasPracticasDto {
  @IsOptional() @IsEnum(EstadoPractica)
  estado?: EstadoPractica;

  @IsOptional()
  estudianteRut?: string;
}
