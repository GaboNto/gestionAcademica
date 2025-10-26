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
    // -------- Normalización segura de query params --------
    const pageRaw  = q.page ?? 1;
    const limitRaw = q.limit ?? 10;

    const pageNum  = Number(pageRaw);
    const limitNum = Number(limitRaw);

    const page  = Number.isFinite(pageNum)  && pageNum  > 0 ? pageNum  : 1;
    const limit = Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 10;

    // Puedes poner un máximo razonable
    const MAX_LIMIT = 1000;
    const safeLimit = Math.min(limit, MAX_LIMIT);

    // orderBy y orderDir con whitelists
    const allowedOrderBy = new Set<keyof any>([
      'id', 'nombre', 'region', 'comuna', 'tipo', 'convenio', 'correo'
    ]);
    const orderBy = (q.orderBy && allowedOrderBy.has(q.orderBy as any))
      ? (q.orderBy as string)
      : 'nombre';

    const orderDir = q.orderDir === 'desc' ? 'desc' : 'asc';

    // -------- Filtro WHERE --------
    const where = {
      ...(q.tipo ? { tipo: q.tipo } : {}),
      ...(q.search
        ? {
            OR: [
              { nombre: { contains: q.search, mode: 'insensitive' } },
              { comuna: { contains: q.search, mode: 'insensitive' } },
              { region: { contains: q.search, mode: 'insensitive' } },
              { correo: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // -------- Consulta + conteo en transacción --------
    const [items, total] = await this.prisma.$transaction([
      this.prisma.centroEducativo.findMany({
        where,
        orderBy: { [orderBy]: orderDir },
        skip: (page - 1) * safeLimit,
        take: safeLimit,
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
      limit: safeLimit,
      total,
      pages: Math.max(0, Math.ceil(total / safeLimit)),
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
