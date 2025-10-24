import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePracticaDto, EstadoPractica } from './dto/crear-practica.dto';
import { Prisma } from '@prisma/client';
import { Subject } from 'rxjs';
import { ConsultasJefaturaDto } from './dto/consultar-jefatura.dto';


@Injectable()
export class PracticasService {
  constructor(private readonly prisma: PrismaService) {}

  private static overlap(aStart: Date, aEnd: Date | null, bStart: Date, bEnd: Date | null): boolean {
    const aEndOrMax = aEnd ?? new Date(8640000000000000); // max date
    const bEndOrMax = bEnd ?? new Date(8640000000000000);
    return aStart <= bEndOrMax && aEndOrMax >= bStart;
  }
    private readonly changes$ = new Subject<any>();

    get stream$() {
        return this.changes$.asObservable();
    }

    private notifyChange(event: 'created'|'updated'|'deleted', payload: any) {
        this.changes$.next({ type: `practice.${event}`, at: new Date().toISOString(), payload });
    }


  async create(dto: CreatePracticaDto) {
    const estado = dto.estado ?? EstadoPractica.PENDIENTE;
    const start = new Date(dto.fecha_inicio);
    const end = dto.fecha_termino ? new Date(dto.fecha_termino) : null;

    if (isNaN(start.getTime()) || (end && isNaN(end.getTime()))) {
      throw new BadRequestException('Debe completar todos los campos requeridos.');
    }
    if (end && end < start) {
      throw new BadRequestException('Debe completar todos los campos requeridos.');
    }

    const [estudiante, centro, colaborador] = await Promise.all([
      this.prisma.estudiante.findUnique({ where: { rut: dto.estudianteRut } }),
      this.prisma.centroEducativo.findUnique({ where: { id: dto.centroId } }),
      this.prisma.colaborador.findUnique({ where: { id: dto.colaboradorId } }),
    ]);
    if (!estudiante || !centro || !colaborador) {
      throw new BadRequestException('Debe completar todos los campos requeridos.');
    }

    const posiblesActivas = await this.prisma.practica.findMany({
      where: {
        estudianteRut: dto.estudianteRut,
        estado: { in: [EstadoPractica.PENDIENTE, EstadoPractica.EN_CURSO] as any },
      },
      select: { id: true, fecha_inicio: true, fecha_termino: true },
    });

    // Si ya hay una práctica activa en estado, se bloquea
    if (posiblesActivas.length > 0 && (estado === EstadoPractica.PENDIENTE || estado === EstadoPractica.EN_CURSO)) {
      throw new BadRequestException('No se puede asignar más de una práctica activa simultáneamente para este estudiante.');
    }

    // Se evita solape de periodos con cualquier práctica activa existente 
    for (const p of posiblesActivas) {
      if (PracticasService.overlap(new Date(p.fecha_inicio), p.fecha_termino, start, end)) {
        throw new BadRequestException('No se puede asignar más de una práctica activa simultáneamente para este estudiante.');
      }
    }

    // Crear práctica
    const created = await this.prisma.practica.create({
      data: {
        estudianteRut: dto.estudianteRut,
        centroId: dto.centroId,
        colaboradorId: dto.colaboradorId,
        fecha_inicio: start,
        fecha_termino: end,
        tipo: dto.tipo ?? null,
        estado: estado as any,
      },
      include: {
        estudiante: true,
        centro: true,
        colaborador: true,
      },
    });

    this.notifyChange('created', created);

    return {
      message: 'Práctica asignada exitosamente.',
      data: created,
    };
    
  }

  // Listado para “Gestión de prácticas” 
  async list(params: { estado?: EstadoPractica; estudianteRut?: string }) {
    return this.prisma.practica.findMany({
      where: {
        estado: params.estado as any,
        estudianteRut: params.estudianteRut,
      },
      orderBy: { fecha_inicio: 'desc' },
      include: { estudiante: true, centro: true, colaborador: true },
    });
  }

  // Vista para Jefatura 
    async listForJefatura(q: ConsultasJefaturaDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const fromDate = q.from ? new Date(q.from) : undefined;
    const toDate   = q.to   ? new Date(q.to)   : undefined;
    if ((q.from && isNaN(fromDate!.getTime())) || (q.to && isNaN(toDate!.getTime()))) {
        throw new BadRequestException('Rango de fechas inválido');
    }

    const searchFilter = q.q
        ? {
            OR: [
            { estudiante:  { nombre: { contains: q.q, mode: 'insensitive' } } },
            { centro:      { nombre: { contains: q.q, mode: 'insensitive' } } },
            { colaborador: { nombre: { contains: q.q, mode: 'insensitive' } } },
            { tipo:        { contains: q.q, mode: 'insensitive' } },
            ],
        }
        : {};

    const where: Prisma.PracticaWhereInput = {
        ...(q.estado ? { estado: q.estado as any } : {}),
        ...(q.centroId ? { centroId: q.centroId } : {}),
        ...(q.colaboradorId ? { colaboradorId: q.colaboradorId } : {}),
        ...(fromDate ? { fecha_inicio: { gte: fromDate } } : {}),
        ...(toDate   ? { fecha_inicio: { ...(fromDate ? { gte: fromDate } : {}), lte: toDate } } : {}),
        ...searchFilter,
    };

    const orderBy: Prisma.PracticaOrderByWithRelationInput =
        q.sortBy ? { [q.sortBy]: q.sortOrder ?? 'desc' } : { fecha_inicio: 'desc' };

    const [total, items] = await this.prisma.$transaction([
        this.prisma.practica.count({ where }),
        this.prisma.practica.findMany({
        where, orderBy, skip, take,
        include: {
            estudiante: { select: { rut: true, nombre: true } },
            centro:     { select: { id: true, nombre: true, tipo: true } },
            colaborador:{ select: { id: true, nombre: true } },
        },
        }),
    ]);

    return {
        meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        items,
    };
    }

  async findOne(id: number) {
    const p = await this.prisma.practica.findUnique({
      where: { id },
      include: { estudiante: true, centro: true, colaborador: true },
    });
    if (!p) throw new NotFoundException('Práctica no encontrada');
    return p;
  }
}
