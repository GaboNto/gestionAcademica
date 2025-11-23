import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class QueryActividadPracticaDto {
  // búsqueda por título, tallerista o estudiante
  @IsOptional() @IsString()
  search?: string;

  // filtro por estado (se guarda en "mes")
  @IsOptional() @IsString()
  estado?: string; // "PENDIENTE" | "APROBADA" | "OBSERVADA"

  // filtro por rango de fechas (sobre "fecha")
  @IsOptional() @IsDateString()
  fechaDesde?: string;

  @IsOptional() @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
