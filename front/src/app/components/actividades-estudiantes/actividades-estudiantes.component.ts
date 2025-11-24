import { Component, inject, PLATFORM_ID } from '@angular/core';
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

interface Actividad {
  id: number;
  mes: string;
  nombre_actividad: string;
  estudiantes?: string;
  fecha: Date | string;
  horario?: string;
  lugar?: string;
  archivo_adjunto?: string;
}

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
export class ActividadesEstudiantesComponent {
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private snack = inject(MatSnackBar);
  
  searchTerm: string = '';
  selectedMes: string = 'all';
  
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
  
  // Datos de ejemplo basados en la imagen
  actividades: Actividad[] = [
    {
      id: 1,
      mes: 'AGOSTO',
      nombre_actividad: 'Taller 2: Gestión emocional',
      estudiantes: 'Ana Torres, Carlos Sanchez, ...',
      fecha: new Date('2024-08-26T10:00:00'),
      horario: '10:00 AM',
      lugar: 'Sala A'
    },
    {
      id: 2,
      mes: 'AGOSTO',
      nombre_actividad: 'Taller 5: Manejo del estrés',
      estudiantes: 'Luisa Fernandez, Javier Gomez, Sofia Ramirez',
      fecha: new Date('2024-08-26T14:00:00'),
      horario: '02:00 PM',
      lugar: 'Auditorio'
    },
    {
      id: 3,
      mes: 'AGOSTO',
      nombre_actividad: 'Taller 7: Liderazgo y desarrollo',
      estudiantes: 'Mateo Castillo, Valentina Ortiz, ...',
      fecha: new Date('2024-08-27T09:00:00'),
      horario: '09:00 AM',
      lugar: 'Sala B'
    },
    {
      id: 4,
      mes: 'AGOSTO',
      nombre_actividad: 'Taller 12: Resolución de conflictos',
      estudiantes: 'Isabella Cruz, Sebastian Mora, Gabriela Rojas',
      fecha: new Date('2024-08-27T11:00:00'),
      horario: '11:00 AM',
      lugar: 'Online'
    },
    {
      id: 5,
      mes: 'SEPTIEMBRE',
      nombre_actividad: 'Taller Bibliográfico y Plagio',
      estudiantes: 'Camila Diaz, Daniel Vega, Paula Navarro, ...',
      fecha: new Date('2024-09-01T15:00:00'),
      horario: '03:00 PM',
      lugar: 'Biblioteca'
    },
    {
      id: 6,
      mes: 'SEPTIEMBRE',
      nombre_actividad: 'Presentación de Manual Protocolar',
      estudiantes: 'Adriana Peña, Ricardo Soto, ...',
      fecha: new Date('2024-09-03T10:00:00'),
      horario: '10:00 AM',
      lugar: 'Auditorio'
    }
  ];

  constructor() {
    this.actualizarPaginacion();
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
      
      // Convertir archivo a base64 para almacenarlo
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Guardar como data URL: data:[<mediatype>][;base64],<data>
        this.formularioActividad.patchValue({ archivo_adjunto: base64String });
      };
      reader.readAsDataURL(file);
    }
  }

  guardarActividad(): void {
    if (this.formularioActividad.invalid) {
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

    // Determinar el mes basado en la fecha
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                   'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const mes = meses[fechaCompleta.getMonth()];

    // Determinar el valor del archivo adjunto
    let archivoAdjunto: string | undefined;
    if (this.archivoSeleccionado) {
      // Si hay un archivo seleccionado, usar el base64 almacenado en el formulario
      archivoAdjunto = formValue.archivo_adjunto || undefined;
    }

    if (this.estaEditando && this.actividadEditando) {
      // Editar actividad existente
      const index = this.actividades.findIndex(a => a.id === this.actividadEditando!.id);
      if (index !== -1) {
        this.actividades[index] = {
          ...this.actividades[index],
          nombre_actividad: formValue.nombre_actividad,
          fecha: fechaCompleta,
          horario: formValue.horario || undefined,
          lugar: formValue.lugar || undefined,
          estudiantes: formValue.estudiantes || undefined,
          archivo_adjunto: archivoAdjunto,
          mes: mes
        };
      }
    } else {
      // Agregar nueva actividad
      const nuevaActividad: Actividad = {
        id: this.actividades.length > 0 ? Math.max(...this.actividades.map(a => a.id)) + 1 : 1,
        nombre_actividad: formValue.nombre_actividad,
        fecha: fechaCompleta,
        horario: formValue.horario || undefined,
        lugar: formValue.lugar || undefined,
        estudiantes: formValue.estudiantes || undefined,
        archivo_adjunto: archivoAdjunto,
        mes: mes
      };
      this.actividades.push(nuevaActividad);
      
      // Mostrar mensaje de confirmación
      this.snack.open(
        `✓ ${formValue.nombre_actividad} agregada correctamente`,
        'Cerrar',
        {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar'],
        },
      );
    }

    this.actualizarPaginacion();
    this.alternarFormulario();
  }

  viewActivity(actividad: Actividad): void {
    this.actividadSeleccionada = actividad;
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
    
    // Si hay un archivo adjunto (base64), mostrar indicador
    if (actividad.archivo_adjunto && actividad.archivo_adjunto.startsWith('data:')) {
      this.nombreArchivoSeleccionado = 'Archivo adjunto';
      this.archivoSeleccionado = null; // No podemos recuperar el archivo original desde base64
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
    
    const index = this.actividades.findIndex(a => a.id === this.pendingDelete!.id);
    if (index !== -1) {
      this.actividades.splice(index, 1);
      this.actualizarPaginacion();
      // Ajustar página si es necesario después de eliminar
      setTimeout(() => {
        if (this.filteredActivities.length === 0 && this.pageIndex > 0) {
          this.pageIndex--;
          this.actualizarPaginacion();
        }
      }, 100);
    }
    
    this.pendingDelete = null;
  }
}

