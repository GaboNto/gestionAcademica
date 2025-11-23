import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import ExcelJS from 'exceljs';
import { Response } from 'express';

export type TipoEncuesta = 'ESTUDIANTIL' | 'COLABORADORES_JEFES';

@Injectable()
export class EncuestasService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------
  //  LIST / DETAIL
  // -----------------------
  async findAll(): Promise<any[]> {
    try {
      const encEst = await this.prisma.encuestaEstudiante.findMany({
        include: {
          respuestas: { include: { pregunta: true, alternativa: true } },
          semestre: true,
        },
        orderBy: { fecha: 'desc' },
      });

      const encCol = await this.prisma.encuestaColaborador.findMany({
        include: {
          respuestas: { include: { pregunta: true, alternativa: true } },
          semestre: true,
        },
        orderBy: { id: 'desc' },
      });

      const normalized = [
        ...encEst.map((e) => ({ ...e, tipo: 'ESTUDIANTIL' as TipoEncuesta })),
        ...encCol.map((e) => ({ ...e, tipo: 'COLABORADORES_JEFES' as TipoEncuesta })),
      ];

      return normalized;
    } catch (err) {
      console.error('EncuestasService.findAll error', err);
      throw new InternalServerErrorException('Error al obtener encuestas');
    }
  }

  async findOne(id: number): Promise<any> {
    if (!id || Number.isNaN(id)) throw new BadRequestException('ID inválido');

    try {
      const est = await this.prisma.encuestaEstudiante.findUnique({
        where: { id },
        include: {
          respuestas: { include: { pregunta: true, alternativa: true } },
          semestre: true,
        },
      });
      if (est) return { ...est, tipo: 'ESTUDIANTIL' as TipoEncuesta };

      const col = await this.prisma.encuestaColaborador.findUnique({
        where: { id },
        include: {
          respuestas: { include: { pregunta: true, alternativa: true } },
          semestre: true,
        },
      });
      if (col) return { ...col, tipo: 'COLABORADORES_JEFES' as TipoEncuesta };

      throw new NotFoundException('Encuesta no encontrada');
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      console.error('EncuestasService.findOne error', err);
      throw new InternalServerErrorException('Error al obtener detalle de la encuesta');
    }
  }

  // -----------------------
  //  CREATE (simple)
  //  Payload esperado: { tipo: 'ESTUDIANTIL' | 'COLABORADORES_JEFES', data: {...} }
  // -----------------------
  async create(payload: { tipo: TipoEncuesta; data: any }): Promise<any> {
    try {
      if (!payload || !payload.tipo || !payload.data) {
        throw new BadRequestException('Payload inválido. Debe contener { tipo, data }');
      }

      const { tipo, data } = payload;

      if (tipo === 'ESTUDIANTIL') {
        const created = await this.prisma.encuestaEstudiante.create({
          data: {
            nombre_estudiante: data.nombreEstudiante ?? null,
            nombre_tallerista: data.nombreTalleristaSupervisor ?? null,
            nombre_centro: data.establecimiento ?? null,
            fecha: data.fechaEvaluacion ? new Date(data.fechaEvaluacion) : new Date(),
            // 👇 aquí estaba el bug: "mejorasCoordinacion" vs "mejoraCoordinacion"
            observacion: data.mejoraCoordinacion ?? null,
            semestreId: data.semestreId ?? undefined,
            // TODO: si luego quieres guardar cada respuesta, aquí haces nested create
          },
        });
        return { success: true, created };
      }

      if (tipo === 'COLABORADORES_JEFES') {
        const createData: any = {
          nombre_colaborador: data.nombreColaborador ?? null,
          nombre_colegio: data.centroEducativo ?? null,
          observacion: data.sugerencias ?? null,
          semestreId: data.semestreId ?? undefined,
        };

        // Solo si tu modelo encuestaColaborador tiene campo "fecha"
        if (data.fechaEvaluacion) {
          (createData as any).fecha = new Date(data.fechaEvaluacion);
        }

        const created = await this.prisma.encuestaColaborador.create({
          data: createData,
        });
        return { success: true, created };
      }

      throw new BadRequestException('Tipo de encuesta no soportado');
    } catch (err) {
      console.error('EncuestasService.create error', err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Error al crear la encuesta');
    }
  }

  // -----------------------
  //  EXPORT TO EXCEL (estudiantes)
  // -----------------------
  async exportEncuestasEstudiantesExcel(response: Response): Promise<void> {
    try {
      const encEst = await this.prisma.encuestaEstudiante.findMany({
        include: {
          respuestas: { include: { pregunta: true, alternativa: true } },
          semestre: true,
        },
        orderBy: { fecha: 'desc' },
      });

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Encuestas Estudiantes');

      sheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Nombre Estudiante (rut)', key: 'nombre_estudiante', width: 24 },
        { header: 'Tallerista/Supervisor', key: 'nombre_tallerista', width: 30 },
        { header: 'Centro', key: 'nombre_centro', width: 30 },
        { header: 'Fecha', key: 'fecha', width: 20 },
        { header: 'Observacion', key: 'observacion', width: 40 },
        { header: 'Semestre', key: 'semestre', width: 12 },
        { header: 'Resumen Respuestas', key: 'resumen', width: 80 },
      ];

      for (const e of encEst) {
        let resumen = '';
        if (e.respuestas && e.respuestas.length) {
          resumen = e.respuestas
            .map((r) => {
              const textoPregunta = r.pregunta?.descripcion ?? `pregunta_${r.preguntaId}`;
              const textoResp = r.alternativa?.descripcion ?? r.respuestaAbierta ?? '';
              return `${textoPregunta}: ${textoResp}`;
            })
            .join(' | ');
        }

        sheet.addRow({
          id: e.id,
          nombre_estudiante: e.nombre_estudiante ?? '',
          nombre_tallerista: e.nombre_tallerista ?? '',
          nombre_centro: e.nombre_centro ?? '',
          fecha: e.fecha ? e.fecha.toISOString() : '',
          observacion: e.observacion ?? '',
          semestre: e.semestre ? `${e.semestre.anio}-${e.semestre.semestre}` : '',
          resumen,
        });
      }

      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename="encuestas_estudiantes.xlsx"',
      );

      await workbook.xlsx.write(response);
      response.end();
    } catch (err) {
      console.error('EncuestasService.exportEncuestasEstudiantesExcel error', err);
      throw new InternalServerErrorException('Error al generar el Excel');
    }
  }

  // -----------------------
  //  CATALOGOS (for selects)
  // -----------------------
  async getCatalogoEstudiantes(): Promise<{ rut: string; nombre: string }[]> {
    try {
      const estudiantes = await this.prisma.estudiante.findMany({
        select: { rut: true, nombre: true },
        orderBy: { nombre: 'asc' },
        take: 1000,
      });
      return estudiantes;
    } catch (err) {
      console.error('EncuestasService.getCatalogoEstudiantes error', err);
      throw new InternalServerErrorException('Error al obtener estudiantes');
    }
  }

  async getCatalogoCentros(): Promise<{ id: number; nombre: string; comuna?: string; region?: string }[]> {
    try {
      const centros = await this.prisma.centroEducativo.findMany({
        select: { id: true, nombre: true, comuna: true, region: true },
        orderBy: { nombre: 'asc' },
        take: 1000,
      });

      return centros.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        comuna: c.comuna ?? undefined,
        region: c.region ?? undefined,
      }));
    } catch (err) {
      console.error('EncuestasService.getCatalogoCentros error', err);
      throw new InternalServerErrorException('Error al obtener centros');
    }
  }

  async getCatalogoColaboradores(): Promise<{ id: number; nombre: string }[]> {
    try {
      const cols = await this.prisma.colaborador.findMany({
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
        take: 1000,
      });
      return cols;
    } catch (err) {
      console.error('EncuestasService.getCatalogoColaboradores error', err);
      throw new InternalServerErrorException('Error al obtener colaboradores');
    }
  }

  async getCatalogoTutores(): Promise<{ id: number; nombre: string }[]> {
    try {
      const tutors = await this.prisma.tutor.findMany({
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
        take: 1000,
      });
      return tutors;
    } catch (err) {
      console.error('EncuestasService.getCatalogoTutores error', err);
      throw new InternalServerErrorException('Error al obtener tutores');
    }
  }
}
