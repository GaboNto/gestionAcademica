import { IsArray, IsEmail, IsNumber, IsOptional, IsString, Length } from 'class-validator';
import { IsRut } from 'src/validador/rut.validador';


export class CreateTutorDto {
  @IsString()
  @Length(3, 20)
  @IsRut({ message: 'El RUT no es válido' })
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

  // Igual que colaborador: permitir 'cargo' o 'cargos'
  @IsOptional() @IsString()
  cargo?: string;

  @IsOptional() @IsArray()
  @IsString({ each: true })
  cargos?: string[];
}
