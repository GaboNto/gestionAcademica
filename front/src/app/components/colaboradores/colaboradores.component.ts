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

// Servicios y tipos
import { ColaboradoresService, Colaborador } from '../../services/colaboradores.service';

type TipoColaborador = 'COLABORADOR' | 'TUTOR' | 'TALLERISTA';

// Interfaz local para el formulario (compatible con la API)
interface ColaboradorForm {
  rut: string;
  nombre: string;
  correo?: string;
  telefono?: string | number;
  tipo?: TipoColaborador;
  cargo?: string;
  universidad_egreso?: string;
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
  private colaboradoresService = inject(ColaboradoresService);

  // Interfaz de usuario
  mostrarFormulario = false;
  colaboradorSeleccionado: Colaborador | null = null;
  estaEditando = false;
  colaboradorEditando: Colaborador | null = null;
  mostrarConfirmarEliminar = false;
  colaboradorAEliminar: Colaborador | null = null;
  cargando = false;

  // Filtros
  terminoBusqueda = '';
  rolSeleccionado: 'all' | TipoColaborador = 'all';

  // Formulario
  nuevoColaborador: Partial<ColaboradorForm> = {
    tipo: 'COLABORADOR'
  };

  // Datos
  colaboradores: Colaborador[] = [];

  constructor() {
    this.cargarColaboradores();
  }

  // Cargar colaboradores desde la API
  cargarColaboradores() {
    this.cargando = true;
    const params: any = { page: 1, limit: 100 };
    
    if (this.rolSeleccionado !== 'all') {
      params.tipo = this.rolSeleccionado;
    }
    
    if (this.terminoBusqueda.trim()) {
      params.search = this.terminoBusqueda.trim();
    }

    this.colaboradoresService.listar(params).subscribe({
      next: (response) => {
        this.colaboradores = response.items;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar colaboradores:', err);
        this.snack.open('Error al cargar colaboradores', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      }
    });
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

  // Agregar
  agregarColaborador() {
    const c = this.nuevoColaborador;

    // Validación mínima
    if (!c?.rut || !c?.nombre) {
      this.snack.open('Completa RUT y nombre.', 'Cerrar', { duration: 2500 });
      return;
    }

    // Preparar datos para enviar a la API (convertir telefono a número si existe)
    const datosParaEnviar = {
      ...c,
      telefono: c.telefono ? Number(c.telefono) : undefined
    };

    this.colaboradoresService.crear(datosParaEnviar as any).subscribe({
      next: () => {
        this.snack.open(
          `✓ ${c.nombre} agregado correctamente`, 
          'Cerrar', 
          { 
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          }
        );
        this.resetearFormulario();
        this.mostrarFormulario = false;
        this.cargarColaboradores();
      },
      error: (err) => {
        console.error('Error al crear colaborador:', err);
        this.snack.open('Error al crear colaborador', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Eliminar
  eliminar(c: Colaborador) {
    this.colaboradorAEliminar = c;
    this.mostrarConfirmarEliminar = true;
  }

  confirmarEliminar() {
    if (this.colaboradorAEliminar?.id) {
      this.colaboradoresService.eliminar(this.colaboradorAEliminar.id).subscribe({
        next: () => {
          this.snack.open(
            `✓ ${this.colaboradorAEliminar!.nombre} eliminado exitosamente`, 
            'Cerrar', 
            { 
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['success-snackbar']
            }
          );
          this.cerrarConfirmarEliminar();
          this.cargarColaboradores();
        },
        error: (err) => {
          console.error('Error al eliminar colaborador:', err);
          this.snack.open('Error al eliminar colaborador', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  cerrarConfirmarEliminar() {
    this.mostrarConfirmarEliminar = false;
    this.colaboradorAEliminar = null;
  }

  // Filtros - aplicados directamente en la API
  filtrados() {
    return this.colaboradores;
  }

  // Aplicar filtros (recargar desde la API)
  aplicarFiltros() {
    this.cargarColaboradores();
  }

  // Funciones de edición
  editarColaborador(colaborador: Colaborador) {
    this.estaEditando = true;
    this.colaboradorEditando = colaborador;
    this.colaboradorSeleccionado = null; // Cerrar modal
    
    // Cargar datos del colaborador al formulario
    this.nuevoColaborador = {
      rut: colaborador.rut,
      nombre: colaborador.nombre,
      correo: colaborador.correo,
      tipo: colaborador.tipo,
      cargo: colaborador.cargo,
      universidad_egreso: colaborador.universidad_egreso,
      telefono: colaborador.telefono,
      direccion: colaborador.direccion
    };
    
    this.mostrarFormulario = true;
  }

  actualizarColaborador() {
    const c = this.nuevoColaborador;
    const colaboradorOriginal = this.colaboradorEditando;

    // Validación mínima
    if (!c?.rut || !c?.nombre) {
      this.snack.open('Completa RUT y nombre.', 'Cerrar', { duration: 2500 });
      return;
    }

    // Preparar datos para enviar a la API (convertir telefono a número si existe)
    const datosParaEnviar = {
      ...c,
      telefono: c.telefono ? Number(c.telefono) : undefined
    };

    // Actualizar colaborador
    if (colaboradorOriginal?.id) {
      this.colaboradoresService.actualizar(colaboradorOriginal.id, datosParaEnviar as any).subscribe({
        next: () => {
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
          this.resetearFormulario();
          this.estaEditando = false;
          this.colaboradorEditando = null;
          this.mostrarFormulario = false;
          this.cargarColaboradores();
        },
        error: (err) => {
          console.error('Error al actualizar colaborador:', err);
          this.snack.open('Error al actualizar colaborador', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  private resetearFormulario() {
    this.nuevoColaborador = { tipo: 'COLABORADOR' };
  }

}
