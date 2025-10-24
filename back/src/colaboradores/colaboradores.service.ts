import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateColaboradorDto } from './dto/create-colaborador.dto';
import { UpdateColaboradorDto } from './dto/update-colaborador.dto';
import { QueryColaboradorDto } from './dto/query-colaborador.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ColaboradoresService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateColaboradorDto) {
    // rut es único: si ya existe, prisma lanzará error único
    return this.prisma.colaborador.create({ data: dto });
  }

  async findAll(q: QueryColaboradorDto) {
    const { tipo, search, page = 1, limit = 10, orderBy = 'nombre', orderDir = 'asc' } = q;
    const where = {
      ...(tipo ? { tipo } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { rut: { contains: search, mode: 'insensitive' } },
              { correo: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.colaborador.findMany({
        where,
        orderBy: { [orderBy]: orderDir },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          rut: true,
          nombre: true,
          correo: true,
          telefono: true,
          tipo: true,
          cargo: true,
          universidad_egreso: true,
        },
      }),
      this.prisma.colaborador.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async verPracticas(id: number) {
    const col = await this.prisma.colaborador.findUnique({
      where: { id },
      include: {
        practicas: {
          select: {
            id: true,
            estado: true,
            fecha_inicio: true,
            fecha_termino: true,
            estudiante: { select: { rut: true, nombre: true } },
            centro: { select: { id: true, nombre: true, comuna: true } },
          },
        },
      },
    });
    if (!col) throw new NotFoundException('Colaborador no encontrado');
    return col;
  }

  async update(id: number, dto: UpdateColaboradorDto) {
    try {
      return await this.prisma.colaborador.update({ where: { id }, data: dto });
    } catch {
      throw new NotFoundException('Colaborador no encontrado');
    }
  }

  // Si prefieres borrado lógico, cambia por update({data:{activo:false}})
  async remove(id: number) {
    try {
      return await this.prisma.colaborador.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Colaborador no encontrado');
    }
  }
}
