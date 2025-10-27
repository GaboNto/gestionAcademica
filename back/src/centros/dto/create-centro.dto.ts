import { IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const TIPO_CENTRO_VALUES = ['PARTICULAR', 'PARTICULAR_SUBVENCIONADO', 'SLEP'] as const;
export type TipoCentroDTO = typeof TIPO_CENTRO_VALUES[number];

export class CreateCentroDto {
  @IsString()
  @MaxLength(200)
  @IsNotEmpty()
  nombre!: string;

  // Validamos contra los 3 valores válidos del enum de Prisma
  @IsString()
  @IsIn(TIPO_CENTRO_VALUES)
  tipo!: TipoCentroDTO;

  @IsString()
  @IsNotEmpty()
  region!: string;

  @IsString()
  @IsNotEmpty()
  comuna!: string;

  @IsOptional() @IsString()
  convenio?: string | null;

  @IsOptional() @IsString()
  direccion?: string | null;

  // nombre_calle / numero_calle en BD
  @IsOptional() @IsString()
  nombre_calle?: string | null;

  @IsOptional()
  numero_calle?: number | null;

  @IsOptional()
  telefono?: number | null;

  @IsOptional()
  correo?: string | null;

  @IsOptional() @IsString()
  url_rrss?: string | null;
}
