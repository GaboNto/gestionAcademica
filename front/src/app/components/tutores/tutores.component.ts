import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TutoresService, Tutor } from '../../services/tutores.service';

interface TutorForm {
  rut: string;
  nombre: string;
  correo?: string;
  telefono?: string | number;
  cargo1?: string;
  cargo2?: string;
  universidad_egreso?: string;
  direccion?: string;
}

@Component({
  standalone: true,
  selector: 'app-tutores',
  templateUrl: './tutores.component.html',
  styleUrls: ['./tutores.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
})
export class TutoresComponent {
  private snack = inject(MatSnackBar);
  private router = inject(Router);
  private tutoresService = inject(TutoresService);
  private fb = inject(FormBuilder);

  mostrarFormulario = false;
  tutorSeleccionado: Tutor | null = null;
  estaEditando = false;
  tutorEditando: Tutor | null = null;
  mostrarConfirmarEliminar = false;
  tutorAEliminar: Tutor | null = null;
  cargando = false;

  terminoBusqueda = '';

  formularioTutor!: FormGroup;

  tutores: Tutor[] = [];
  todosLosTutores: Tutor[] = [];

  constructor() {
    this.inicializarFormulario();
    this.cargarTodosLosTutores();
  }

  validarRut(control: AbstractControl): ValidationErrors | null {
    const rut = control.value;
    if (!rut) return null;

    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '').trim();

    if (rutLimpio.length < 3 || rutLimpio.length > 20) {
      return { rutInvalido: true, mensaje: 'RUT debe tener entre 3 y 20 caracteres' };
    }

    const rutRegex = /^[0-9]+[0-9kK]?$/;
    if (!rutRegex.test(rutLimpio)) {
      return { rutInvalido: true, mensaje: 'RUT solo puede contener números y letra K (ej: 12345678-9 o 12345678-K)' };
    }

    return null;
  }

  validarTelefono(control: AbstractControl): ValidationErrors | null {
    const telefono = control.value;
    if (!telefono) return null;

    if (typeof telefono === 'string' && !/^\d+$/.test(telefono)) {
      return { telefonoInvalido: true, mensaje: 'El teléfono debe contener solo números' };
    }

    const num = Number(telefono);
    if (isNaN(num) || num < 0) {
      return { telefonoInvalido: true, mensaje: 'El teléfono debe ser un número válido' };
    }

    return null;
  }

  inicializarFormulario() {
    this.formularioTutor = this.fb.group({
      rut: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), this.validarRut.bind(this)]],
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
      correo: ['', [Validators.email]],
      telefono: ['', [this.validarTelefono.bind(this)]],
      direccion: [''],
      cargo1: [''],
      cargo2: [''],
      universidad_egreso: [''],
    });
  }

  cargarTodosLosTutores() {
    this.cargando = true;
    const params: any = { page: 1, limit: 1000 };

    this.tutoresService.listar(params).subscribe({
      next: (response) => {
        this.todosLosTutores = response.items || [];
        this.tutores = this.todosLosTutores;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar tutores:', err);
        this.snack.open('Error al cargar tutores', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      },
    });
  }

  cargarTutores() {
    this.cargarTodosLosTutores();
  }

  volverAtras() {
    this.router.navigate(['/dashboard']);
  }

  verDetalles(tutor: Tutor) {
    this.tutorSeleccionado = tutor;
  }

  cerrarDetalles() {
    this.tutorSeleccionado = null;
  }

  alternarFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.estaEditando = false;
      this.tutorEditando = null;
      this.resetearFormulario();
    } else if (!this.estaEditando) {
      this.inicializarFormulario();
    }
  }

  agregarTutor() {
    if (this.formularioTutor.invalid) {
      this.formularioTutor.markAllAsTouched();
      const errores = this.obtenerErrores();
      if (errores.length > 0) {
        this.snack.open(errores[0], 'Cerrar', { duration: 4000 });
      } else {
        this.snack.open('Por favor, completa todos los campos requeridos correctamente', 'Cerrar', { duration: 3000 });
      }
      return;
    }

    const valores = this.formularioTutor.value as TutorForm;

    const datosParaEnviar: any = {
      rut: valores.rut?.trim(),
      nombre: valores.nombre?.trim(),
    };

    if (valores.correo?.trim()) {
      datosParaEnviar.correo = valores.correo.trim();
    }
    if (valores.telefono) {
      datosParaEnviar.telefono = Number(valores.telefono);
    }
    if (valores.direccion?.trim()) {
      datosParaEnviar.direccion = valores.direccion.trim();
    }
    const cargos: string[] = [valores.cargo1, valores.cargo2]
      .filter((c): c is string => !!c && !!c.trim())
      .map((c) => c.trim());
    if (cargos.length) datosParaEnviar.cargos = cargos;
    if (valores.universidad_egreso?.trim()) {
      datosParaEnviar.universidad_egreso = valores.universidad_egreso.trim();
    }

    this.tutoresService.crear(datosParaEnviar).subscribe({
      next: () => {
        this.snack.open(
          `✓ ${datosParaEnviar.nombre} agregado correctamente`,
          'Cerrar',
          {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar'],
          },
        );
        this.resetearFormulario();
        this.mostrarFormulario = false;
        this.cargarTutores();
      },
      error: (err) => {
        console.error('Error al crear tutor:', err);
        let mensajeError = 'Error al crear tutor';

        if (err?.error?.message) {
          mensajeError = err.error.message;
        } else if (err?.error?.error) {
          mensajeError = err.error.error;
        } else if (Array.isArray(err?.error?.message)) {
          mensajeError = err.error.message.join(', ');
        }

        this.snack.open(mensajeError, 'Cerrar', { duration: 4000 });
      },
    });
  }

  eliminar(tutor: Tutor) {
    this.tutorAEliminar = tutor;
    this.mostrarConfirmarEliminar = true;
  }

  confirmarEliminar() {
    if (this.tutorAEliminar?.id) {
      this.tutoresService.eliminar(this.tutorAEliminar.id).subscribe({
        next: () => {
          this.snack.open(
            `✓ ${this.tutorAEliminar!.nombre} eliminado exitosamente`,
            'Cerrar',
            {
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['success-snackbar'],
            },
          );
          this.cerrarConfirmarEliminar();
          this.cargarTutores();
        },
        error: (err) => {
          console.error('Error al eliminar tutor:', err);
          this.snack.open('Error al eliminar tutor', 'Cerrar', { duration: 3000 });
        },
      });
    }
  }

  cerrarConfirmarEliminar() {
    this.mostrarConfirmarEliminar = false;
    this.tutorAEliminar = null;
  }

  get filtrados(): Tutor[] {
    let resultado = [...this.todosLosTutores];

    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.trim().toLowerCase();
      resultado = resultado.filter((tutor) => {
        const nombre = (tutor.nombre || '').toLowerCase();
        const correo = (tutor.correo || '').toLowerCase();
        const cargo = (tutor.cargo || '').toLowerCase();
        const rut = (tutor.rut || '').toLowerCase();
        const direccion = (tutor.direccion || '').toLowerCase();
        const universidad = (tutor.universidad_egreso || '').toLowerCase();

        return (
          nombre.includes(termino) ||
          correo.includes(termino) ||
          cargo.includes(termino) ||
          rut.includes(termino) ||
          direccion.includes(termino) ||
          universidad.includes(termino)
        );
      });
    }

    return resultado;
  }

  aplicarFiltros() {
    // Filtrado local; método reservado para futuros cambios.
  }

  editarTutor(tutor: Tutor) {
    this.estaEditando = true;
    this.tutorEditando = tutor;
    this.tutorSeleccionado = null;

    const [c1, c2] = (tutor.cargo || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    this.formularioTutor.patchValue({
      rut: tutor.rut || '',
      nombre: tutor.nombre || '',
      correo: tutor.correo || '',
      cargo1: c1 || '',
      cargo2: c2 || '',
      universidad_egreso: tutor.universidad_egreso || '',
      telefono: tutor.telefono || '',
      direccion: tutor.direccion || '',
    });

    this.mostrarFormulario = true;
  }

  actualizarTutor() {
    const tutorOriginal = this.tutorEditando;

    if (this.formularioTutor.invalid) {
      this.formularioTutor.markAllAsTouched();
      const errores = this.obtenerErrores();
      if (errores.length > 0) {
        this.snack.open(errores[0], 'Cerrar', { duration: 4000 });
      } else {
        this.snack.open('Por favor, completa todos los campos requeridos correctamente', 'Cerrar', { duration: 3000 });
      }
      return;
    }

    if (!tutorOriginal?.id) {
      this.snack.open('Error: No se pudo identificar el tutor a actualizar', 'Cerrar', { duration: 3000 });
      return;
    }

    const valores = this.formularioTutor.value as TutorForm;

    const datosParaEnviar: any = {
      rut: valores.rut?.trim(),
      nombre: valores.nombre?.trim(),
    };

    if (valores.correo?.trim()) {
      datosParaEnviar.correo = valores.correo.trim();
    }
    if (valores.telefono) {
      datosParaEnviar.telefono = Number(valores.telefono);
    }
    if (valores.direccion?.trim()) {
      datosParaEnviar.direccion = valores.direccion.trim();
    }
    const cargosUpd: string[] = [valores.cargo1, valores.cargo2]
      .filter((c): c is string => !!c && !!c.trim())
      .map((c) => c.trim());
    datosParaEnviar.cargos = cargosUpd;
    if (valores.universidad_egreso?.trim()) {
      datosParaEnviar.universidad_egreso = valores.universidad_egreso.trim();
    }

    this.tutoresService.actualizar(tutorOriginal.id, datosParaEnviar).subscribe({
      next: () => {
        this.snack.open(
          `✓ ${datosParaEnviar.nombre} actualizado exitosamente`,
          'Cerrar',
          {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar'],
          },
        );
        this.resetearFormulario();
        this.estaEditando = false;
        this.tutorEditando = null;
        this.mostrarFormulario = false;
        this.cargarTutores();
      },
      error: (err) => {
        console.error('Error al actualizar tutor:', err);
        let mensajeError = 'Error al actualizar tutor';

        if (err?.error?.message) {
          mensajeError = err.error.message;
        } else if (err?.error?.error) {
          mensajeError = err.error.error;
        } else if (Array.isArray(err?.error?.message)) {
          mensajeError = err.error.message.join(', ');
        }

        this.snack.open(mensajeError, 'Cerrar', { duration: 4000 });
      },
    });
  }

  private resetearFormulario() {
    this.inicializarFormulario();
  }

  obtenerErrores(): string[] {
    const errores: string[] = [];
    const form = this.formularioTutor;

    if (form.get('rut')?.hasError('required')) {
      errores.push('El RUT es obligatorio');
    } else if (form.get('rut')?.hasError('minlength')) {
      errores.push('El RUT debe tener al menos 3 caracteres');
    } else if (form.get('rut')?.hasError('maxlength')) {
      errores.push('El RUT no puede tener más de 20 caracteres');
    } else if (form.get('rut')?.hasError('rutInvalido')) {
      errores.push(form.get('rut')?.errors?.['mensaje'] || 'RUT inválido');
    }

    if (form.get('nombre')?.hasError('required')) {
      errores.push('El nombre es obligatorio');
    } else if (form.get('nombre')?.hasError('minlength')) {
      errores.push('El nombre debe tener al menos 3 caracteres');
    } else if (form.get('nombre')?.hasError('maxlength')) {
      errores.push('El nombre no puede tener más de 120 caracteres');
    }

    if (form.get('correo')?.hasError('email')) {
      errores.push('El correo electrónico no tiene un formato válido');
    }

    if (form.get('telefono')?.hasError('telefonoInvalido')) {
      errores.push(form.get('telefono')?.errors?.['mensaje'] || 'Teléfono inválido');
    }

    return errores;
  }

  getErrorRut(): string {
    const control = this.formularioTutor.get('rut');
    if (control?.hasError('required')) return 'El RUT es obligatorio';
    if (control?.hasError('minlength')) return 'El RUT debe tener al menos 3 caracteres';
    if (control?.hasError('maxlength')) return 'El RUT no puede tener más de 20 caracteres';
    if (control?.hasError('rutInvalido')) return control.errors?.['mensaje'] || 'RUT inválido';
    return '';
  }

  getErrorNombre(): string {
    const control = this.formularioTutor.get('nombre');
    if (control?.hasError('required')) return 'El nombre es obligatorio';
    if (control?.hasError('minlength')) return 'El nombre debe tener al menos 3 caracteres';
    if (control?.hasError('maxlength')) return 'El nombre no puede tener más de 120 caracteres';
    return '';
  }

  getErrorCorreo(): string {
    const control = this.formularioTutor.get('correo');
    if (control?.hasError('email')) return 'Correo electrónico inválido';
    return '';
  }

  getErrorTelefono(): string {
    const control = this.formularioTutor.get('telefono');
    if (control?.hasError('telefonoInvalido')) return control.errors?.['mensaje'] || 'Teléfono inválido';
    return '';
  }
}


