import { IsEnum, IsInt, IsOptional, IsPositive, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoPractica } from './crear-practica.dto';

export class ConsultasJefaturaDto {
  @IsOptional() @IsEnum(EstadoPractica)
  estado?: EstadoPractica;

  @IsOptional() @IsString()
  tipo?: string;

  @IsOptional() @IsString()
  q?: string; // busca por nombre estudiante/centro/colaborador

  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  centroId?: number;

  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  colaboradorId?: number;

  @IsOptional() @IsString()
  from?: string; // filtra fecha_inicio >= from

  @IsOptional() @IsString()
  to?: string;   // filtra fecha_inicio <= to

  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  page?: number; 

  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  pageSize?: number; 

  @IsOptional() @IsString() @IsIn(['fecha_inicio','createdAt','updatedAt','estado','tipo'])
  sortBy?: 'fecha_inicio' | 'createdAt' | 'updatedAt' | 'estado' | 'tipo';

  @IsOptional() @IsString() @IsIn(['asc','desc'])
  sortOrder?: 'asc' | 'desc';
}
