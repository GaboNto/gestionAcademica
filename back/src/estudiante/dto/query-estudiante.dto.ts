import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum EstadoPracticaFiltro {
  EN_CURSO = 'EN_CURSO',
  APROBADO = 'APROBADO',
  REPROBADO = 'REPROBADO',
}

export class QueryEstudianteDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  carrera?: string;

  @IsOptional()
  @IsEnum(EstadoPracticaFiltro)
  estadoPractica?: EstadoPracticaFiltro;
}
