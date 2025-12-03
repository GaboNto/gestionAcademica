import { Injectable } from '@nestjs/common';

interface User {
  id: number;
  email: string;
  password: string; // en un proyecto real va hasheada
  nombre: string;
  role: 'jefatura' | 'vinculacion' | 'practicas';
}

@Injectable()
export class AuthService {
  // Usuarios de ejemplo (puedes cambiarlos o cargarlos desde BD después)
  private users: User[] = [
    {
      id: 1,
      email: 'jefatura@uta.cl',
      password: '123456',
      nombre: 'Jefatura de Carrera',
      role: 'jefatura',
    },
    {
      id: 2,
      email: 'vinculacion@uta.cl',
      password: '123456',
      nombre: 'Coordinación de Vinculación',
      role: 'vinculacion',
    },
    {
      id: 3,
      email: 'practicas@uta.cl',
      password: '123456',
      nombre: 'Coordinadora de Prácticas',
      role: 'practicas',
    },
  ];

  validateUser(email: string, password: string) {
    const user = this.users.find(
      u => u.email === email && u.password === password,
    );
    if (!user) return null;

    const { password: _pwd, ...rest } = user;
    return rest;
  }

  buildLoginResponse(user: Omit<User, 'password'>) {
    // Aquí podrías firmar un JWT; por ahora un token sencillo
    return {
      accessToken: `fake-token-${user.id}`,
      user,
    };
  }
}
