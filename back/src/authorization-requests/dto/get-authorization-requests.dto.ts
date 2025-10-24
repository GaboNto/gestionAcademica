import { IsOptional, IsString } from 'class-validator';

export class ListAuthorizationRequestsDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() institution?: string;
  @IsOptional() @IsString() status?: string;
}
