import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatCardModule }   from '@angular/material/card';

type RoleId = 'jefatura' | 'coordinador' | 'supervisor' | 'colaborador';

interface SelectedRole {
  id: RoleId;
  title: string;
  name: string;
  icon: string;
  permissions: string[];
  color: 'blue' | 'green' | 'purple';
}
interface CardItem {
  title: string;
  icon: string;
  route: string;
  desc?: string;
  subItems?: { title: string; route: string; desc?: string }[];
}

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatCardModule]
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  themeClass = 'light-theme';

  user = { name: 'Usuario', roleLabel: 'Rol', icon: 'account_circle' };
  cards: CardItem[] = [];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('app.selectedRole');
      const role: SelectedRole | null = saved ? JSON.parse(saved) : null;
      if (role) {
        this.user = {
          name: role.name,
          roleLabel: this.mapRoleLabel(role.id),
          icon: role.icon ?? 'account_circle'
        };
        this.cards = this.buildCardsFor(role.id);
        return;
      }
    }
    this.cards = this.buildCardsFor('coordinador');
  }

  private mapRoleLabel(id: RoleId) {
    switch (id) {
      case 'jefatura':    return 'Jefatura de Carrera';
      case 'coordinador': return 'Coordinador/a';
      case 'supervisor':  return 'Supervisor/a';
      case 'colaborador': return 'Colaborador/a';
    }
  }

  private buildCardsFor(id: RoleId): CardItem[] {
    const comunes: CardItem[] = [
      { title: 'Gestión de Estudiantes', icon: 'school', route: '/estudiantes', desc: 'Registro, búsqueda y exportación' },
      { title: 'Prácticas',              icon: 'work', route: '/practicas', desc: 'Asignación estudiante-colegio' },
      { title: 'Encuestas',              icon: 'assignment', route: '/encuestas', desc: 'Formularios y evaluación' },
      { title: 'Supervisión',            icon: 'insights', route: '/supervision', desc: 'Indicadores y vencimientos' },
    ];

    if (id === 'jefatura') {
      // 👉 Aquí vive el módulo Usuarios
      return [
        { title: 'Usuarios', icon: 'manage_accounts', route: '/usuarios', desc: 'Roles y permisos' },
        { title: 'Colaboradores', icon: 'groups', route: '/colaboradores', desc: 'Alta, filtros y perfiles' },
        ...comunes
      ];
    }

    if (id === 'coordinador') {
      // 👉 Sin "Usuarios" para coordinador/a
      return [
        { title: 'Colaboradores', icon: 'groups', route: '/colaboradores', desc: 'Alta, filtros y perfiles' },
        ...comunes
      ];
    }

    if (id === 'supervisor') {
      return [
        { title: 'Mis Estudiantes', icon: 'school', route: '/estudiantes', desc: 'Seguimiento asignado' },
        { title: 'Supervisión', icon: 'visibility', route: '/supervision', desc: 'Actividades recientes' },
        ...comunes.filter(c => c.title !== 'Usuarios')
      ];
    }

    // colaborador
    return [
      { title: 'Encuestas', icon: 'assignment', route: '/encuestas', desc: 'Responde tus formularios' },
      ...comunes.filter(c => c.title !== 'Usuarios' && c.title !== 'Colaboradores')
    ];
  }

  go(path: string) {
    this.router.navigate([path]);
  }
}
