import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatCardModule }   from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }  from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

type RolColaborador = 'Supervisor' | 'Colaborador' | 'Tallerista';
type Estado = 'Activo' | 'Inactivo';

interface Colaborador {
  nombre: string;
  centro_educativo: string;
  estado: Estado;
  role: RolColaborador;
  especialidad?: string;
  experiencia?: string;
  email: string;
  telefono?: string;
}

@Component({
  standalone: true,
  selector: 'app-colaboradores',
  templateUrl: './colaboradores.component.html',
  styleUrls: ['./colaboradores.component.scss'],
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule
  ]
})
export class ColaboradoresComponent {
  private snack = inject(MatSnackBar);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // UI
  showForm = false;

  // filtros
  searchTerm = '';
  selectedRole: 'all' | RolColaborador = 'all';

  // formulario
  newColaborador: Partial<Colaborador> = {
    role: 'Supervisor',
    estado: 'Activo'
  };

  // datos
  colaboradores: Colaborador[] = [
    {
      nombre: 'Juan Pérez',
      centro_educativo: 'Colegio A',
      estado: 'Activo',
      role: 'Supervisor',
      especialidad: 'Matemáticas',
      experiencia: '5 años',
      email: 'juan@example.com',
      telefono: '+56 9 1111 2222'
    },
    {
      nombre: 'María López',
      centro_educativo: 'Colegio B',
      estado: 'Inactivo',
      role: 'Colaborador',
      especialidad: 'Lenguaje',
      experiencia: '2 años',
      email: 'maria@example.com',
      telefono: '+56 9 3333 4444'
    },
    {
      nombre: 'Daniel Soto',
      centro_educativo: 'Colegio C',
      estado: 'Activo',
      role: 'Tallerista',
      especialidad: 'Taller de Patrimonio',
      experiencia: '3 años',
      email: 'daniel@example.com',
      telefono: '+56 9 5555 6666'
    }
  ];

  constructor() {
    // Cargar desde localStorage (SSR-safe)
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('app.colaboradores');
      if (saved) {
        try { this.colaboradores = JSON.parse(saved) as Colaborador[]; } catch {}
      }
    }
  }

  // navegación
  goBack() { this.router.navigate(['/dashboard']); }

  // UI
  toggleForm() { this.showForm = !this.showForm; }

  // persistencia
  private persist() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('app.colaboradores', JSON.stringify(this.colaboradores));
    }
  }

  // agregar
  addColaborador() {
    const c = this.newColaborador;

    // validación mínima
    if (!c?.nombre || !c?.email || !c?.centro_educativo || !c?.role) {
      this.snack.open('Completa nombre, email, centro y rol.', 'Cerrar', { duration: 2500 });
      return;
    }
    // evitar duplicados por email
    const exists = this.colaboradores.some(x => x.email.trim().toLowerCase() === c.email!.trim().toLowerCase());
    if (exists) {
      this.snack.open('Ya existe un colaborador con ese email.', 'Cerrar', { duration: 2500 });
      return;
    }

    const nuevo: Colaborador = {
      nombre: c.nombre.trim(),
      email: c.email!.trim(),
      centro_educativo: c.centro_educativo!.trim(),
      role: c.role as RolColaborador,
      estado: (c.estado as Estado) ?? 'Activo',
      especialidad: c.especialidad?.trim(),
      experiencia: c.experiencia?.trim(),
      telefono: c.telefono?.trim()
    };

    this.colaboradores.unshift(nuevo);
    this.persist();
    this.snack.open('Colaborador agregado.', 'OK', { duration: 2000 });

    // reset form (mantengo rol y estado por comodidad)
    this.newColaborador = { role: c.role, estado: c.estado ?? 'Activo' };
    this.showForm = false;
  }

  // eliminar
  remove(c: Colaborador) {
    if (isPlatformBrowser(this.platformId)) {
      const ok = window.confirm(`¿Eliminar a ${c.nombre}?`);
      if (!ok) return;
    }
    this.colaboradores = this.colaboradores.filter(x => x.email !== c.email);
    this.persist();
    this.snack.open('Colaborador eliminado.', 'OK', { duration: 2000 });
  }

  // filtros
  filtered() {
    const term = this.searchTerm.toLowerCase().trim();
    return this.colaboradores.filter(c => {
      const matchSearch =
        !term ||
        c.nombre.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.centro_educativo.toLowerCase().includes(term);

      const matchRole = this.selectedRole === 'all' || c.role === this.selectedRole;

      return matchSearch && matchRole;
    });
  }

  statusClass(estado: string): string {
    const greenStatuses = ['Activo', 'Disponible', 'Aprobado'];
    return greenStatuses.includes(estado) ? 'badge green' : 'badge red';
  }
}
