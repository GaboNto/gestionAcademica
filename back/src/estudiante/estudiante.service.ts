import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EstudianteService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.estudiante.findMany({
      orderBy: { nombre: 'asc' },
      select: {
        rut: true,
        nombre: true,
        email: true,
        fono: true,
      },
    });
  }
}

