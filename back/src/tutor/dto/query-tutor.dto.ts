import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, IsIn } from 'class-validator';
import { TIPOS_TUTOR_PERMITIDOS } from './create-tutor.dto';

export class QueryTutorDto {
  @IsOptional() @IsString() @IsIn(TIPOS_TUTOR_PERMITIDOS as unknown as string[])
  tipo?: 'Tallerista' | 'Supervisor';

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

