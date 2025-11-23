import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateActividadPracticaDto } from './dto/crear-act-practica.dto';
import { UpdateActividadPracticaDto } from './dto/actualizar-act-practica.dto';
import { QueryActividadPracticaDto } from './dto/consulta-act-practica.dto';

@Injectable()
export class ActividadPracticaService {
  constructor(private prisma: PrismaService) {}

  // CREATE
  async create(dto: CreateActividadPracticaDto) {
    const fecha = dto.fechaRegistro ? new Date(dto.fechaRegistro) : new Date();

    const actividad = await this.prisma.actividad.create({
      data: {
        // mapeo de campos
        nombre_actividad: dto.titulo,
        lugar: dto.descripcion,
        horario: dto.tallerista,
        estudiantes: dto.estudiante,
        fecha,
        mes: dto.estado, // "PENDIENTE" | "APROBADA" | "OBSERVADA"
        archivo_adjunto: dto.evidenciaUrl ?? null,
      },
    });

    // El front, al recibir 201/200 OK, muestra:
    // "Actividad registrada exitosamente."
    return actividad;
  }

  // LISTAR + búsqueda + filtros
  async findAll(q: QueryActividadPracticaDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;

    const where: any = {};

    if (q.estado) {
      where.mes = q.estado;
    }

    if (q.fechaDesde || q.fechaHasta) {
      where.fecha = {};
      if (q.fechaDesde) where.fecha.gte = new Date(q.fechaDesde);
      if (q.fechaHasta) where.fecha.lte = new Date(q.fechaHasta);
    }

    const s = q.search?.trim();
    if (s) {
      where.OR = [
        { nombre_actividad: { contains: s, mode: 'insensitive' } }, // título
        { horario: { contains: s, mode: 'insensitive' } },          // tallerista
        { estudiantes: { contains: s, mode: 'insensitive' } },      // estudiante
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.actividad.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.actividad.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      // si total === 0 -> el front muestra "No hay actividades registradas."
    };
  }

  // READ ONE
  async findOne(id: number) {
    const actividad = await this.prisma.actividad.findUnique({
      where: { id },
    });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');
    return actividad;
  }

  // UPDATE
  async update(id: number, dto: UpdateActividadPracticaDto) {
    const data: any = {};

    if (dto.titulo !== undefined) data.nombre_actividad = dto.titulo;
    if (dto.descripcion !== undefined) data.lugar = dto.descripcion;
    if (dto.tallerista !== undefined) data.horario = dto.tallerista;
    if (dto.estudiante !== undefined) data.estudiantes = dto.estudiante;
    if (dto.estado !== undefined) data.mes = dto.estado;
    if (dto.evidenciaUrl !== undefined) data.archivo_adjunto = dto.evidenciaUrl;
    if (dto.fechaRegistro !== undefined) data.fecha = new Date(dto.fechaRegistro);

    try {
      return await this.prisma.actividad.update({
        where: { id },
        data,
      });
    } catch {
      throw new NotFoundException('Actividad no encontrada');
    }
  }

  // DELETE
  async remove(id: number) {
    try {
      return await this.prisma.actividad.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Actividad no encontrada');
    }
  }
}
