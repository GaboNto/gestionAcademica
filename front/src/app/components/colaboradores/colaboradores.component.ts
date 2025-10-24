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
  centroEducativo: string;
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

  // Interfaz de usuario
  mostrarFormulario = false;
  colaboradorSeleccionado: Colaborador | null = null;
  estaEditando = false;
  colaboradorEditando: Colaborador | null = null;
  mostrarConfirmarEliminar = false;
  colaboradorAEliminar: Colaborador | null = null;

  // Filtros
  terminoBusqueda = '';
  rolSeleccionado: 'all' | RolColaborador = 'all';

  // Formulario
  nuevoColaborador: Partial<Colaborador> = {
    role: 'Supervisor'
  };

  // Datos
  colaboradores: Colaborador[] = [
    {
      nombre: 'Juan Pérez',
      centroEducativo: 'Colegio A',
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
      centroEducativo: 'Colegio B',
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
      centroEducativo: 'Colegio C',
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
      const guardado = localStorage.getItem('app.colaboradores');
      if (guardado) {
        try { 
          const colaboradoresGuardados = JSON.parse(guardado) as any[];
          // Migrar datos: cambiar "Tutor" por "Supervisor"
          this.colaboradores = colaboradoresGuardados.map(c => ({
            ...c,
            role: c.role === 'Tutor' ? 'Supervisor' : c.role
          })) as Colaborador[];
          // Guardar los datos migrados
          this.persistir();
        } catch {}
      }
    }
  }

  // Navegación
  volverAtras() { this.router.navigate(['/dashboard']); }

  // Detalles
  verDetalles(colaborador: Colaborador) {
    this.colaboradorSeleccionado = colaborador;
  }

  cerrarDetalles() {
    this.colaboradorSeleccionado = null;
  }

  // Interfaz de usuario
  alternarFormulario() { 
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.estaEditando = false;
      this.colaboradorEditando = null;
      this.resetearFormulario();
    }
  }

  // Persistencia
  private persistir() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('app.colaboradores', JSON.stringify(this.colaboradores));
    }
  }

  // Agregar
  agregarColaborador() {
    const c = this.nuevoColaborador;

    // Validación mínima
    if (!c?.nombre || !c?.email || !c?.role) {
      this.snack.open('Completa nombre, email y rol.', 'Cerrar', { duration: 2500 });
      return;
    }
    // Evitar duplicados por email
    const existe = this.colaboradores.some(x => x.email.trim().toLowerCase() === c.email!.trim().toLowerCase());
    if (existe) {
      this.snack.open('Ya existe un colaborador con ese email.', 'Cerrar', { duration: 2500 });
      return;
    }

    const nuevo: Colaborador = {
      nombre: c.nombre.trim(),
      email: c.email!.trim(),
      centroEducativo: 'Sin especificar', // Valor por defecto
      role: c.role as RolColaborador,
      especialidad: c.especialidad?.trim(),
      experiencia: c.experiencia?.trim(),
      telefono: c.telefono?.trim(),
      rut: c.rut?.trim(),
      direccion: c.direccion?.trim()
    };

    this.colaboradores.unshift(nuevo);
    this.persistir();
    
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

    // Resetear formulario (mantengo rol por comodidad)
    this.resetearFormulario();
    this.mostrarFormulario = false;
  }

  // Eliminar
  eliminar(c: Colaborador) {
    this.colaboradorAEliminar = c;
    this.mostrarConfirmarEliminar = true;
  }

  confirmarEliminar() {
    if (this.colaboradorAEliminar) {
      this.colaboradores = this.colaboradores.filter(x => x.email !== this.colaboradorAEliminar!.email);
      this.persistir();
      
      // Alerta de éxito
      this.snack.open(
        `✓ ${this.colaboradorAEliminar.nombre} eliminado exitosamente`, 
        'Cerrar', 
        { 
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        }
      );
      
      this.cerrarConfirmarEliminar();
    }
  }

  cerrarConfirmarEliminar() {
    this.mostrarConfirmarEliminar = false;
    this.colaboradorAEliminar = null;
  }

  // Filtros
  filtrados() {
    const termino = this.terminoBusqueda.toLowerCase().trim();
    return this.colaboradores.filter(c => {
      const coincideBusqueda =
        !termino ||
        c.nombre.toLowerCase().includes(termino) ||
        c.email.toLowerCase().includes(termino) ||
        (c.especialidad && c.especialidad.toLowerCase().includes(termino));

      const coincideRol = this.rolSeleccionado === 'all' || c.role === this.rolSeleccionado;

      return coincideBusqueda && coincideRol;
    });
  }

  // Funciones de edición
  editarColaborador(colaborador: Colaborador) {
    this.estaEditando = true;
    this.colaboradorEditando = colaborador;
    this.colaboradorSeleccionado = null; // Cerrar modal
    
    // Cargar datos del colaborador al formulario
    this.nuevoColaborador = {
      nombre: colaborador.nombre,
      email: colaborador.email,
      role: colaborador.role,
      especialidad: colaborador.especialidad,
      experiencia: colaborador.experiencia,
      telefono: colaborador.telefono,
      rut: colaborador.rut,
      direccion: colaborador.direccion
    };
    
    this.mostrarFormulario = true;
  }

  actualizarColaborador() {
    const c = this.nuevoColaborador;
    const colaboradorOriginal = this.colaboradorEditando;

    // Validación mínima
    if (!c?.nombre || !c?.email || !c?.role) {
      this.snack.open('Completa nombre, email y rol.', 'Cerrar', { duration: 2500 });
      return;
    }

    // Evitar duplicados por email (excepto el mismo colaborador)
    const existe = this.colaboradores.some(x => 
      x.email.trim().toLowerCase() === c.email!.trim().toLowerCase() && 
      x.email !== colaboradorOriginal?.email
    );
    if (existe) {
      this.snack.open('Ya existe un colaborador con ese email.', 'Cerrar', { duration: 2500 });
      return;
    }

    // Actualizar colaborador
    if (colaboradorOriginal) {
      const indice = this.colaboradores.findIndex(x => x.email === colaboradorOriginal.email);
      if (indice !== -1) {
        this.colaboradores[indice] = {
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

    this.persistir();
    
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

    // Resetear y cerrar
    this.resetearFormulario();
    this.estaEditando = false;
    this.colaboradorEditando = null;
    this.mostrarFormulario = false;
  }

  private resetearFormulario() {
    this.nuevoColaborador = { role: 'Supervisor' };
  }

}
