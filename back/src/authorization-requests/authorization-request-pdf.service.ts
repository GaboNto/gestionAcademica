import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as Handlebars from 'handlebars';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import puppeteer from 'puppeteer';
import { PrismaService } from 'prisma/prisma.service';


dayjs.locale('es');

@Injectable()
export class AuthorizationRequestPdfService {
  constructor(private prisma: PrismaService) {}

  private async compile(templatePath: string, data: any) {
    const tpl = await fs.readFile(templatePath, 'utf8');
    const template = Handlebars.compile(tpl);
    return template(data);
  }

  async generatePdf(id: number): Promise<{ filename: string; buffer: Buffer }> {
    const req = await this.prisma.authorizationRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Solicitud no encontrada');

    // Validación de campos requeridos
    const required = [
      req.refTitle, req.city, req.letterDate, req.addresseeName, req.addresseeRole,
      req.institution, req.institutionAddr, req.practiceType, req.periodStart, req.periodEnd, req.degree
    ];
    if (required.some(v => !v)) {
      throw new InternalServerErrorException('Faltan datos requeridos para generar la solicitud.');
    }

    // Asegurar arreglo de estudiantes desde JSON
    const studentsJson: any[] = Array.isArray((req as any).studentsJson) ? (req as any).studentsJson : [];

    const letterDate = dayjs(req.letterDate).format('D [de] MMMM [de] YYYY').toUpperCase();
    const periodStr = `${dayjs(req.periodStart).format('DD/MM/YYYY')} al ${dayjs(req.periodEnd).format('DD/MM/YYYY')}`;
    const students = studentsJson.map(s => `• ${s.name}, Rut. ${s.rut}`);

    // Nombre de archivo: usar el primer estudiante (limpiando viñeta y coma)
    const baseName = students.length ? students[0].replace(/^•\s*/, '').split(',')[0] : 'estudiante';
    const slugName = baseName
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim().replace(/\s+/g, '-')
      .toLowerCase();
    const yyyymmdd = dayjs(req.letterDate).format('YYYYMMDD');
    const filename = `solicitud_autorizacion_${slugName}_${yyyymmdd}.pdf`;

    // OJO: __dirname apunta a dist/authorization-requests en build.
    // Asegúrate de copiar templates al dist o ajusta el path si usas ts-node.
    const templatePath = path.join(__dirname, 'templates', 'authorization-request.hbs');

    const html = await this.compile(templatePath, {
      code: req.code ?? '',
      refTitle: req.refTitle,
      city: req.city,
      letterDate,
      addresseeName: req.addresseeName,
      addresseeRole: req.addresseeRole,
      institution: req.institution,
      institutionAddr: req.institutionAddr,
      practiceType: req.practiceType,
      periodStr,
      tutorName: req.tutorName,
      tutorPhone: req.tutorPhone,
      students,
      comments: req.comments,
      signer: 'Dr. IGNACIO JARA PARRA',
      signerRole: 'Jefe de Carrera\nPedagogía en Historia y Geografía',
      attachments: [
        'Estructura detallada de la práctica',
        'Ficha de Registro del Profesor en Práctica',
        'Ficha de Seguro Escolar (DL 16.774)',
        'Carta Rol del Profesor Colaborador'
      ],
    });

    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '25mm' },
      });

      await browser.close();

      const buffer = Buffer.from(pdfBytes);
      return { filename, buffer };
    } catch {
      throw new InternalServerErrorException('No se pudo generar el documento. Intente nuevamente.');
    }
  }
}
