import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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

type TipoColaborador = 'Colaborador' | 'Supervisor' | 'Tallerista';

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
    CommonModule, FormsModule, ReactiveFormsModule,
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
  private fb = inject(FormBuilder);

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

  // Formulario reactivo
  formularioColaborador!: FormGroup;

  // Datos - todos los colaboradores sin filtrar
  colaboradores: Colaborador[] = [];
  todosLosColaboradores: Colaborador[] = []; // Lista completa para filtrado local

  constructor() {
    this.inicializarFormulario();
    this.cargarTodosLosColaboradores();
  }

  // Validador personalizado para RUT chileno (básico)
  validarRut(control: AbstractControl): ValidationErrors | null {
    const rut = control.value;
    if (!rut) return null;

    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '').trim();
    
    // Validar longitud (3-20 caracteres según backend)
    if (rutLimpio.length < 3 || rutLimpio.length > 20) {
      return { rutInvalido: true, mensaje: 'RUT debe tener entre 3 y 20 caracteres' };
    }

    // Validar que contenga solo números y posible K/k al final (formato flexible)
    const rutRegex = /^[0-9]+[0-9kK]?$/;
    if (!rutRegex.test(rutLimpio)) {
      return { rutInvalido: true, mensaje: 'RUT solo puede contener números y letra K (ej: 12345678-9 o 12345678-K)' };
    }

    return null;
  }

  // Validador personalizado para teléfono (debe ser numérico)
  validarTelefono(control: AbstractControl): ValidationErrors | null {
    const telefono = control.value;
    if (!telefono) return null;

    // Si es string, verificar que sean solo números
    if (typeof telefono === 'string' && !/^\d+$/.test(telefono)) {
      return { telefonoInvalido: true, mensaje: 'El teléfono debe contener solo números' };
    }

    // Verificar que sea un número positivo
    const num = Number(telefono);
    if (isNaN(num) || num < 0) {
      return { telefonoInvalido: true, mensaje: 'El teléfono debe ser un número válido' };
    }

    return null;
  }

  // Inicializar formulario reactivo con validaciones
  inicializarFormulario() {
    this.formularioColaborador = this.fb.group({
      rut: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), this.validarRut]],
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
      correo: ['', [Validators.email]],
      telefono: ['', [this.validarTelefono]],
      direccion: [''],
      tipo: ['Colaborador', [Validators.required]],
      cargo: [''],
      universidad_egreso: ['']
    });
  }

  // Cargar todos los colaboradores desde la API (sin filtros para búsqueda local)
  cargarTodosLosColaboradores() {
    this.cargando = true;
    // Cargar un número grande de colaboradores para filtrar localmente
    const params: any = { page: 1, limit: 1000 };

    this.colaboradoresService.listar(params).subscribe({
      next: (response) => {
        this.todosLosColaboradores = response.items || [];
        this.colaboradores = this.todosLosColaboradores;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar colaboradores:', err);
        this.snack.open('Error al cargar colaboradores', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      }
    });
  }

  // Cargar colaboradores (para cuando se agrega/edita/elimina)
  cargarColaboradores() {
    this.cargarTodosLosColaboradores();
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
    } else {
      // Inicializar formulario cuando se abre
      if (!this.estaEditando) {
        this.inicializarFormulario();
      }
    }
  }

  // Agregar
  agregarColaborador() {
    // Marcar todos los campos como tocados para mostrar errores
    if (this.formularioColaborador.invalid) {
      this.formularioColaborador.markAllAsTouched();
      
      // Obtener el primer error y mostrarlo
      const errores = this.obtenerErrores();
      if (errores.length > 0) {
        this.snack.open(errores[0], 'Cerrar', { duration: 4000 });
      } else {
        this.snack.open('Por favor, completa todos los campos requeridos correctamente', 'Cerrar', { duration: 3000 });
      }
      return;
    }

    const valores = this.formularioColaborador.value;

    // Preparar datos para enviar a la API
    const datosParaEnviar: any = {
      rut: valores.rut?.trim(),
      nombre: valores.nombre?.trim(),
      tipo: valores.tipo || 'Colaborador'
    };

    // Agregar campos opcionales solo si tienen valor
    if (valores.correo?.trim()) {
      datosParaEnviar.correo = valores.correo.trim();
    }
    if (valores.telefono) {
      datosParaEnviar.telefono = Number(valores.telefono);
    }
    if (valores.direccion?.trim()) {
      datosParaEnviar.direccion = valores.direccion.trim();
    }
    if (valores.cargo?.trim()) {
      datosParaEnviar.cargo = valores.cargo.trim();
    }
    if (valores.universidad_egreso?.trim()) {
      datosParaEnviar.universidad_egreso = valores.universidad_egreso.trim();
    }

    this.colaboradoresService.crear(datosParaEnviar).subscribe({
      next: () => {
        this.snack.open(
          `✓ ${datosParaEnviar.nombre} agregado correctamente`, 
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
        let mensajeError = 'Error al crear colaborador';
        
        // Intentar obtener mensaje de error del backend
        if (err?.error?.message) {
          mensajeError = err.error.message;
        } else if (err?.error?.error) {
          mensajeError = err.error.error;
        } else if (Array.isArray(err?.error?.message)) {
          mensajeError = err.error.message.join(', ');
        }
        
        this.snack.open(mensajeError, 'Cerrar', { duration: 4000 });
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

  // Filtros - aplicados localmente en el frontend
  get filtrados(): Colaborador[] {
    let resultado = [...this.todosLosColaboradores];

    // Filtrar por término de búsqueda (búsqueda inteligente)
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.trim().toLowerCase();
      resultado = resultado.filter(colaborador => {
        // Buscar en múltiples campos de forma inteligente
        const nombre = (colaborador.nombre || '').toLowerCase();
        const correo = (colaborador.correo || '').toLowerCase();
        const cargo = (colaborador.cargo || '').toLowerCase();
        const rut = (colaborador.rut || '').toLowerCase();
        const direccion = (colaborador.direccion || '').toLowerCase();
        const universidad = (colaborador.universidad_egreso || '').toLowerCase();
        const tipo = (colaborador.tipo || '').toLowerCase();

        return (
          nombre.includes(termino) ||
          correo.includes(termino) ||
          cargo.includes(termino) ||
          rut.includes(termino) ||
          direccion.includes(termino) ||
          universidad.includes(termino) ||
          tipo.includes(termino)
        );
      });
    }

    // Filtrar por rol
    if (this.rolSeleccionado !== 'all') {
      resultado = resultado.filter(colaborador => colaborador.tipo === this.rolSeleccionado);
    }

    return resultado;
  }

  // Aplicar filtros (filtrado local, no recarga desde API)
  aplicarFiltros() {
    // El filtrado se hace automáticamente mediante el getter filtrados
    // Este método se mantiene para compatibilidad con el evento selectionChange del select
  }

  // Funciones de edición
  editarColaborador(colaborador: Colaborador) {
    this.estaEditando = true;
    this.colaboradorEditando = colaborador;
    this.colaboradorSeleccionado = null; // Cerrar modal
    
    // Cargar datos del colaborador al formulario reactivo
    this.formularioColaborador.patchValue({
      rut: colaborador.rut || '',
      nombre: colaborador.nombre || '',
      correo: colaborador.correo || '',
      tipo: colaborador.tipo || 'Colaborador',
      cargo: colaborador.cargo || '',
      universidad_egreso: colaborador.universidad_egreso || '',
      telefono: colaborador.telefono || '',
      direccion: colaborador.direccion || ''
    });
    
    this.mostrarFormulario = true;
  }

  actualizarColaborador() {
    const colaboradorOriginal = this.colaboradorEditando;

    // Marcar todos los campos como tocados para mostrar errores
    if (this.formularioColaborador.invalid) {
      this.formularioColaborador.markAllAsTouched();
      
      // Obtener el primer error y mostrarlo
      const errores = this.obtenerErrores();
      if (errores.length > 0) {
        this.snack.open(errores[0], 'Cerrar', { duration: 4000 });
      } else {
        this.snack.open('Por favor, completa todos los campos requeridos correctamente', 'Cerrar', { duration: 3000 });
      }
      return;
    }

    if (!colaboradorOriginal?.id) {
      this.snack.open('Error: No se pudo identificar el colaborador a actualizar', 'Cerrar', { duration: 3000 });
      return;
    }

    const valores = this.formularioColaborador.value;

    // Preparar datos para enviar a la API
    const datosParaEnviar: any = {
      rut: valores.rut?.trim(),
      nombre: valores.nombre?.trim(),
      tipo: valores.tipo || 'Colaborador'
    };

    // Agregar campos opcionales solo si tienen valor
    if (valores.correo?.trim()) {
      datosParaEnviar.correo = valores.correo.trim();
    }
    if (valores.telefono) {
      datosParaEnviar.telefono = Number(valores.telefono);
    }
    if (valores.direccion?.trim()) {
      datosParaEnviar.direccion = valores.direccion.trim();
    }
    if (valores.cargo?.trim()) {
      datosParaEnviar.cargo = valores.cargo.trim();
    }
    if (valores.universidad_egreso?.trim()) {
      datosParaEnviar.universidad_egreso = valores.universidad_egreso.trim();
    }

    this.colaboradoresService.actualizar(colaboradorOriginal.id, datosParaEnviar).subscribe({
      next: () => {
        this.snack.open(
          `✓ ${datosParaEnviar.nombre} actualizado exitosamente`, 
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
        let mensajeError = 'Error al actualizar colaborador';
        
        // Intentar obtener mensaje de error del backend
        if (err?.error?.message) {
          mensajeError = err.error.message;
        } else if (err?.error?.error) {
          mensajeError = err.error.error;
        } else if (Array.isArray(err?.error?.message)) {
          mensajeError = err.error.message.join(', ');
        }
        
        this.snack.open(mensajeError, 'Cerrar', { duration: 4000 });
      }
    });
  }

  private resetearFormulario() {
    this.inicializarFormulario();
  }

  // Obtener mensajes de error del formulario
  obtenerErrores(): string[] {
    const errores: string[] = [];
    const form = this.formularioColaborador;

    // RUT
    if (form.get('rut')?.hasError('required')) {
      errores.push('El RUT es obligatorio');
    } else if (form.get('rut')?.hasError('minlength')) {
      errores.push('El RUT debe tener al menos 3 caracteres');
    } else if (form.get('rut')?.hasError('maxlength')) {
      errores.push('El RUT no puede tener más de 20 caracteres');
    } else if (form.get('rut')?.hasError('rutInvalido')) {
      errores.push(form.get('rut')?.errors?.['mensaje'] || 'RUT inválido');
    }

    // Nombre
    if (form.get('nombre')?.hasError('required')) {
      errores.push('El nombre es obligatorio');
    } else if (form.get('nombre')?.hasError('minlength')) {
      errores.push('El nombre debe tener al menos 3 caracteres');
    } else if (form.get('nombre')?.hasError('maxlength')) {
      errores.push('El nombre no puede tener más de 120 caracteres');
    }

    // Correo
    if (form.get('correo')?.hasError('email')) {
      errores.push('El correo electrónico no tiene un formato válido');
    }

    // Teléfono
    if (form.get('telefono')?.hasError('telefonoInvalido')) {
      errores.push(form.get('telefono')?.errors?.['mensaje'] || 'Teléfono inválido');
    }

    // Tipo
    if (form.get('tipo')?.hasError('required')) {
      errores.push('El rol es obligatorio');
    }

    return errores;
  }

  // Métodos auxiliares para obtener errores de campos específicos (para mostrar en el template)
  getErrorRut(): string {
    const control = this.formularioColaborador.get('rut');
    if (control?.hasError('required')) return 'El RUT es obligatorio';
    if (control?.hasError('minlength')) return 'El RUT debe tener al menos 3 caracteres';
    if (control?.hasError('maxlength')) return 'El RUT no puede tener más de 20 caracteres';
    if (control?.hasError('rutInvalido')) return control.errors?.['mensaje'] || 'RUT inválido';
    return '';
  }

  getErrorNombre(): string {
    const control = this.formularioColaborador.get('nombre');
    if (control?.hasError('required')) return 'El nombre es obligatorio';
    if (control?.hasError('minlength')) return 'El nombre debe tener al menos 3 caracteres';
    if (control?.hasError('maxlength')) return 'El nombre no puede tener más de 120 caracteres';
    return '';
  }

  getErrorCorreo(): string {
    const control = this.formularioColaborador.get('correo');
    if (control?.hasError('email')) return 'Correo electrónico inválido';
    return '';
  }

  getErrorTelefono(): string {
    const control = this.formularioColaborador.get('telefono');
    if (control?.hasError('telefonoInvalido')) return control.errors?.['mensaje'] || 'Teléfono inválido';
    return '';
  }

}
