import { TipoColaborador } from '@prisma/client';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class CreateColaboradorDto {
  @IsString()
  @Length(3, 20)
  rut: string;

  @IsString()
  @Length(3, 120)
  nombre: string;

  @IsOptional() @IsEmail()
  correo?: string;

  @IsOptional() @IsString()
  direccion?: string;

  @IsOptional() @IsNumber()
  telefono?: number;

  @IsOptional() @IsEnum(TipoColaborador)
  tipo?: TipoColaborador; // COLABORADOR | Supervisor | TALLERISTA

  @IsOptional() @IsString()
  cargo?: string;

  @IsOptional() @IsString()
  universidad_egreso?: string;
}
