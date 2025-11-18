import { Injectable } from '@nestjs/common';

@Injectable()
export class EncuestasService {
  // Más adelante puedes inyectar PrismaService o lo que uses para la BD

  findAll() {
    // Por ahora solo devolvemos un arreglo vacío
    return [];
  }
}
