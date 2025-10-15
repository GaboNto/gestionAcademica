import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TipoCentro } from '@prisma/client';

export class QueryCentroDto {
  @IsOptional() @IsEnum(TipoCentro)
  tipo?: TipoCentro;

  @IsOptional() @IsString()
  search?: string; // nombre|comuna|region|correo contiene

  @IsOptional() @Transform(({value}) => parseInt(value,10)) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Transform(({value}) => parseInt(value,10)) @IsInt() @Min(1)
  limit?: number = 10;

  // Usa sólo campos que existen en tu modelo actual
  @IsOptional() @IsString()
  orderBy?: 'nombre' | 'comuna' | 'region' | 'id' = 'nombre';

  @IsOptional() @IsString()
  orderDir?: 'asc' | 'desc' = 'asc';
}
