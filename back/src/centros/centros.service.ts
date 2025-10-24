import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCentroDto } from './dto/create-centro.dto';
import { UpdateCentroDto } from './dto/update-centro.dto';
import { QueryCentroDto } from './dto/query-centro.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class CentrosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCentroDto) {
    return this.prisma.centroEducativo.create({ data: dto });
  }

  async findAll(q: QueryCentroDto) {
    const { tipo, search, page = 1, limit = 10, orderBy = 'nombre', orderDir = 'asc' } = q;

    const where = {
      ...(tipo ? { tipo } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { comuna: { contains: search, mode: 'insensitive' } },
              { region: { contains: search, mode: 'insensitive' } },
              { correo: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.centroEducativo.findMany({
        where,
        orderBy: { [orderBy]: orderDir },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          nombre: true,
          region: true,
          comuna: true,
          direccion: true,
          nombre_calle: true,
          numero_calle: true,
          telefono: true,
          correo: true,
          tipo: true,
          convenio: true,
          url_rrss: true,
          // resumen: cuántas prácticas y trabajadores asociados
          _count: {
            select: {
              practicas: true,
              trabajadores: true,
            },
          },
        },
      }),
      this.prisma.centroEducativo.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const centro = await this.prisma.centroEducativo.findUnique({
      where: { id },
      include: {
        practicas: {
          select: {
            id: true,
            estado: true,
            fecha_inicio: true,
            fecha_termino: true,
            estudiante: { select: { rut: true, nombre: true } },
            colaborador: { select: { id: true, nombre: true, tipo: true } },
          },
          orderBy: { fecha_inicio: 'desc' },
        },
        trabajadores: {
          select: { id: true, rut: true, nombre: true, rol: true, correo: true, telefono: true },
          orderBy: { nombre: 'asc' },
        },
      },
    });
    if (!centro) throw new NotFoundException('Centro educativo no encontrado');
    return centro;
  }

  async update(id: number, dto: UpdateCentroDto) {
    try {
      return await this.prisma.centroEducativo.update({ where: { id }, data: dto });
    } catch {
      throw new NotFoundException('Centro educativo no encontrado');
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.centroEducativo.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Centro educativo no encontrado');
    }
  }
}
