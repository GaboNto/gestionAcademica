import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateActividadPracticaDto {
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(200)
  titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  descripcion: string;

  @IsString()
  @IsNotEmpty({ message: 'Debe indicar el tallerista asociado' })
  tallerista: string; // se guarda como string en "horario"

  @IsString()
  @IsNotEmpty({ message: 'Debe indicar el estudiante asociado' })
  estudiante: string; // se guarda como string en "estudiantes"
  
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener un formato válido (YYYY-MM-DD)' })
  fechaRegistro?: string;

  @IsString()
  @IsNotEmpty({ message: 'Debe indicar el estado de la actividad' })
  estado: string; // "PENDIENTE" | "APROBADA" | "OBSERVADA"

  @IsOptional()
  @IsString()
  evidenciaUrl?: string; // ruta/URL del archivo (PDF/PNG)
}
