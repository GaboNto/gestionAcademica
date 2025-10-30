// src/carta/carta.controller.ts
import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CartaService } from './carta.service';

@Controller('api')
export class CartaController {
  constructor(private carta: CartaService) {}

  @Get('carta')
  async descargar(
    @Query('studentRut') studentRut: string,
    @Query('centerId') centerId: string,
    @Query('supervisorId') supervisorId: string,
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Res() res: Response,
  ) {
    const { filename, buffer } = await this.carta.generar({
      studentRut,
      centerId: Number(centerId),
      supervisorId: Number(supervisorId),
      inicio,
      fin,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    // buffer es Uint8Array → lo convertimos a Buffer
    return res.end(Buffer.from(buffer));
  }
}
