import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

// Servicios
import { PracticasService, Estudiante, CentroEducativo, Colaborador, EstadoPractica, Practica as PracticaAPI } from '../../services/practicas.service';
import { ColaboradoresService } from '../../services/colaboradores.service';
import { HttpClient } from '@angular/common/http';

// Tipos de práctica (como string libre)
type TipoPractica = string;

interface Actividad {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha: string;
  completada: boolean;
}

// Interface local para compatibilidad con la vista (mapeo de API)
interface Practica {
  id: number;
  estado: EstadoPractica;
  fechaInicio: string;
  fechaTermino?: string;
  tipo?: TipoPractica;
  estudiante: Estudiante;
  centro: CentroEducativo;
  colaborador: Colaborador; // Usando el tipo del servicio
  actividades?: Actividad[];
}

@Component({
  standalone: true,
  selector: 'app-practicas',
  templateUrl: './practicas.component.html',
  styleUrls: ['./practicas.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDividerModule,
    MatAutocompleteModule
  ]
})
export class PracticasComponent {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);
  private practicasService = inject(PracticasService);
  private colaboradoresService = inject(ColaboradoresService);
  private http = inject(HttpClient);

  // Filtros
  terminoBusqueda = '';
  colegioSeleccionado: 'all' | string = 'all';
  nivelSeleccionado: 'all' | string = 'all';

  // Estado para modal de detalles
  practicaSeleccionada: Practica | null = null;
  mostrarModalDetalles = false;

  // Estado para modal de formulario
  mostrarFormulario = false;
  formularioPractica: FormGroup;
  cargando = false;

  // Propiedades para autocompletado
  estudianteFiltrado: Estudiante[] = [];
  centroFiltrado: CentroEducativo[] = [];
  colaboradorFiltrado: Colaborador[] = [];

  // Datos para los selects (se cargan desde la API)
  estudiantes: Estudiante[] = [];
  centros: CentroEducativo[] = [];
  colaboradores: Colaborador[] = [];

  // Opciones de tipos de práctica
  tiposPractica: string[] = [
    'PRÁCTICA PROFESIONAL DOCENTE APOYO A LA DOCENCIA I',
    'PRÁCTICA PROFESIONAL DE APOYO A LA DOCENCIA II',
    'PRÁCTICA PROFESIONAL DE APOYO A LA DOCENCIA III',
    'PRÁCTICA PROFESIONAL DOCENTE'
  ];

  // Opciones de niveles/plan (derivadas de los datos cargados)
  niveles: string[] = [];
  // Tipos de centro educativo (derivados de los datos cargados)
  tiposCentro: string[] = [];

  estadosPractica: EstadoPractica[] = [
    'PENDIENTE',
    'EN_CURSO',
    'FINALIZADA',
    'RECHAZADA'
  ];

  // Función para formatear el estado para mostrar al usuario
  formatearEstado(estado: EstadoPractica): string {
    const formato: Record<EstadoPractica, string> = {
      'PENDIENTE': 'Pendiente',
      'EN_CURSO': 'En Curso',
      'FINALIZADA': 'Finalizada',
      'RECHAZADA': 'Rechazada'
    };
    return formato[estado] || estado;
  }

  // Propiedades para las fechas mínimas del datepicker
  fechaMinimaInicio: Date = new Date();
  fechaMinimaTermino: Date | null = null;

  // Validador personalizado para verificar que fecha_termino no sea anterior a fecha_inicio
  validarFechas = (formGroup: FormGroup): { [key: string]: any } | null => {
    const fechaInicio = formGroup.get('fecha_inicio')?.value;
    const fechaTermino = formGroup.get('fecha_termino')?.value;

    if (fechaInicio && fechaTermino) {
      const inicio = new Date(fechaInicio);
      const termino = new Date(fechaTermino);

      if (termino < inicio) {
        formGroup.get('fecha_termino')?.setErrors({ fechaAnterior: true });
        return { fechaInvalida: true };
      }
    }

    // Limpiar error si las fechas son válidas
    if (formGroup.get('fecha_termino')?.hasError('fechaAnterior')) {
      formGroup.get('fecha_termino')?.setErrors(null);
    }

    return null;
  }

  constructor() {
    // Inicializar formulario con validaciones personalizadas
    this.formularioPractica = this.fb.group({
      estudianteRut: ['', [Validators.required]],
      centroId: ['', [Validators.required]],
      colaboradorId: ['', [Validators.required]],
      fecha_inicio: ['', Validators.required],
      fecha_termino: [''],
      tipo: [''],
      estado: ['PENDIENTE']
    }, { validators: this.validarFechas });

    // Suscribirse a cambios en fecha_inicio para actualizar fechaMinimaTermino
    this.formularioPractica.get('fecha_inicio')?.valueChanges.subscribe(fechaInicio => {
      if (fechaInicio) {
        this.fechaMinimaTermino = new Date(fechaInicio);
        // Reiniciar fecha_termino si está vacía o es anterior a la nueva fecha de inicio
        const fechaTermino = this.formularioPractica.get('fecha_termino')?.value;
        if (fechaTermino && new Date(fechaTermino) < new Date(fechaInicio)) {
          this.formularioPractica.patchValue({ fecha_termino: '' }, { emitEvent: false });
        }
      }
    });

    // Cargar datos desde las APIs
    this.cargarDatosIniciales();
  }

  // Cargar datos iniciales desde las APIs
  cargarDatosIniciales() {
    this.cargando = true;

    // Cargar prácticas primero para filtrar estudiantes
    this.practicasService.listar().subscribe({
      next: (practicas) => {
        this.practicas = practicas.map((p: any) => this.transformarPractica(p));
        this.recalcularNivelesDesdeDatos();
        
        // Extraer RUTs de estudiantes con prácticas activas
        const rutConPracticas = new Set<string>();
        this.practicas.forEach((p: any) => {
          if (p.estudiante?.rut) {
            rutConPracticas.add(p.estudiante.rut);
          }
        });

        // Cargar estudiantes y filtrar los que ya tienen prácticas
        this.http.get<any[]>('http://localhost:3000/estudiante').subscribe({
          next: (estudiantes) => {
            // Filtrar estudiantes que NO tienen prácticas asignadas
            this.estudiantes = estudiantes.filter(est => !rutConPracticas.has(est.rut));
            this.estudianteFiltrado = this.estudiantes.slice(0, 5);
          },
          error: (err) => {
            console.error('Error al cargar estudiantes:', err);
          }
        });

        // Cargar otros datos
        this.cargarCentrosYColaboradores();
      },
      error: (err) => {
        console.error('Error al cargar prácticas:', err);
        // Si falla, cargar todos los estudiantes
        this.cargarTodosEstudiantes();
      }
    });
  }

  cargarTodosEstudiantes() {
    this.http.get<any[]>('http://localhost:3000/estudiante').subscribe({
      next: (estudiantes) => {
        this.estudiantes = estudiantes;
        this.estudianteFiltrado = this.estudiantes.slice(0, 5);
      },
      error: (err) => {
        console.error('Error al cargar estudiantes:', err);
      }
    });
  }

  cargarCentrosYColaboradores() {

    // Cargar centros educativos
    this.http.get<any>('http://localhost:3000/centros?page=1&limit=100').subscribe({
      next: (response) => {
        this.centros = response.items || [];
        this.centroFiltrado = this.centros.slice(0, 5);
        // Recalcular tipos de centros
        const setTipos = new Set<string>();
        this.centros.forEach(c => { 
          const t = (c.tipo || '').trim(); 
          if (t) setTipos.add(t); 
        });
        this.tiposCentro = Array.from(setTipos).sort((a, b) => a.localeCompare(b));
      },
      error: (err) => {
        console.error('Error al cargar centros:', err);
      }
    });

    // Cargar colaboradores
    this.colaboradoresService.listar({ page: 1, limit: 100 }).subscribe({
      next: (response) => {
        this.colaboradores = response.items || [];
        this.colaboradorFiltrado = this.colaboradores.slice(0, 5);
      },
      error: (err) => {
        console.error('Error al cargar colaboradores:', err);
      }
    });

    this.cargando = false;
  }

  // Cargar prácticas desde la API
  cargarPracticas() {
    this.practicasService.listar().subscribe({
      next: (practicas) => {
        // Transformar datos de la API al formato local
        this.practicas = practicas.map((p: any) => this.transformarPractica(p));
        this.recalcularNivelesDesdeDatos();
        
        // Actualizar lista de estudiantes disponibles
        this.actualizarEstudiantesDisponibles();
      },
      error: (err) => {
        console.error('Error al cargar prácticas:', err);
        this.snack.open('Error al cargar prácticas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Actualizar lista de estudiantes disponibles (sin prácticas)
  actualizarEstudiantesDisponibles() {
    // Extraer RUTs de estudiantes con prácticas asignadas
    const rutConPracticas = new Set<string>();
    this.practicas.forEach((p: any) => {
      if (p.estudiante?.rut) {
        rutConPracticas.add(p.estudiante.rut);
      }
    });

    // Cargar todos los estudiantes desde la API
    this.http.get<any[]>('http://localhost:3000/estudiante').subscribe({
      next: (estudiantes) => {
        // Filtrar estudiantes que NO tienen prácticas asignadas
        this.estudiantes = estudiantes.filter(est => !rutConPracticas.has(est.rut));
        this.estudianteFiltrado = this.estudiantes.slice(0, 5);
      },
      error: (err) => {
        console.error('Error al actualizar estudiantes:', err);
      }
    });
  }

  // Transformar datos de la API al formato local
  transformarPractica(p: any): Practica {
    // Formatear fechas correctamente
    const formatearFecha = (fecha: any): string => {
      if (!fecha) return '';
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    return {
      id: p.id,
      estado: p.estado,
      fechaInicio: formatearFecha(p.fecha_inicio) || p.fecha_inicio,
      fechaTermino: p.fecha_termino ? formatearFecha(p.fecha_termino) : undefined,
      tipo: p.tipo,
      estudiante: {
        rut: p.estudiante?.rut || '',
        nombre: p.estudiante?.nombre || '',
        nivel: p.estudiante?.plan || p.estudiante?.nivel || '',
        email: p.estudiante?.email
      },
      centro: {
        id: p.centro?.id || 0,
        nombre: p.centro?.nombre || '',
        direccion: p.centro?.direccion,
        tipo: p.centro?.tipo,
        region: p.centro?.region,
        comuna: p.centro?.comuna,
        convenio: p.centro?.convenio
      },
      colaborador: {
        id: p.colaborador?.id || 0,
        nombre: p.colaborador?.nombre || '',
        correo: p.colaborador?.correo,
        tipo: p.colaborador?.tipo,
        cargo: p.colaborador?.cargo,
        telefono: p.colaborador?.telefono
      },
      actividades: []
    };
  }

  // Datos de prácticas (se cargan desde la API)
  practicas: Practica[] = [];

  // Funciones
  asignacionesFiltradas(): Practica[] {
    const termino = this.terminoBusqueda.toLowerCase().trim();

    return this.practicas.filter(practica => {
      // Verificar que practica y sus propiedades existan
      if (!practica || !practica.estudiante || !practica.centro || !practica.colaborador) {
        return false;
      }

      // Filtro de búsqueda
      const coincideBusqueda = !termino ||
        practica.estudiante.nombre?.toLowerCase().includes(termino) ||
        practica.estudiante.rut?.toLowerCase().includes(termino) ||
        practica.centro.nombre?.toLowerCase().includes(termino) ||
        practica.colaborador.nombre?.toLowerCase().includes(termino);

      // Filtro por tipo de centro educativo
      const coincideColegio = this.colegioSeleccionado === 'all' || (practica.centro.tipo || '').toLowerCase() === this.colegioSeleccionado.toLowerCase();
      // Filtro de nivel/plan del estudiante
      const coincideNivel = this.nivelSeleccionado === 'all' || (practica.estudiante.nivel || '').toLowerCase() === this.nivelSeleccionado.toLowerCase();

      return coincideBusqueda && coincideColegio && coincideNivel;
    });
  }

  private recalcularNivelesDesdeDatos() {
    const set = new Set<string>();
    this.practicas.forEach(p => {
      const n = (p.estudiante?.nivel || '').trim();
      if (n) set.add(n);
    });
    this.niveles = Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  abrirNuevaAsignacion() {
    this.mostrarFormulario = true;
    this.formularioPractica.reset({
      estado: 'PENDIENTE'
    });
    // Resetear fechaMinimaTermino cuando se abre el formulario
    this.fechaMinimaTermino = null;
    // Reinicializar filtros
    this.estudianteFiltrado = [...this.estudiantes];
    this.centroFiltrado = [...this.centros];
    this.colaboradorFiltrado = [...this.colaboradores];
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.formularioPractica.reset({
      estado: 'PENDIENTE'
    });
    // Resetear fechaMinimaTermino cuando se cierra el formulario
    this.fechaMinimaTermino = null;
  }

  // Métodos de filtrado para autocompletado (máximo 5 resultados)
  filtrarEstudiantes(event: any) {
    const filtro = event.target.value.toLowerCase();
    let filtrados: Estudiante[];
    
    if (!filtro) {
      // Si no hay filtro, mostrar los primeros 5 estudiantes
      filtrados = this.estudiantes.slice(0, 5);
    } else {
      // Filtrar por nombre o RUT y limitar a 5
      filtrados = this.estudiantes.filter(estudiante =>
      estudiante.nombre.toLowerCase().includes(filtro) ||
      estudiante.rut.toLowerCase().includes(filtro)
      ).slice(0, 5);
    }
    
    this.estudianteFiltrado = filtrados;
  }

  filtrarCentros(event: any) {
    const filtro = event.target.value.toLowerCase();
    let filtrados: CentroEducativo[];
    
    if (!filtro) {
      // Si no hay filtro, mostrar los primeros 5 centros
      filtrados = this.centros.slice(0, 5);
    } else {
      // Filtrar por nombre, comuna o región y limitar a 5
      filtrados = this.centros.filter(centro =>
      centro.nombre.toLowerCase().includes(filtro) ||
      centro.comuna?.toLowerCase().includes(filtro) ||
      centro.region?.toLowerCase().includes(filtro)
      ).slice(0, 5);
    }
    
    this.centroFiltrado = filtrados;
  }

  filtrarColaboradores(event: any) {
    const filtro = event.target.value.toLowerCase();
    let filtrados: Colaborador[];
    
    if (!filtro) {
      // Si no hay filtro, mostrar los primeros 5 colaboradores
      filtrados = this.colaboradores.slice(0, 5);
    } else {
      // Filtrar por nombre, tipo o cargo y limitar a 5
      filtrados = this.colaboradores.filter(colaborador =>
      colaborador.nombre.toLowerCase().includes(filtro) ||
        (colaborador.tipo && colaborador.tipo.toLowerCase().includes(filtro)) ||
        (colaborador.cargo && colaborador.cargo.toLowerCase().includes(filtro))
      ).slice(0, 5);
    }
    
    this.colaboradorFiltrado = filtrados;
  }

  // Mostrar los primeros 5 elementos cuando se hace click en el campo
  mostrarTodosEstudiantes() {
    this.estudianteFiltrado = this.estudiantes.slice(0, 5);
  }

  mostrarTodosCentros() {
    this.centroFiltrado = this.centros.slice(0, 5);
  }

  mostrarTodosColaboradores() {
    this.colaboradorFiltrado = this.colaboradores.slice(0, 5);
  }

  // Métodos para mostrar el valor seleccionado en el autocomplete
  mostrarEstudiante(value: any): string {
    if (!value) return '';
    
    // Si es un string (RUT), buscar el estudiante
    if (typeof value === 'string') {
      const estudiante = this.estudiantes.find(e => e.rut === value);
    return estudiante ? `${estudiante.nombre} - ${estudiante.rut}` : '';
  }

    // Si es un objeto con RUT
    if (typeof value === 'object' && value.rut) {
      return `${value.nombre} - ${value.rut}`;
    }
    
    return '';
  }

  mostrarCentro(value: any): string {
    if (!value) return '';
    
    // Si es un string (ID convertido), buscar el centro
    if (typeof value === 'string') {
      const centroId = parseInt(value);
      const centro = this.centros.find(c => c.id === centroId);
      return centro ? `${centro.nombre} - ${centro.comuna}, ${centro.region}` : '';
    }
    
    // Si es un número, buscar el centro
    if (typeof value === 'number') {
      const centro = this.centros.find(c => c.id === value);
    return centro ? `${centro.nombre} - ${centro.comuna}, ${centro.region}` : '';
  }

    // Si es un objeto con ID
    if (typeof value === 'object' && value.id) {
      return `${value.nombre} - ${value.comuna}, ${value.region}`;
    }
    
    return '';
  }

  mostrarColaborador(value: any): string {
    if (!value) return '';
    
    // Si es un string (ID convertido), buscar el colaborador
    if (typeof value === 'string') {
      const colaboradorId = parseInt(value);
      const colaborador = this.colaboradores.find(c => c.id === colaboradorId);
      if (!colaborador) return '';
      const cargo = colaborador.cargo?.trim();
      const cargoStr = cargo ? ` (${cargo})` : '';
      return `${colaborador.nombre} - ${colaborador.tipo || ''}${cargoStr}`;
    }
    
    // Si es un número, buscar el colaborador
    if (typeof value === 'number') {
      const colaborador = this.colaboradores.find(c => c.id === value);
      if (!colaborador) return '';
      const cargo = colaborador.cargo?.trim();
      const cargoStr = cargo ? ` (${cargo})` : '';
      return `${colaborador.nombre} - ${colaborador.tipo || ''}${cargoStr}`;
    }
    
    // Si es un objeto con ID
    if (typeof value === 'object' && value.id) {
      const cargo = (value.cargo as string | undefined)?.trim();
      const cargoStr = cargo ? ` (${cargo})` : '';
      return `${value.nombre} - ${value.tipo || ''}${cargoStr}`;
    }
    
    return '';
  }

  // Métodos para manejar la selección
  onEstudianteSeleccionado(event: any) {
    const estudiante = event.option.value;
    // Guardar el RUT como string pero también guardar el objeto para displayWith
    this.formularioPractica.patchValue({ 
      estudianteRut: estudiante.rut 
    });
  }

  onCentroSeleccionado(event: any) {
    const centro = event.option.value;
    // Guardar el ID como string pero también guardar el objeto para displayWith
    this.formularioPractica.patchValue({ 
      centroId: centro.id.toString() 
    });
  }

  onColaboradorSeleccionado(event: any) {
    const colaborador = event.option.value;
    // Guardar el ID como string pero también guardar el objeto para displayWith
    this.formularioPractica.patchValue({ 
      colaboradorId: colaborador.id.toString() 
    });
  }

  guardarPractica() {
    if (this.formularioPractica.valid) {
      const formData = this.formularioPractica.value;
      
      // Preparar datos para enviar a la API
      const dto = {
        estudianteRut: formData.estudianteRut,
        centroId: parseInt(formData.centroId),
        colaboradorId: parseInt(formData.colaboradorId),
        fecha_inicio: this.formatearFecha(formData.fecha_inicio),
        fecha_termino: formData.fecha_termino ? this.formatearFecha(formData.fecha_termino) : undefined,
          tipo: formData.tipo || undefined,
        estado: formData.estado || 'PENDIENTE'
      };

      this.practicasService.crear(dto).subscribe({
        next: (response) => {
        this.snack.open(
            `✓ Práctica asignada exitosamente`, 
          'Cerrar', 
          { 
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          }
        );
          // Recargar prácticas
          this.cargarPracticas();
        // Cerrar formulario
        this.cerrarFormulario();
        },
        error: (err) => {
          console.error('Error al crear práctica:', err);
          let mensaje = 'Error al crear práctica';
          if (err.error && err.error.message) {
            mensaje = err.error.message;
          }
          this.snack.open(mensaje, 'Cerrar', {
            duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
      });
    } else {
      this.formularioPractica.markAllAsTouched();
      this.snack.open('⚠️ Por favor completa todos los campos requeridos', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['warning-snackbar']
      });
    }
  }

  verDetalles(practica: Practica) {
    this.practicaSeleccionada = practica;
    this.mostrarModalDetalles = true;
  }

  cerrarDetalles() {
    this.practicaSeleccionada = null;
    this.mostrarModalDetalles = false;
  }

  // Formatear fecha a ISO string
  private formatearFecha(fecha: any): string {
    if (!fecha) return '';
    
    // Si es una Date, convertirla a ISO
    if (fecha instanceof Date) {
      return fecha.toISOString().split('T')[0]; // Retorna YYYY-MM-DD
    }
    
    // Si ya es string, retornarlo
    if (typeof fecha === 'string') {
      return fecha;
    }
    
    return '';
  }
}
