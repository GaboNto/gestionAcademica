import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida las credenciales contra la tabla Usuario
   */
  async validateUser(email: string, password: string) {
    // buscar usuario por email
    const user = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!user || !user.activo) {
      return null;
    }

    // comparar password en texto plano con el hash almacenado
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return null;
    }

    // eliminar el password antes de devolver
    const { password: _pwd, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Arma la respuesta de login (a futuro aquí puedes firmar un JWT real)
   */
  buildLoginResponse(user: any) {
    return {
      accessToken: `fake-token-${user.id}`, // luego: reemplazar por JWT
      user,
    };
  }
}
