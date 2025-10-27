import { PartialType } from '@nestjs/mapped-types';
import { CreateCentroDto, TIPO_CENTRO_VALUES } from './create-centro.dto';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCentroDto extends PartialType(CreateCentroDto) {
  @IsOptional() @IsString() @MaxLength(200)
  override nombre?: string;

  @IsOptional()
  @IsString()
  @IsIn(TIPO_CENTRO_VALUES)
  override tipo?: (typeof TIPO_CENTRO_VALUES)[number];

  @IsOptional() @IsString()
  override region?: string;

  @IsOptional() @IsString()
  override comuna?: string;

  @IsOptional() @IsString()
  override convenio?: string | null;

  @IsOptional() @IsString()
  override direccion?: string | null;

  @IsOptional() @IsString()
  override nombre_calle?: string | null;

  @IsOptional()
  override numero_calle?: number | null;

  @IsOptional()
  override telefono?: number | null;

  @IsOptional()
  override correo?: string | null;

  @IsOptional() @IsString()
  override url_rrss?: string | null;
}
