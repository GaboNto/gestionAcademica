import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryTutorDto {

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

