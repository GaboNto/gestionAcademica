import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTutorDto, TIPOS_TUTOR_PERMITIDOS, TipoTutor } from './dto/create-tutor.dto';
import { UpdateTutorDto } from './dto/update-tutor.dto';
import { QueryTutorDto } from './dto/query-tutor.dto';

@Injectable()
export class TutorService {
  constructor(private prisma: PrismaService) {}

  private normalizeTipos(dto: { tipo?: TipoTutor; tipos?: TipoTutor[] }): TipoTutor[] {
    const tipos = Array.isArray(dto.tipos)
      ? dto.tipos
      : dto.tipo
      ? [dto.tipo]
      : [];
    // dedupe y validar nuevamente por seguridad
    const set = new Set<string>();
    for (const t of tipos) {
      if (!TIPOS_TUTOR_PERMITIDOS.includes(t)) {
        throw new BadRequestException(`Tipo no permitido: ${t}`);
      }
      set.add(t);
    }
    return Array.from(set) as TipoTutor[];
  }

  private normalizeCargos(dto: any) {
    const cargosList = Array.isArray(dto.cargos)
      ? (dto.cargos as string[])
          .filter((c) => !!c && c.trim())
          .map((c) => ({ cargo: c.trim() }))
      : dto.cargo && dto.cargo.trim()
      ? [{ cargo: dto.cargo.trim() }]
      : [];
    return cargosList;
  }

  async create(dto: CreateTutorDto) {
    const tipos = this.normalizeTipos(dto);
    const cargosList = this.normalizeCargos(dto as any);

    // upsert de roles permitidos para no duplicar valores si ya existen
    const rolIds: number[] = [];
    for (const rolName of tipos) {
      const rol = await this.prisma.rol.upsert({
        where: { rol: rolName },
        create: { rol: rolName },
        update: {},
      });
      rolIds.push(rol.id);
    }

    const { tipo, tipos: _tipos, cargo, cargos, ...rest } = dto as any;

    return this.prisma.tutor.create({
      data: {
        ...rest,
        ...(cargosList.length ? { cargos: { create: cargosList } } : {}),
        ...(rolIds.length
          ? {
              roles: {
                create: rolIds.map((id) => ({ rol: { connect: { id } } })),
              },
            }
          : {}),
      },
      include: {
        cargos: true,
        roles: { include: { rol: true } },
      },
    });
  }

  async findAll(q: QueryTutorDto) {
    const { tipo, search, page = 1, limit = 10, orderBy = 'nombre', orderDir = 'asc' } = q;

    const where: any = {};
    if (search && search.trim()) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { rut: { contains: search, mode: 'insensitive' } },
        { correo: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tipo) {
      where.roles = {
        some: {
          rol: { rol: tipo },
        },
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.tutor.findMany({
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
          universidad_egreso: true,
          cargos: { select: { id: true, cargo: true } },
          roles: { select: { rol: { select: { rol: true } } } },
        },
      }),
      this.prisma.tutor.count({ where }),
    ]);

    const itemsMapped = items.map((it: any) => ({
      ...it,
      tipos: Array.isArray(it.roles) && it.roles.length ? it.roles.map((r: any) => r.rol.rol) : [],
      cargo: Array.isArray(it.cargos) && it.cargos.length ? it.cargos.map((c: any) => c.cargo).join(', ') : undefined,
    }));

    return {
      items: itemsMapped,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const t = await this.prisma.tutor.findUnique({
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
        cargos: { select: { id: true, cargo: true } },
        roles: { select: { rol: { select: { id: true, rol: true } } } },
      },
    });
    if (!t) throw new NotFoundException('Tutor no encontrado');
    return t;
  }

  async update(id: number, dto: UpdateTutorDto) {
    const cargosList = this.normalizeCargos(dto as any);
    const tipos = this.normalizeTipos(dto);

    // Resolver roles a ids via upsert (no duplicar rol si ya existe)
    const rolIds: number[] = [];
    for (const rolName of tipos) {
      const rol = await this.prisma.rol.upsert({
        where: { rol: rolName },
        create: { rol: rolName },
        update: {},
      });
      rolIds.push(rol.id);
    }

    const { tipo, tipos: _tipos, cargo, cargos, ...rest } = dto as any;

    try {
      return await this.prisma.tutor.update({
        where: { id },
        data: {
          ...rest,
          ...(cargo !== undefined || cargos !== undefined
            ? { cargos: { deleteMany: {}, ...(cargosList.length ? { create: cargosList } : {}) } }
            : {}),
          ...(tipo !== undefined || _tipos !== undefined
            ? {
                roles: {
                  deleteMany: {},
                  ...(rolIds.length ? { create: rolIds.map((rid) => ({ rol: { connect: { id: rid } } })) } : {}),
                },
              }
            : {}),
        },
        include: { cargos: true, roles: { include: { rol: true } } },
      });
    } catch {
      throw new NotFoundException('Tutor no encontrado');
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.tutor.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Tutor no encontrado');
    }
  }
}

