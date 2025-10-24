import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TipoColaborador } from '@prisma/client';

export class QueryColaboradorDto {
  @IsOptional() @IsEnum(TipoColaborador)
  tipo?: TipoColaborador;

  @IsOptional() @IsString()
  search?: string; // nombre|rut|correo contiene

  @IsOptional() @Transform(({value}) => parseInt(value,10)) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Transform(({value}) => parseInt(value,10)) @IsInt() @Min(1)
  limit?: number = 10;

  @IsOptional() @IsString()
  orderBy?: 'nombre' | 'createdAt' = 'nombre';

  @IsOptional() @IsString()
  orderDir?: 'asc' | 'desc' = 'asc';
}
