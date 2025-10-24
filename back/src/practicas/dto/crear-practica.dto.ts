import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length } from 'class-validator';

export enum EstadoPractica {
  PENDIENTE = 'PENDIENTE',
  EN_CURSO = 'EN_CURSO',
  FINALIZADA = 'FINALIZADA',
  RECHAZADA = 'RECHAZADA',
}

export class CreatePracticaDto {
  @IsString() @IsNotEmpty() @Length(3, 20)
  estudianteRut!: string;

  @IsInt() @IsPositive()
  centroId!: number;

  @IsInt() @IsPositive()
  colaboradorId!: number;

  @IsDateString()
  fecha_inicio!: string;

  @IsOptional() @IsDateString()
  fecha_termino?: string; // se valida en service

  @IsOptional() @IsString()
  tipo?: string;

  @IsOptional() @IsEnum(EstadoPractica)
  estado?: EstadoPractica; // default = PENDIENTE
}
