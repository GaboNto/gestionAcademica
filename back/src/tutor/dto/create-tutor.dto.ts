import { IsArray, IsEmail, IsIn, IsNumber, IsOptional, IsString, Length } from 'class-validator';

const TIPOS_PERMITIDOS = ['Tallerista', 'Supervisor'] as const;
export type TipoTutor = (typeof TIPOS_PERMITIDOS)[number];

export class CreateTutorDto {
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

  @IsOptional() @IsString()
  universidad_egreso?: string;

  // Acepta 'tipo' (string) o 'tipos' (string[])
  @IsOptional() @IsString() @IsIn(TIPOS_PERMITIDOS as unknown as string[])
  tipo?: TipoTutor;

  @IsOptional() @IsArray()
  @IsIn(TIPOS_PERMITIDOS as unknown as string[], { each: true })
  tipos?: TipoTutor[];

  // Igual que colaborador: permitir 'cargo' o 'cargos'
  @IsOptional() @IsString()
  cargo?: string;

  @IsOptional() @IsArray()
  @IsString({ each: true })
  cargos?: string[];
}

export const TIPOS_TUTOR_PERMITIDOS = TIPOS_PERMITIDOS;

