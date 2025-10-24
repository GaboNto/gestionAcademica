import { Controller, Get, Param, ParseIntPipe, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthorizationRequestPdfService } from './authorization-request-pdf.service';

@Controller('api/authorization-requests')
export class AuthorizationRequestPdfController {
  constructor(private pdf: AuthorizationRequestPdfService) {}

  @Get(':id/pdf')
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      const { filename, buffer } = await this.pdf.generatePdf(id);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
      return res.send(buffer);
    } catch (e: any) {
      if (String(e.message).includes('Faltan datos')) {
        return res.status(400).json({ message: 'Faltan datos requeridos para generar la solicitud.' });
      }
      return res.status(500).json({ message: 'No se pudo generar el documento. Intente nuevamente.' });
    }
  }
}
