import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ActividadesEstudiantesService, Actividad } from '../../services/actividades-estudiantes.service';

@Component({
  standalone: true,
  selector: 'app-actividades-estudiantes',
  templateUrl: './actividades-estudiantes.component.html',
  styleUrls: ['./actividades-estudiantes.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSnackBarModule
  ]
})
export class ActividadesEstudiantesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private snack = inject(MatSnackBar);
  private actividadesService = inject(ActividadesEstudiantesService);
  
  searchTerm: string = '';
  selectedMes: string = 'all';
  cargando: boolean = false;
  
  // Lista de meses disponibles
  readonly meses = [
    { value: 'all', label: 'Todos los meses' },
    { value: 'ENERO', label: 'Enero' },
    { value: 'FEBRERO', label: 'Febrero' },
    { value: 'MARZO', label: 'Marzo' },
    { value: 'ABRIL', label: 'Abril' },
    { value: 'MAYO', label: 'Mayo' },
    { value: 'JUNIO', label: 'Junio' },
    { value: 'JULIO', label: 'Julio' },
    { value: 'AGOSTO', label: 'Agosto' },
    { value: 'SEPTIEMBRE', label: 'Septiembre' },
    { value: 'OCTUBRE', label: 'Octubre' },
    { value: 'NOVIEMBRE', label: 'Noviembre' },
    { value: 'DICIEMBRE', label: 'Diciembre' }
  ];
  mostrarFormulario: boolean = false;
  estaEditando: boolean = false;
  actividadEditando: Actividad | null = null;
  pendingDelete: Actividad | null = null;
  actividadSeleccionada: Actividad | null = null;
  
  // Control de archivo adjunto
  archivoSeleccionado: File | null = null;
  nombreArchivoSeleccionado: string = '';
  
  // Verificar si el usuario es jefatura (solo lectura)
  get esJefatura(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    try {
      const roleStr = localStorage.getItem('app.selectedRole');
      if (!roleStr) return false;
      const role = JSON.parse(roleStr);
      return role?.id === 'jefatura';
    } catch {
      return false;
    }
  }
  
  // ===== paginación =====
  pageIndex = 0;
  pageSize = 5;
  totalItems = 0;
  readonly pageSizeOptions = [5, 10, 20, 50];
  
  // Formulario reactivo
  formularioActividad: FormGroup = this.fb.group({
    nombre_actividad: ['', [Validators.required]],
    fecha: ['', [Validators.required]],
    horario: [''],
    lugar: [''],
    estudiantes: [''],
    archivo_adjunto: ['']
  });
  
  actividades: Actividad[] = [];

  ngOnInit(): void {
    this.cargarActividades();
  }

  cargarActividades(): void {
    this.cargando = true;
    // Cargar un número grande de actividades para filtrar localmente
    const params = { page: 1, limit: 1000 };
    
    this.actividadesService.listar(params).subscribe({
      next: (response) => {
        this.actividades = response.items || [];
        this.cargando = false;
        this.actualizarPaginacion();
      },
      error: (err) => {
        console.error('Error al cargar actividades:', err);
        this.snack.open('Error al cargar actividades', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      }
    });
  }

  // ===== filtros - aplicados localmente =====
  get filtradas(): Actividad[] {
    let resultado = [...this.actividades];

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      resultado = resultado.filter(actividad =>
        actividad.nombre_actividad.toLowerCase().includes(term)
      );
    }

    // Filtrar por mes
    if (this.selectedMes && this.selectedMes !== 'all') {
      resultado = resultado.filter(actividad =>
        actividad.mes === this.selectedMes
      );
    }

    return resultado;
  }

  // ===== items paginados de los filtrados =====
  get filteredActivities(): Actividad[] {
    const filtradas = this.filtradas;
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return filtradas.slice(startIndex, endIndex);
  }

  // Actualizar paginación cuando cambian los filtros o datos
  actualizarPaginacion(): void {
    this.totalItems = this.filtradas.length;
    // Asegurar que pageIndex no exceda el número de páginas disponibles
    const maxPage = Math.max(0, Math.ceil(this.totalItems / this.pageSize) - 1);
    if (this.pageIndex > maxPage) {
      this.pageIndex = maxPage;
    }
  }

  filterActivities(): void {
    this.pageIndex = 0;
    this.actualizarPaginacion();
  }

  onMesChange(): void {
    this.pageIndex = 0;
    this.actualizarPaginacion();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.actualizarPaginacion();
  }

  formatDate(date: Date | string): string {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) {
        return '—';
      }
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '—';
    }
  }

  formatTime(date: Date | string): string {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) {
        return '—';
      }
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    } catch {
      return '—';
    }
  }

  alternarFormulario(): void {
    // Si es jefatura, no permitir abrir el formulario
    if (this.esJefatura) return;
    
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.estaEditando = false;
      this.actividadEditando = null;
      this.formularioActividad.reset();
      this.archivoSeleccionado = null;
      this.nombreArchivoSeleccionado = '';
    }
  }

  addActivity(): void {
    if (this.mostrarFormulario) {
      this.alternarFormulario();
    } else {
      this.estaEditando = false;
      this.actividadEditando = null;
      this.formularioActividad.reset();
      this.archivoSeleccionado = null;
      this.nombreArchivoSeleccionado = '';
      this.mostrarFormulario = true;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.archivoSeleccionado = file;
      this.nombreArchivoSeleccionado = file.name;
      
      // No necesitamos convertir a base64, el archivo se enviará directamente
      // Solo guardamos el nombre para mostrar en el formulario
    }
  }

  guardarActividad(): void {
    if (this.formularioActividad.invalid) {
      this.formularioActividad.markAllAsTouched();
      return;
    }

    const formValue = this.formularioActividad.value;
    const fechaCompleta = new Date(formValue.fecha);
    
    // Si hay horario, intentar parsearlo y combinarlo con la fecha
    if (formValue.horario) {
      const [hora, minutos] = formValue.horario.split(':').map(Number);
      if (!isNaN(hora) && !isNaN(minutos)) {
        fechaCompleta.setHours(hora, minutos, 0, 0);
      }
    }

    const actividadData: Partial<Actividad> = {
      nombre_actividad: formValue.nombre_actividad,
      fecha: fechaCompleta,
      horario: formValue.horario || undefined,
      lugar: formValue.lugar || undefined,
      estudiantes: formValue.estudiantes || undefined,
    };

    // Determinar qué archivo enviar
    let archivoParaEnviar: File | undefined = undefined;
    
    // Si hay un archivo nuevo seleccionado, usarlo
    if (this.archivoSeleccionado) {
      archivoParaEnviar = this.archivoSeleccionado;
    } 
    // Si estamos editando y hay un archivo base64 en el formulario, convertirlo a File
    else if (this.estaEditando && formValue.archivo_adjunto && formValue.archivo_adjunto.startsWith('data:')) {
      try {
        archivoParaEnviar = this.actividadesService.base64ToFile(
          formValue.archivo_adjunto,
          this.nombreArchivoSeleccionado || 'archivo_adjunto'
        );
      } catch (error) {
        console.error('Error al convertir base64 a File:', error);
      }
    }
    
    // Si hay una URL existente y no hay archivo nuevo, mantenerla en el DTO
    if (!archivoParaEnviar && formValue.archivo_adjunto && !formValue.archivo_adjunto.startsWith('data:')) {
      actividadData.archivo_adjunto = formValue.archivo_adjunto;
    }

    if (this.estaEditando && this.actividadEditando) {
      // Editar actividad existente
      this.cargando = true;
      this.actividadesService.actualizar(
        this.actividadEditando.id,
        actividadData,
        archivoParaEnviar
      ).subscribe({
        next: (actividadActualizada) => {
          const index = this.actividades.findIndex(a => a.id === actividadActualizada.id);
          if (index !== -1) {
            this.actividades[index] = actividadActualizada;
          }
          this.snack.open(
            `✓ ${actividadActualizada.nombre_actividad} actualizada correctamente`,
            'Cerrar',
            {
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['success-snackbar'],
            }
          );
          this.cargando = false;
          this.actualizarPaginacion();
          this.alternarFormulario();
        },
        error: (err) => {
          console.error('Error al actualizar actividad:', err);
          let mensajeError = 'Error al actualizar actividad';
          if (err?.error?.message) {
            mensajeError = Array.isArray(err.error.message) 
              ? err.error.message.join(', ') 
              : err.error.message;
          }
          this.snack.open(mensajeError, 'Cerrar', { duration: 4000 });
          this.cargando = false;
        }
      });
    } else {
      // Agregar nueva actividad
      this.cargando = true;
      this.actividadesService.crear(actividadData, archivoParaEnviar).subscribe({
        next: (nuevaActividad) => {
          this.actividades.push(nuevaActividad);
          this.snack.open(
            `✓ ${nuevaActividad.nombre_actividad} agregada correctamente`,
            'Cerrar',
            {
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['success-snackbar'],
            }
          );
          this.cargando = false;
          this.actualizarPaginacion();
          this.alternarFormulario();
        },
        error: (err) => {
          console.error('Error al crear actividad:', err);
          let mensajeError = 'Error al crear actividad';
          if (err?.error?.message) {
            mensajeError = Array.isArray(err.error.message) 
              ? err.error.message.join(', ') 
              : err.error.message;
          }
          this.snack.open(mensajeError, 'Cerrar', { duration: 4000 });
          this.cargando = false;
        }
      });
    }
  }

  viewActivity(actividad: Actividad): void {
    // Cargar detalles completos desde el backend
    this.actividadesService.obtenerPorId(actividad.id).subscribe({
      next: (actividadCompleta) => {
        this.actividadSeleccionada = actividadCompleta;
      },
      error: (err) => {
        console.error('Error al cargar detalles de actividad:', err);
        // Si falla, usar los datos que ya tenemos
        this.actividadSeleccionada = actividad;
        this.snack.open('Error al cargar detalles completos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cerrarDetalles(): void {
    this.actividadSeleccionada = null;
  }

  editActivity(actividad: Actividad): void {
    // Si es jefatura, no permitir editar
    if (this.esJefatura) return;
    
    this.actividadEditando = actividad;
    this.estaEditando = true;
    
    // Convertir fecha a formato para el datepicker
    const fecha = typeof actividad.fecha === 'string' ? new Date(actividad.fecha) : actividad.fecha;
    
    // Si hay un archivo adjunto, mostrar indicador
    if (actividad.archivo_adjunto) {
      if (actividad.archivo_adjunto.startsWith('data:')) {
        // Es base64, guardarlo en el formulario para mantenerlo
        this.nombreArchivoSeleccionado = 'Archivo adjunto existente';
        this.archivoSeleccionado = null;
      } else if (actividad.archivo_adjunto.startsWith('http') || actividad.archivo_adjunto.startsWith('uploads/')) {
        // Es una URL o ruta, guardarla en el formulario
        this.nombreArchivoSeleccionado = 'Archivo adjunto existente';
        this.archivoSeleccionado = null;
      } else {
        this.nombreArchivoSeleccionado = '';
        this.archivoSeleccionado = null;
      }
    } else {
      this.archivoSeleccionado = null;
      this.nombreArchivoSeleccionado = '';
    }
    
    this.formularioActividad.patchValue({
      nombre_actividad: actividad.nombre_actividad,
      fecha: fecha,
      horario: actividad.horario || '',
      lugar: actividad.lugar || '',
      estudiantes: actividad.estudiantes || '',
      archivo_adjunto: actividad.archivo_adjunto || ''
    });
    
    this.mostrarFormulario = true;
  }

  askDelete(actividad: Actividad): void {
    // Si es jefatura, no permitir eliminar
    if (this.esJefatura) return;
    
    this.pendingDelete = actividad;
  }

  cancelDelete(): void {
    this.pendingDelete = null;
  }

  confirmDelete(): void {
    if (!this.pendingDelete) return;
    
    this.cargando = true;
    this.actividadesService.eliminar(this.pendingDelete.id).subscribe({
      next: () => {
        const index = this.actividades.findIndex(a => a.id === this.pendingDelete!.id);
        if (index !== -1) {
          this.actividades.splice(index, 1);
        }
        this.actualizarPaginacion();
        // Ajustar página si es necesario después de eliminar
        setTimeout(() => {
          if (this.filteredActivities.length === 0 && this.pageIndex > 0) {
            this.pageIndex--;
            this.actualizarPaginacion();
          }
        }, 100);
        this.snack.open('Actividad eliminada correctamente', 'Cerrar', { duration: 3000 });
        this.cargando = false;
        this.pendingDelete = null;
      },
      error: (err) => {
        console.error('Error al eliminar actividad:', err);
        let mensajeError = 'Error al eliminar actividad';
        if (err?.error?.message) {
          mensajeError = Array.isArray(err.error.message) 
            ? err.error.message.join(', ') 
            : err.error.message;
        }
        this.snack.open(mensajeError, 'Cerrar', { duration: 4000 });
        this.cargando = false;
        this.pendingDelete = null;
      }
    });
  }
}

