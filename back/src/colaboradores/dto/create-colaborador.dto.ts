import { IsEmail, IsNumber, IsOptional, IsString, Length, IsArray } from 'class-validator';

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

  @IsOptional() @IsString()
  cargo?: string;

  // Nuevo: permitir múltiples cargos
  @IsOptional() @IsArray()
  @IsString({ each: true })
  cargos?: string[];

  @IsOptional() @IsString()
  universidad_egreso?: string;
}
