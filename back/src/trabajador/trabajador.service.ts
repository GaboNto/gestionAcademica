import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrabajadorDto } from './dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TrabajadoresService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTrabajadorDto) {
    // validar que el centro exista
    const centro = await this.prisma.centroEducativo.findUnique({ where: { id: dto.centroId } });
    if (!centro) throw new NotFoundException('Centro educativo no encontrado');

    return this.prisma.trabajadorEduc.create({
      data: {
        rut: dto.rut,
        nombre: dto.nombre,
        rol: dto.rol,
        correo: dto.correo,
        telefono: dto.telefono,
        centroId: dto.centroId,
      },
    });
  }

  async findOne(id: number) {
    const t = await this.prisma.trabajadorEduc.findUnique({
      where: { id },
      include: { centro: { select: { id: true, nombre: true } } },
    });
    if (!t) throw new NotFoundException('Trabajador no encontrado');
    return t;
  }

  async update(id: number, dto: UpdateTrabajadorDto) {
    if (dto.centroId !== undefined) {
      const centro = await this.prisma.centroEducativo.findUnique({ where: { id: dto.centroId } });
      if (!centro) throw new NotFoundException('Centro educativo no encontrado');
    }

    try {
      return await this.prisma.trabajadorEduc.update({
        where: { id },
        data: {
          rut: dto.rut,
          nombre: dto.nombre,
          rol: dto.rol,
          correo: dto.correo,
          telefono: dto.telefono,
          centroId: dto.centroId,
        },
      });
    } catch {
      throw new NotFoundException('Trabajador no encontrado');
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.trabajadorEduc.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Trabajador no encontrado');
    }
  }
}
