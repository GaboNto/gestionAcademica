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
import { MatChipsModule } from '@angular/material/chips';

// Servicios
import { PracticasService, Estudiante, CentroEducativo, Colaborador, EstadoPractica } from '../../services/practicas.service';
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
    MatAutocompleteModule,
    MatChipsModule
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

  // Selección múltiple de colaboradores (máx. 2)
  selectedColaboradores: Colaborador[] = [];

  // Validador de 1..2 seleccionados
  validarColaboradores = (control: any) => {
    const arr: number[] = control?.value || [];
    if (!arr || arr.length === 0) return { requiredMin: true };
    if (arr.length > 2) return { maxSeleccionados: true };
    return null;
  };

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

      // Compatibilidad: primer colaborador (invisible en el input)
      colaboradorId: [''],

      // NUEVO: IDs de colaboradores seleccionados (1..2)
      colaboradoresIds: [[], [this.validarColaboradores]],

      fecha_inicio: ['', Validators.required],
      fecha_termino: [''],
      tipo: [''],
      estado: ['PENDIENTE']
    }, { validators: this.validarFechas });

    // Suscribirse a cambios en fecha_inicio para actualizar fechaMinimaTermino
    this.formularioPractica.get('fecha_inicio')?.valueChanges.subscribe(fechaInicio => {
      if (fechaInicio) {
        this.fechaMinimaTermino = new Date(fechaInicio);
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
            this.estudiantes = estudiantes.filter(est => !rutConPracticas.has(est.rut));
            this.estudianteFiltrado = this.estudiantes.slice(0, 5);
          },
          error: (err) => { console.error('Error al cargar estudiantes:', err); }
        });

        // Cargar otros datos
        this.cargarCentrosYColaboradores();
      },
      error: (err) => {
        console.error('Error al cargar prácticas:', err);
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
      error: (err) => { console.error('Error al cargar estudiantes:', err); }
    });
  }

  cargarCentrosYColaboradores() {
    // Cargar centros educativos
    this.http.get<any>('http://localhost:3000/centros?page=1&limit=100').subscribe({
      next: (response) => {
        this.centros = response.items || [];
        this.centroFiltrado = this.centros.slice(0, 5);
        const setTipos = new Set<string>();
        this.centros.forEach(c => { 
          const t = (c.tipo || '').trim(); 
          if (t) setTipos.add(t); 
        });
        this.tiposCentro = Array.from(setTipos).sort((a, b) => a.localeCompare(b));
      },
      error: (err) => { console.error('Error al cargar centros:', err); }
    });

    // Cargar colaboradores
    this.colaboradoresService.listar({ page: 1, limit: 100 }).subscribe({
      next: (response) => {
        this.colaboradores = response.items || [];
        this.colaboradorFiltrado = this.colaboradores.slice(0, 5);
      },
      error: (err) => { console.error('Error al cargar colaboradores:', err); }
    });

    this.cargando = false;
  }

  // Cargar prácticas desde la API
  cargarPracticas() {
    this.practicasService.listar().subscribe({
      next: (practicas) => {
        this.practicas = practicas.map((p: any) => this.transformarPractica(p));
        this.recalcularNivelesDesdeDatos();
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
    const rutConPracticas = new Set<string>();
    this.practicas.forEach((p: any) => {
      if (p.estudiante?.rut) rutConPracticas.add(p.estudiante.rut);
    });

    this.http.get<any[]>('http://localhost:3000/estudiante').subscribe({
      next: (estudiantes) => {
        this.estudiantes = estudiantes.filter(est => !rutConPracticas.has(est.rut));
        this.estudianteFiltrado = this.estudiantes.slice(0, 5);
      },
      error: (err) => { console.error('Error al actualizar estudiantes:', err); }
    });
  }

  // Transformar datos de la API al formato local
  transformarPractica(p: any): Practica {
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

  // FILTROS
  asignacionesFiltradas(): Practica[] {
    const termino = this.terminoBusqueda.toLowerCase().trim();

    return this.practicas.filter(practica => {
      if (!practica || !practica.estudiante || !practica.centro || !practica.colaborador) return false;

      const coincideBusqueda = !termino ||
        practica.estudiante.nombre?.toLowerCase().includes(termino) ||
        practica.estudiante.rut?.toLowerCase().includes(termino) ||
        practica.centro.nombre?.toLowerCase().includes(termino) ||
        practica.colaborador.nombre?.toLowerCase().includes(termino);

      const coincideColegio = this.colegioSeleccionado === 'all' ||
        (practica.centro.tipo || '').toLowerCase() === this.colegioSeleccionado.toLowerCase();

      const coincideNivel = this.nivelSeleccionado === 'all' ||
        (practica.estudiante.nivel || '').toLowerCase() === this.nivelSeleccionado.toLowerCase();

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
      estado: 'PENDIENTE',
      colaboradoresIds: [],
      colaboradorId: ''
    });
    this.selectedColaboradores = [];
    this.fechaMinimaTermino = null;
    this.estudianteFiltrado = [...this.estudiantes];
    this.centroFiltrado = [...this.centros];
    this.colaboradorFiltrado = [...this.colaboradores];
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.formularioPractica.reset({
      estado: 'PENDIENTE',
      colaboradoresIds: [],
      colaboradorId: ''
    });
    this.selectedColaboradores = [];
    this.fechaMinimaTermino = null;
  }

  // Métodos de filtrado para autocompletado (máximo 5 resultados)
  filtrarEstudiantes(event: any) {
    const filtro = (event?.target?.value || '').toLowerCase();
    let filtrados: Estudiante[];
    if (!filtro) filtrados = this.estudiantes.slice(0, 5);
    else {
      filtrados = this.estudiantes.filter(e =>
        e.nombre.toLowerCase().includes(filtro) ||
        e.rut.toLowerCase().includes(filtro)
      ).slice(0, 5);
    }
    this.estudianteFiltrado = filtrados;
  }

  filtrarCentros(event: any) {
    const filtro = (event?.target?.value || '').toLowerCase();
    let filtrados: CentroEducativo[];
    if (!filtro) filtrados = this.centros.slice(0, 5);
    else {
      filtrados = this.centros.filter(c =>
        c.nombre.toLowerCase().includes(filtro) ||
        c.comuna?.toLowerCase().includes(filtro) ||
        c.region?.toLowerCase().includes(filtro)
      ).slice(0, 5);
    }
    this.centroFiltrado = filtrados;
  }

  filtrarColaboradores(event: any) {
    const filtro = (event?.target?.value || '').toLowerCase();
    let filtrados: Colaborador[];
    if (!filtro) filtrados = this.colaboradores.slice(0, 5);
    else {
      filtrados = this.colaboradores.filter(c =>
        c.nombre.toLowerCase().includes(filtro) ||
        (c.tipo && c.tipo.toLowerCase().includes(filtro)) ||
        (c.cargo && c.cargo.toLowerCase().includes(filtro))
      ).slice(0, 5);
    }
    this.colaboradorFiltrado = filtrados;
  }

  // Mostrar los primeros 5 elementos al enfocar
  mostrarTodosEstudiantes() { this.estudianteFiltrado = this.estudiantes.slice(0, 5); }
  mostrarTodosCentros() { this.centroFiltrado = this.centros.slice(0, 5); }
  mostrarTodosColaboradores() { this.colaboradorFiltrado = this.colaboradores.slice(0, 5); }

  // displayWith helpers
  mostrarEstudiante(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') {
      const est = this.estudiantes.find(e => e.rut === value);
      return est ? `${est.nombre} - ${est.rut}` : '';
    }
    if (typeof value === 'object' && value.rut) return `${value.nombre} - ${value.rut}`;
    return '';
  }

  mostrarCentro(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') {
      const id = parseInt(value);
      const c = this.centros.find(x => x.id === id);
      return c ? `${c.nombre} - ${c.comuna}, ${c.region}` : '';
    }
    if (typeof value === 'number') {
      const c = this.centros.find(x => x.id === value);
      return c ? `${c.nombre} - ${c.comuna}, ${c.region}` : '';
    }
    if (typeof value === 'object' && value.id) {
      return `${value.nombre} - ${value.comuna}, ${value.region}`;
    }
    return '';
  }

  // Single select (compatibilidad en otros campos)
  onEstudianteSeleccionado(event: any) {
    const estudiante = event.option.value;
    this.formularioPractica.patchValue({ estudianteRut: estudiante.rut });
  }

  onCentroSeleccionado(event: any) {
    const centro = event.option.value;
    this.formularioPractica.patchValue({ centroId: centro.id.toString() });
  }

  // MULTI: seleccionar y quitar colaboradores
  onColaboradorSeleccionadoMultiple(event: any) {
    const colaborador: Colaborador = event.option.value;
    if (this.selectedColaboradores.some(c => c.id === colaborador.id)) return;
    if (this.selectedColaboradores.length >= 2) return;

    this.selectedColaboradores = [...this.selectedColaboradores, colaborador];

    const ids = this.selectedColaboradores.map(c => c.id);
    this.formularioPractica.patchValue({
      colaboradoresIds: ids,
      colaboradorId: ids.length ? ids[0].toString() : ''
    });
    this.formularioPractica.get('colaboradoresIds')?.updateValueAndValidity();
  }

  removerColaborador(colaborador: Colaborador) {
    this.selectedColaboradores = this.selectedColaboradores.filter(c => c.id !== colaborador.id);
    const ids = this.selectedColaboradores.map(c => c.id);
    this.formularioPractica.patchValue({
      colaboradoresIds: ids,
      colaboradorId: ids.length ? ids[0].toString() : ''
    });
    this.formularioPractica.get('colaboradoresIds')?.updateValueAndValidity();
  }

  isMaxColaboradoresSeleccionados(): boolean {
    return this.selectedColaboradores.length >= 2;
  }

  guardarPractica() {
    if (this.formularioPractica.valid) {
      const formData = this.formularioPractica.value;

      const ids: number[] = (formData.colaboradoresIds || [])
        .map((x: any) => Number(x))
        .filter((n: any) => !isNaN(n));

      const primerId = ids.length
        ? ids[0]
        : (formData.colaboradorId ? parseInt(formData.colaboradorId) : undefined);

      const dto: any = {
        estudianteRut: formData.estudianteRut,
        centroId: parseInt(formData.centroId),
        // Compatibilidad: primer colaborador
        colaboradorId: primerId,
        // Nuevo: arreglo 1..2
        colaboradoresIds: ids.length ? ids : (primerId ? [primerId] : []),
        fecha_inicio: this.formatearFecha(formData.fecha_inicio),
        fecha_termino: formData.fecha_termino ? this.formatearFecha(formData.fecha_termino) : undefined,
        tipo: formData.tipo || undefined,
        estado: formData.estado || 'PENDIENTE'
      };

      this.practicasService.crear(dto).subscribe({
        next: () => {
          this.snack.open(
            `✓ Práctica asignada exitosamente`, 
            'Cerrar', 
            { duration: 4000, horizontalPosition: 'center', verticalPosition: 'bottom', panelClass: ['success-snackbar'] }
          );
          this.cargarPracticas();
          this.cerrarFormulario();
        },
        error: (err) => {
          console.error('Error al crear práctica:', err);
          let mensaje = 'Error al crear práctica';
          if (err.error && err.error.message) mensaje = err.error.message;
          this.snack.open(mensaje, 'Cerrar', {
            duration: 4000, horizontalPosition: 'center', verticalPosition: 'bottom', panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.formularioPractica.markAllAsTouched();
      this.snack.open('⚠️ Por favor completa todos los campos requeridos', 'Cerrar', {
        duration: 3000, horizontalPosition: 'center', verticalPosition: 'bottom', panelClass: ['warning-snackbar']
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
    if (fecha instanceof Date) return fecha.toISOString().split('T')[0];
    if (typeof fecha === 'string') return fecha;
    return '';
  }
}
