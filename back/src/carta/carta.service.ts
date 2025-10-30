// src/carta/carta.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';

export interface GenerarParams {
  studentRut: string;
  centerId: number;
  supervisorId: number;
  inicio: string; // YYYY-MM-DD
  fin: string;    // YYYY-MM-DD
}

@Injectable()
export class CartaService {
  constructor(private readonly prisma: PrismaService) {
    dayjs.locale('es');
  }

  // Cargar archivo .hbs desde /src/carta/templates
  private async loadTemplate(name: string): Promise<string> {
    const file = path.resolve(__dirname, 'templates', `${name}.hbs`);
    return fs.readFile(file, 'utf8');
  }

  async generar(params: GenerarParams): Promise<{ filename: string; buffer: Uint8Array; folio: number }> {
    const { studentRut, centerId, supervisorId, inicio, fin } = params;

    // 1) Validaciones / datos base
    const estudiante = await this.prisma.estudiante.findUnique({ where: { rut: studentRut } });
    if (!estudiante) throw new NotFoundException('Estudiante no encontrado');

    const centro = await this.prisma.centroEducativo.findUnique({ where: { id: Number(centerId) } });
    if (!centro) throw new NotFoundException('Centro educativo no encontrado');

    const supervisor = await this.prisma.colaborador.findUnique({ where: { id: Number(supervisorId) } });
    if (!supervisor) throw new NotFoundException('Supervisor no encontrado');

    const ini = dayjs(inicio, 'YYYY-MM-DD', true);
    const finD = dayjs(fin, 'YYYY-MM-DD', true);
    if (!ini.isValid() || !finD.isValid() || finD.isBefore(ini)) {
      throw new BadRequestException('Fechas inválidas');
    }

    // 2) Folio = siguiente numero_folio + registro (NO usamos cartafolio)
    const folio = await this.prisma.$transaction(async (tx) => {
      // lee el máximo actual y calcula el siguiente
      const agg = await tx.cartaSolicitud.aggregate({ _max: { numero_folio: true } });
      const next = (agg._max.numero_folio ?? 0) + 1;

      await tx.cartaSolicitud.create({
        data: {
          numero_folio: next,        // tu schema ya lo tiene como Int
          fecha: new Date(),
          direccion_emisor: '',
          url_archivo: '',
        },
      });

      return next;
    });

    // 3) Render con Handlebars (usando /src/carta/templates/carta.hbs)
    const tpl = await this.loadTemplate('carta');
    const compile = Handlebars.compile(tpl);

    const html = compile({
      folio,
      hoy: dayjs().format('DD/MM/YYYY'),
      estudiante: { nombre: estudiante.nombre, rut: estudiante.rut },
      centro: { nombre: centro.nombre },
      supervisor: { nombre: supervisor.nombre },
      periodo: { inicio: ini.format('DD/MM/YYYY'), fin: finD.format('DD/MM/YYYY') },
    });

    // 4) Generar PDF (Uint8Array)
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm' },
      });

      return { filename: `carta-${folio}.pdf`, buffer: pdfBytes, folio };
    } finally {
      await browser.close();
    }
  }
}
