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

interface Colaborador {
  nombre: string;
  centro_educativo: string;
  role: RolColaborador;
  especialidad?: string;
  experiencia?: string;
  email: string;
  telefono?: string;
  rut?: string;
  direccion?: string;
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
  selectedColaborador: Colaborador | null = null;
  isEditing = false;
  editingColaborador: Colaborador | null = null;
  showDeleteConfirm = false;
  colaboradorToDelete: Colaborador | null = null;

  // filtros
  searchTerm = '';
  selectedRole: 'all' | RolColaborador = 'all';

  // formulario
  newColaborador: Partial<Colaborador> = {
    role: 'Supervisor'
  };

  // datos
  colaboradores: Colaborador[] = [
    {
      nombre: 'Juan Pérez',
      centro_educativo: 'Colegio A',
      role: 'Supervisor',
      especialidad: 'Profesor de Matemáticas',
      experiencia: 'Universidad de Chile',
      email: 'juan@example.com',
      telefono: '+56 9 1111 2222',
      rut: '12.345.678-9',
      direccion: 'Av. Libertador Bernardo O\'Higgins 123, Santiago, Región Metropolitana'
    },
    {
      nombre: 'María López',
      centro_educativo: 'Colegio B',
      role: 'Colaborador',
      especialidad: 'Profesora de Lenguaje',
      experiencia: 'Pontificia Universidad Católica',
      email: 'maria@example.com',
      telefono: '+56 9 3333 4444',
      rut: '98.765.432-1',
      direccion: 'Calle Los Robles 456, Providencia, Región Metropolitana'
    },
    {
      nombre: 'Daniel Soto',
      centro_educativo: 'Colegio C',
      role: 'Tallerista',
      especialidad: 'Coordinador de Taller de Patrimonio',
      experiencia: 'Universidad de Santiago',
      email: 'daniel@example.com',
      telefono: '+56 9 5555 6666',
      rut: '11.222.333-4',
      direccion: 'Pasaje Las Flores 789, Las Condes, Región Metropolitana'
    }
  ];

  constructor() {
    // Cargar desde localStorage (SSR-safe)
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('app.colaboradores');
      if (saved) {
        try { 
          const colaboradoresGuardados = JSON.parse(saved) as any[];
          // Migrar datos: cambiar "Tutor" por "Supervisor"
          this.colaboradores = colaboradoresGuardados.map(c => ({
            ...c,
            role: c.role === 'Tutor' ? 'Supervisor' : c.role
          })) as Colaborador[];
          // Guardar los datos migrados
          this.persist();
        } catch {}
      }
    }
  }

  // navegación
  goBack() { this.router.navigate(['/dashboard']); }

  // detalles
  viewDetails(colaborador: Colaborador) {
    this.selectedColaborador = colaborador;
  }

  closeDetails() {
    this.selectedColaborador = null;
  }

  // UI
  toggleForm() { 
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.isEditing = false;
      this.editingColaborador = null;
      this.resetForm();
    }
  }

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
    if (!c?.nombre || !c?.email || !c?.role) {
      this.snack.open('Completa nombre, email y rol.', 'Cerrar', { duration: 2500 });
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
      centro_educativo: 'Sin especificar', // Valor por defecto
      role: c.role as RolColaborador,
      especialidad: c.especialidad?.trim(),
      experiencia: c.experiencia?.trim(),
      telefono: c.telefono?.trim(),
      rut: c.rut?.trim(),
      direccion: c.direccion?.trim()
    };

    this.colaboradores.unshift(nuevo);
    this.persist();
    
    // Alerta bonita y personalizada
    this.snack.open(
      `✓ ${nuevo.nombre} agregado como ${nuevo.role}`, 
      'Cerrar', 
      { 
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['success-snackbar']
      }
    );

    // reset form (mantengo rol por comodidad)
    this.resetForm();
    this.showForm = false;
  }

  // eliminar
  remove(c: Colaborador) {
    this.colaboradorToDelete = c;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (this.colaboradorToDelete) {
      this.colaboradores = this.colaboradores.filter(x => x.email !== this.colaboradorToDelete!.email);
      this.persist();
      
      // Alerta de éxito
      this.snack.open(
        `✓ ${this.colaboradorToDelete.nombre} eliminado exitosamente`, 
        'Cerrar', 
        { 
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        }
      );
      
      this.closeDeleteConfirm();
    }
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
    this.colaboradorToDelete = null;
  }

  // filtros
  filtered() {
    const term = this.searchTerm.toLowerCase().trim();
    return this.colaboradores.filter(c => {
      const matchSearch =
        !term ||
        c.nombre.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        (c.especialidad && c.especialidad.toLowerCase().includes(term));

      const matchRole = this.selectedRole === 'all' || c.role === this.selectedRole;

      return matchSearch && matchRole;
    });
  }

  // Funciones de edición
  editColaborador(colaborador: Colaborador) {
    this.isEditing = true;
    this.editingColaborador = colaborador;
    this.selectedColaborador = null; // Cerrar modal
    
    // Cargar datos del colaborador al formulario
    this.newColaborador = {
      nombre: colaborador.nombre,
      email: colaborador.email,
      role: colaborador.role,
      especialidad: colaborador.especialidad,
      experiencia: colaborador.experiencia,
      telefono: colaborador.telefono,
      rut: colaborador.rut,
      direccion: colaborador.direccion
    };
    
    this.showForm = true;
  }

  updateColaborador() {
    const c = this.newColaborador;
    const colaboradorOriginal = this.editingColaborador;

    // validación mínima
    if (!c?.nombre || !c?.email || !c?.role) {
      this.snack.open('Completa nombre, email y rol.', 'Cerrar', { duration: 2500 });
      return;
    }

    // evitar duplicados por email (excepto el mismo colaborador)
    const exists = this.colaboradores.some(x => 
      x.email.trim().toLowerCase() === c.email!.trim().toLowerCase() && 
      x.email !== colaboradorOriginal?.email
    );
    if (exists) {
      this.snack.open('Ya existe un colaborador con ese email.', 'Cerrar', { duration: 2500 });
      return;
    }

    // Actualizar colaborador
    if (colaboradorOriginal) {
      const index = this.colaboradores.findIndex(x => x.email === colaboradorOriginal.email);
      if (index !== -1) {
        this.colaboradores[index] = {
          ...colaboradorOriginal,
          nombre: c.nombre!.trim(),
          email: c.email!.trim(),
          role: c.role as RolColaborador,
          especialidad: c.especialidad?.trim(),
          experiencia: c.experiencia?.trim(),
          telefono: c.telefono?.trim(),
          rut: c.rut?.trim(),
          direccion: c.direccion?.trim()
        };
      }
    }

    this.persist();
    
    // Alerta de éxito
    this.snack.open(
      `✓ ${c.nombre} actualizado exitosamente`, 
      'Cerrar', 
      { 
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['success-snackbar']
      }
    );

    // Reset y cerrar
    this.resetForm();
    this.isEditing = false;
    this.editingColaborador = null;
    this.showForm = false;
  }

  private resetForm() {
    this.newColaborador = { role: 'Supervisor' };
  }

}
