import { PartialType } from '@nestjs/mapped-types';
import { CreateActividadPracticaDto } from './crear-act-practica.dto';

export class UpdateActividadPracticaDto extends PartialType(CreateActividadPracticaDto) {}
