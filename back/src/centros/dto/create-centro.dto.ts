import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { TipoCentro } from '@prisma/client';

export class CreateCentroDto {
  @IsString()
  @Length(3, 160)
  nombre: string;

  @IsOptional() @IsString()
  region?: string;

  @IsOptional() @IsString()
  comuna?: string;

  @IsOptional() @IsString()
  direccion?: string;

  @IsOptional() @IsString()
  nombre_calle?: string;

  @IsOptional() @IsInt()
  numero_calle?: number;

  @IsOptional()
  telefono?: number; // tu esquema actual lo tiene como Int?

  @IsOptional() @IsEmail()
  correo?: string;

  @IsOptional() @IsEnum(TipoCentro)
  tipo?: TipoCentro; // PARTICULAR | PARTICULAR_SUBVENCIONADO | SLEP

  @IsOptional() @IsString()
  convenio?: string;

  @IsOptional() @IsString()
  url_rrss?: string;
}
