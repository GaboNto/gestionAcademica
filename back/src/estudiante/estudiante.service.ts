import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { QueryEstudianteDto } from './dto/query-estudiante.dto';

@Injectable()
export class EstudianteService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: QueryEstudianteDto) {
    const where: Prisma.EstudianteWhereInput = {
      ...(q.nombre ? { nombre: { contains: q.nombre } } : {}),
      ...(q.carrera ? { plan: { contains: q.carrera } } : {}),
      ...(q.estadoPractica
        ? { practicas: { some: { estado: q.estadoPractica as any } } }
        : {}),
    };

    const estudiantes = await this.prisma.estudiante.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: {
        practicas: {
          orderBy: { fecha_inicio: 'desc' },
          take: 1,
          select: { estado: true, fecha_inicio: true, fecha_termino: true },
        },
      },
    });

    return estudiantes.map((e) => ({
      rut: e.rut,
      nombre: e.nombre,
      plan: e.plan,
      email: e.email,
      fono: e.fono,
      estadoPractica: e.practicas[0]?.estado ?? null,
      ultimaPractica: e.practicas[0]
        ? {
            fecha_inicio: e.practicas[0].fecha_inicio,
            fecha_termino: e.practicas[0].fecha_termino,
          }
        : null,
    }));
  }

  async findOne(rut: string) {
    const normalizedRut = rut.replace(/[.-]/g, '').toUpperCase();

    const estudiante = await this.prisma.estudiante.findFirst({
      where: {
        OR: [
          { rut },
          { rut: normalizedRut },
          { rut: rut.toUpperCase() },
        ],
      },
      include: {
        practicas: {
          orderBy: { fecha_inicio: 'desc' },
          include: {
            practicaColaboradores: { include: { colaborador: true } },
            practicaTutores: { include: { tutor: true } },
          },
        },
      },
    });

    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    let actividades: any[] = [];
    try {
      actividades = await this.prisma.actividad.findMany({
        where: {
          OR: [
            { estudiantes: { contains: rut } },
            { estudiantes: { contains: estudiante.nombre } },
          ],
        },
        orderBy: { fecha: 'desc' },
        select: {
          id: true,
          estudiantes: true,
          fecha: true,
          horario: true,
          lugar: true,
          archivo_adjunto: true,
        },
      });
    } catch (err: any) {
      // Si la tabla tiene columnas desalineadas con el schema Prisma, retornamos sin actividades
      if (err?.code !== 'P2022') {
        throw err;
      }
    }

    return { ...estudiante, actividades };
  }
}
