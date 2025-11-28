import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateActividadPracticaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la actividad es obligatorio' })
  @MaxLength(200)
  titulo: string;

  // UBICACIÓN -> opcional
  @IsOptional()
  @IsString({ message: 'La ubicación debe ser texto' })
  ubicacion?: string;

  // Horario -> opcional
  @IsOptional()
  @IsString({ message: 'El horario debe ser texto en formato HH:MM' })
  horario?: string;

  // Estudiantes -> opcional
  @IsOptional()
  @IsString({ message: 'Los estudiantes deben indicarse como texto' })
  estudiante?: string;

  // Fecha -> obligatoria
  @IsDateString({}, { message: 'La fecha debe tener un formato válido (YYYY-MM-DD)' })
  fechaRegistro: string;

  // Archivos adjuntos -> opcional
  @IsOptional()
  evidenciaUrl?: string;
}
