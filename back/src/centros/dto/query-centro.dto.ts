import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TIPO_CENTRO_VALUES } from './create-centro.dto';

export class QueryCentroDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional()
  @IsIn(TIPO_CENTRO_VALUES)
  tipo?: (typeof TIPO_CENTRO_VALUES)[number];

  @IsOptional() @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @IsInt() @Min(1)
  limit?: number = 10;

  @IsOptional() @IsString()
  orderBy?: 'nombre' | 'region' | 'comuna' = 'nombre';

  @IsOptional() @IsString()
  orderDir?: 'asc' | 'desc' = 'asc';
}
