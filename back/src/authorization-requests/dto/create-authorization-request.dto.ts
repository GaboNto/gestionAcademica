import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

class StudentDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() rut!: string;
}

export class CreateAuthorizationRequestDto {
  @IsString() @IsNotEmpty() refTitle!: string;
  @IsString() @IsNotEmpty() city!: string;
  @IsDateString() letterDate!: string;
  @IsString() @IsNotEmpty() addresseeName!: string;
  @IsString() @IsNotEmpty() addresseeRole!: string;
  @IsString() @IsNotEmpty() institution!: string;
  @IsString() @IsNotEmpty() institutionAddr!: string;
  @IsString() @IsNotEmpty() practiceType!: string;
  @IsDateString() periodStart!: string;
  @IsDateString() periodEnd!: string;
  @IsString() @IsNotEmpty() degree!: string;
  @IsOptional() @IsString() comments?: string;

  @IsOptional() @IsString() tutorName?: string;
  @IsOptional() @IsString() tutorPhone?: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => StudentDto)
  students!: StudentDto[];
}
