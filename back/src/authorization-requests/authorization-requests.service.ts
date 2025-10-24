import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, AuthorizationRequest } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateAuthorizationRequestDto } from './dto/create-authorization-request.dto';

@Injectable()
export class AuthorizationRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAuthorizationRequestDto): Promise<AuthorizationRequest> {
    if (!dto.students?.length) {
      // Mensaje alineado a tu HU
      throw new BadRequestException('Debe completar todos los campos requeridos.');
    }
    const studentsPlain = dto.students.map(s => ({ name: s.name, rut: s.rut })) as unknown as Prisma.JsonArray;
    
    const created = await this.prisma.authorizationRequest.create({
      data: {
        refTitle: dto.refTitle,
        city: dto.city,
        letterDate: new Date(dto.letterDate),
        addresseeName: dto.addresseeName,
        addresseeRole: dto.addresseeRole,
        institution: dto.institution,
        institutionAddr: dto.institutionAddr,
        practiceType: dto.practiceType,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        degree: dto.degree,
        comments: dto.comments,
        tutorName: dto.tutorName,
        tutorPhone: dto.tutorPhone,
        // ✅ Prisma espera JSON: casteamos a JsonArray
        studentsJson: studentsPlain,
      },
    });

    return created;
  }

  async findAll(params: { q?: string; institution?: string; status?: string }) {
    const { q, institution, status } = params;

    // ✅ Construimos un where tipado para evitar TS2322
    const where: Prisma.AuthorizationRequestWhereInput = {
      AND: [
        institution ? { institution: { contains: institution } } : {},
        status ? { status: status as any } : {},
        q
          ? {
              OR: [
                { addresseeName: { contains: q } },
                { institution: { contains: q } },
                { degree: { contains: q } },
              ],
            }
          : {},
      ],
    };

    return this.prisma.authorizationRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<AuthorizationRequest> {
    const item = await this.prisma.authorizationRequest.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Solicitud no encontrada');
    return item;
  }
}
