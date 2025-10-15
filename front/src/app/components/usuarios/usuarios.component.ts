import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

interface Usuario {
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  status: string;
  lastLogin: string;
  permissions: string[];
}

@Component({
  standalone: true,
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ]
})
export class UsuariosComponent {
  usuarios: Usuario[] = [
    {
      name: 'Gabriel Pailamilla',
      email: 'gabriel@example.com',
      role: 'admin',
      roleLabel: 'Administrador',
      status: 'Activo',
      lastLogin: '2025-10-08',
      permissions: ['manage_users', 'view_reports']
    },
    {
      name: 'Carolina Quintana',
      email: 'carolina@example.com',
      role: 'coordinator',
      roleLabel: 'Coordinadora',
      status: 'Activo',
      lastLogin: '2025-10-09',
      permissions: ['create_offers', 'assign_supervisors']
    }
  ];

  roleColor(role: string) {
    switch (role) {
      case 'admin':
        return '#e3f2fd';
      case 'coordinator':
        return '#f3e5f5';
      case 'supervisor':
        return '#e8f5e9';
      default:
        return '#f5f5f5';
    }
  }

  label(permission: string) {
    const map: Record<string, string> = {
      manage_users: 'Gestionar Usuarios',
      view_reports: 'Ver Reportes',
      create_offers: 'Crear Ofertas',
      assign_supervisors: 'Asignar Supervisores'
    };
    return map[permission] ?? permission;
  }
}
