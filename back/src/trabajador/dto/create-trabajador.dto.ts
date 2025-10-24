import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateTrabajadorDto {
  @IsString()
  @Length(3, 20)
  rut: string; // único según tu schema

  @IsString()
  @Length(3, 120)
  nombre: string;

  @IsOptional() @IsString()
  rol?: string;

  @IsOptional() @IsEmail()
  correo?: string;

  // Si mantienes Int en Prisma, usa IsInt; si cambias a String en Prisma, cámbialo por IsString aquí
  @IsOptional() @IsInt()
  telefono?: number;

  // ← OBLIGATORIO: debe existir el centro
  @IsNotEmpty() @IsInt()
  centroId: number;
}
