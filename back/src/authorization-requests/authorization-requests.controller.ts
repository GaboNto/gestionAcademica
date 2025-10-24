import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { AuthorizationRequestsService } from './authorization-requests.service';
import { CreateAuthorizationRequestDto } from './dto/create-authorization-request.dto';
import { ListAuthorizationRequestsDto } from './dto/get-authorization-requests.dto';

@Controller('api/authorization-requests')
export class AuthorizationRequestsController {
  constructor(private service: AuthorizationRequestsService) {}

  @Post()
  async create(@Body() dto: CreateAuthorizationRequestDto) {
    const created = await this.service.create(dto);
    return { message: 'Solicitud registrada exitosamente.', data: created };
  }

  @Get()
  async list(@Query() query: ListAuthorizationRequestsDto) {
    const data = await this.service.findAll(query);
    return { data };
  }

  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
