// Componente principal de gestión de encuestas (estudiantiles y colaboradores)
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { EncuestasApiService, ApiEncuesta} from '../../services/encuestas-api.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RouterLink } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { forkJoin } from 'rxjs';

// Tipos de encuesta manejados por el módulo
export type TipoEncuesta = 'ESTUDIANTIL' | 'COLABORADORES_JEFES';

// Estructura interna para mostrar encuestas en la UI
export interface EncuestaRegistro {
  id: string;
  tipo: TipoEncuesta;
  fecha: Date;
  origenArchivo?: string;
  metadata: { [key: string]: any };
  respuestas: {
    preguntaId: number;
    pregunta?: { descripcion: string };
    alternativa?: { descripcion: string };
    respuestaAbierta?: string;
  }[];
}

@Component({
  selector: 'app-encuestas',
  standalone: true,
  templateUrl: './encuestas.component.html',
  styleUrls: ['./encuestas.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    HttpClientModule,
    MatRadioModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
  ],
  providers: [EncuestasApiService],
})
export class EncuestasComponent implements OnInit {
  // Inyección moderna de FormBuilder
  private fb = inject(FormBuilder);

  // Claves de preguntas abiertas que se pueden editar posteriormente
  private preguntasAbiertasEditablesKeys: string[] = [
    // ESTUDIANTIL
    'secIII_C.comentariosCentro',
    'secIV_S.mejoraRolTallerista',
    'secV.mejoraCoordinacion',
    'comentariosAdicionales',

    // COLABORADORES / JEFES
    'sugerencias',
    'cumplePerfilEgreso',
    'comentariosAdicionales',
  ];

  constructor(
    private snackBar: MatSnackBar,
    private encuestasApi: EncuestasApiService
  ) {}

  // Estado general de la UI
  public tipoRegistroActivo: TipoEncuesta | null = null;
  public selectedEncuesta: EncuestaRegistro | null = null;
  public encuestaEnEdicion: EncuestaRegistro | null = null;
  public isLoading: boolean = false;

  // Formulario de registro y lista de encuestas
  registroForm!: FormGroup;
  encuestas: EncuestaRegistro[] = [];

  // Catálogos para selects
  estudiantes: { rut: string; nombre: string }[] = [];
  centros: { id: number; nombre: string; comuna?: string; region?: string }[] =
    [];
  colaboradores: { id: number; nombre: string }[] = [];
  tutores: { id: number; nombre: string }[] = [];

  // Permite bloquear selects si se requiere
  public readOnlySelects = false;

  // Opciones para escalas y selects en formulario
  opcionesEscala5 = [
    { value: 'NA', label: 'NA' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
  ];

  opcionesSiNo = [
    { value: 'SI', label: 'Si' },
    { value: 'NO', label: 'No' },
  ];

  opcionesNormativas = [
    { value: 'SI', label: 'Si' },
    { value: 'NO', label: 'No' },
    { value: 'NS', label: 'No existe/no sabe' },
  ];

  opcionesParticipacion = [
    { value: 'A_P', label: 'Asisti y pude participar' },
    { value: 'A_N', label: 'Asisti, pero no intervine' },
    { value: 'R_NA', label: 'Se realizo, pero no asisti' },
    { value: 'R_NI', label: 'Se realizo, pero no fui invitado' },
    { value: 'NR', label: 'No se realizo' },
  ];

  tiposEncuesta = [
    { value: 'ESTUDIANTIL' as TipoEncuesta, label: 'Percepción estudiantil' },
    {
      value: 'COLABORADORES_JEFES' as TipoEncuesta,
      label: 'Colaboradores / Jefes UTP',
    },
  ];

  // Mapea claves internas de preguntas a textos legibles para detalle/export
  private preguntaLabels: { [key: string]: string } = {
    // --- COLABORADORES / JEFES UTP ---

    // SECCION I
    'secI.e1_planificacion':'El profesor(a) en practica se rige por un sistema de planificacion que incluye calendarizaciones y planificacion semanal, la cual entrega en la fecha acordada.',
    'secI.e2_estructuraClase':'Durante la realizacion de la clase sigue una estructura definida.',
    'secI.e3_secuenciaActividades':'En las actividades que realiza hay una secuencia con introduccion, desarrollo y conclusion.',
    'secI.e4_preguntasAplicacion':'Durante la clase realiza preguntas de aplicacion de contenidos para verificar lo que los estudiantes han aprendido.',
    'secI.e5_estrategiasAtencion':'Utiliza distintas estrategias para captar la atencion de los estudiantes, ademas de demostrar dominio del contenido.',
    'secI.e6_retroalimentacion':'Entrega retroalimentacion a los estudiantes luego de sus intervenciones en clases.',
    'secI.e7_normasClase':'Establece las normas del curso o actividades a traves del dialogo y/o la negociacion con los estudiantes.',
    'secI.e8_usoTecnologia':'Usa la tecnologia para comunicarse con los estudiantes y promover su uso en sus presentaciones.',

    // SECCION II
    'secII.i1_vinculacionPares':'Establece vinculacion con sus pares y docentes del establecimiento y participa en actividades extracurriculares.',
    'secII.i2_capacidadGrupoTrabajo':'Capacidad de participar en un grupo de trabajo.',
    'secII.i3_presentacionPersonal':'Presentacion personal acorde a lo requerido por el establecimiento, cumpliendo horarios.',
    'secII.i4_autoaprendizaje':'Existe un proceso de autoaprendizaje e iniciativa personal frente a la superacion de debilidades.',
    'secII.i5_formacionSuficiente':'La formacion recibida en la Universidad fue suficiente para el desempeno del profesor en su practica profesional.',

    // SECCION III
    'secIII.v1_flujoInformacionSupervisor':'Durante la practica se mantuvo flujo de informacion con el supervisor/tallerista asignado.',
    'secIII.v2_claridadRoles':'Existe claridad de los roles de supervisores o talleristas, profesores colaboradores y coordinadora de practica.',
    'secIII.v3_verificacionAvance':'La coordinadora verifica los estados de avance de los procesos de practica.',
    'secIII.v4_satisfaccionGeneral':'En general, se encuentra satisfecho con la informacion y el sistema de practicas de la carrera.',

    // Preguntas abiertas COLABORADORES
    sugerencias: 'Tiene sugerencias o recomendaciones respecto a las practicas, practicantes y coordinacion de ellas que puedan generar mejoras en el futuro?',
    cumplePerfilEgreso: 'Cree que se cumple el perfil de egreso declarado?',
    comentariosAdicionales: 'Comentarios adicionales sobre la practica',

    // --- ESTUDIANTES ---
    'secI.objetivos':'Los objetivos planteados para el nivel de practica desempenado.',
    'secI.accionesEstablecimiento':'Las acciones realizadas en el desarrollo de esta practica en los establecimientos educacionales.',
    'secI.accionesTaller':'Las acciones desarrolladas en las sesiones de taller en la universidad.',
    'secI.satisfaccionGeneral':'El grado de satisfaccion general del proceso.',

    // ESTUDIANTIL - Sec II A (colaboradores) escala 1-5
    'secII_A.apoyoInsercion':'Apoyo la insercion al centro educativo en sus distintos niveles (espacios dentro del colegio, presentacion frente a estudiantes y colegas).',
    'secII_A.apoyoGestion':'Apoyo permanentemente la gestion educativa (planificacion, ejecucion y evaluacion) dentro y fuera del aula.',
    'secII_A.orientacionComportamiento':'Oriento el comportamiento y presentacion personal en el aula con un lenguaje formal y pertinente.',
    'secII_A.comunicacionConstante':'Mantuvo una comunicacion constante y oportuna, respecto a las actividades del establecimiento educacional.',
    'secII_A.retroalimentacionProceso':'Retroalimento el proceso de practica en sus distintas etapas, incentivando y facilitando la participacion del practicante.',

    // ESTUDIANTIL - Sec II B (colaboradores) select SI/NO
    'secII_B.interesRol':'Se evidencio un interes por su rol como colaborador/a?',
    'secII_B.recomendarColaborador':'Usted recomendaria al colaborador/a para ser asignado en un futuro proceso de practica?',

    // ESTUDIANTIL - Sec III A (normativas)
    'secIII_A.planEvacuacion': 'Plan Integral de Evacuacion y Seguridad Escolar Francisca Cooper (ex-DEYSE).',
    'secIII_A.proyectoEducativo': 'Proyecto Educativo Institucional.',
    'secIII_A.reglamentoConvivencia':'Reglamento Interno de Convivencia Escolar.',
    'secIII_A.planMejoramiento': 'Plan de Mejoramiento Educativo.',

    // ESTUDIANTIL - Sec III B (participacion)
    'secIII_B.reunionesDepartamento': 'Reuniones de departamento de las asignaturas.',
    'secIII_B.reunionesApoderados': 'Reuniones de apoderados.',
    'secIII_B.fiestasPatrias': 'Celebracion de Fiestas Patrias.',
    'secIII_B.diaLibro': 'Dia del libro.',
    'secIII_B.aniversarios': 'Aniversarios.',
    'secIII_B.diaFamilia': 'Dia de la familia.',
    'secIII_B.graduaciones': 'Graduaciones.',

    // ESTUDIANTIL - Sec III C (percepcion centro)
    'secIII_C.gratoAmbiente':'Percibe un grato ambiente en el centro educativo.',
    'secIII_C.recomendarCentro':'Recomendaria este centro educativo a otros practicantes?',
    'secIII_C.comentariosCentro':'Comentarios adicionales sobre el centro educativo.',

    // ESTUDIANTIL - Sec IV T (tallerista)
    'secIV_T.presentacionCentro':'Presento adecuadamente el centro educativo al estudiante en practica.',
    'secIV_T.facilitaComprension':'Facilito la comprension de las actividades a realizar en el centro.',
    'secIV_T.planificaVisitas':'Planifico visitas y acompanamientos al centro educativo.',
    'secIV_T.sesionesSemanales':'Realizo sesiones semanales de seguimiento.',
    'secIV_T.evaluaPermanente':'Evalua de manera permanente el avance del practicante.',
    'secIV_T.orientaDesempeno':'Oriento el desempeno del practicante con retroalimentacion concreta.',
    'secIV_T.organizaActividades':'Organizo actividades que apoyan el proceso de practica.',

    // ESTUDIANTIL - Sec IV S (supervisor)
    'secIV_S.presentacionCentro':'Presento el centro educativo y sus responsables.',
    'secIV_S.orientaGestion':'Orienta en la gestion y procesos administrativos del centro.',
    'secIV_S.comunicacionConstante':'Mantiene comunicacion constante con el practicante.',
    'secIV_S.orientaComportamiento':'Orienta sobre comportamiento y protocolo dentro del centro.',
    'secIV_S.sesionesRetro':'Realiza sesiones de retroalimentacion periodicas.',
    'secIV_S.evaluaGlobal':'Evalua globalmente el desempeno del practicante.',
    'secIV_S.resuelveProblemas':'Ayuda a resolver problemas presentados en el centro.',
    'secIV_S.orientaGestionDos':'Propone mejoras para el rol del tallerista/supervisor.',
    'secIV_S.mejoraRolTallerista':'Sugiere mejoras para el rol del tallerista/supervisor.',

    // ESTUDIANTIL - Sec V (coordinacion practicas)
    'secV.induccionesAcordes':'Las inducciones iniciales fueron acordes a la practica.',
    'secV.informacionClara':'La informacion entregada por coordinacion fue clara.',
    'secV.respuestaDudas': 'Responde oportunamente las dudas planteadas.',
    'secV.infoAcordeCentros':'La informacion de centros disponibles fue pertinente.',
    'secV.gestionesMejora':'Se realizaron gestiones para mejorar mi experiencia en la practica.',
    'secV.mejoraCoordinacion':'Sugiere mejoras para la coordinacion de practicas.',
  };

  // Diccionarios para mostrar textos descriptivos en vez de códigos
  private escala5Texto: Record<string, string> = {
    NA: 'No aplica',
    '1': 'Muy insatisfecho',
    '2': 'Insatisfecho',
    '3': 'Neutral',
    '4': 'Satisfecho',
    '5': 'Muy satisfecho',
  };

  private siNoTexto: Record<string, string> = {
    SI: 'Si',
    NO: 'No',
    NS: 'No existe / no sabe',
  };

  private participacionTexto: Record<string, string> = {
    A_P: 'Asisti y pude participar',
    A_N: 'Asisti, pero no intervine',
    R_NA: 'Se realizo, pero no asisti',
    R_NI: 'Se realizo, pero no fui invitado',
    NR: 'No se realizo',
  };

  // Devuelve el texto legible para una pregunta
  mapPreguntaDescripcion(desc: string): string {
    return this.preguntaLabels[desc] ?? desc;
  }

  // Normaliza el valor de respuesta a un texto entendible para tablas/detalle
  mapRespuestaValor(value: any): string {
    if (value === null || value === undefined || value === '') {
      return 'Sin respuesta';
    }
    const asString = typeof value === 'number' ? value.toString() : String(value);
    const esNumero = ['1', '2', '3', '4', '5'].includes(asString);

    if (esNumero && this.escala5Texto[asString]) {
      return `${asString} - ${this.escala5Texto[asString]}`;
    }
    if (this.escala5Texto[asString]) {
      return this.escala5Texto[asString];
    }
    if (this.participacionTexto[asString]) {
      return this.participacionTexto[asString];
    }
    if (this.siNoTexto[asString]) {
      return this.siNoTexto[asString];
    }

    return asString;
  }

  // Ciclo de vida inicial: arma formulario base y carga datos
  ngOnInit(): void {
    this.registroForm = this.fb.group({});
    this.loadEncuestas();
    this.loadCatalogos();
  }

  // ---------- CARGA ENCUESTAS ----------
  // Obtiene encuestas desde la API y las adapta al modelo EncuestaRegistro
  loadEncuestas(): void {
    this.isLoading = true;
    this.encuestasApi.getEncuestasRegistradas().subscribe({
      next: (data: ApiEncuesta[]) => {
        this.encuestas = data.map((item) => {
          const { respuestas, tipo, ...rest } = item;

          const tipoInferido: TipoEncuesta =
            (tipo as TipoEncuesta) ??
            ((item as any).nombre_estudiante
              ? 'ESTUDIANTIL'
              : 'COLABORADORES_JEFES');

          const fechaObj = item.fecha ? new Date(item.fecha) : new Date();
          const semestreCalc = this.computeSemestre(fechaObj);

          return {
            id: (item.id ?? Math.random()).toString(),
            tipo: tipoInferido,
            fecha: fechaObj,
            origenArchivo: (item as any).origenArchivo ?? '',
            metadata: { ...rest, fecha: fechaObj, semestre: semestreCalc },
            respuestas: (respuestas as any[]) || [],
          } as EncuestaRegistro;
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar encuestas', err);
        this.mostrarError('No fue posible cargar las encuestas.');
        this.isLoading = false;
      },
    });
  }

  // ---------- CARGA CATÁLOGOS ----------
  // Carga en paralelo estudiantes, centros, colaboradores y tutores
  loadCatalogos(): void {
    this.isLoading = true;
    forkJoin({
      estudiantes: this.encuestasApi.getEstudiantes(),
      centros: this.encuestasApi.getCentros(),
      colaboradores: this.encuestasApi.getColaboradores(),
      tutores: this.encuestasApi.getTutores(),
    }).subscribe({
      next: ({ estudiantes, centros, colaboradores, tutores }) => {
        this.estudiantes = estudiantes || [];
        this.centros = centros || [];
        this.colaboradores = colaboradores || [];
        this.tutores = tutores || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando catálogos', err);
        this.mostrarError(
          'No fue posible cargar catálogos (estudiantes/centros).'
        );
        this.isLoading = false;
      },
    });
  }

  // ---------- FORM BUILDERS ----------
  // Construye formulario para encuesta estudiantil
  private buildEstudiantilForm(): FormGroup {
    return this.fb.group({
      nombreEstudiante: ['', Validators.required],
      establecimiento: [''],
      fechaEvaluacion: [null],
      nombreTalleristaSupervisor: [''],
      nombreDocenteColaborador: [''],

      secI: this.fb.group({
        objetivos: ['', Validators.required],
        accionesEstablecimiento: [''],
        accionesTaller: [''],
        satisfaccionGeneral: [''],
      }),

      secII_A: this.fb.group({
        apoyoInsercion: [''],
        apoyoGestion: [''],
        orientacionComportamiento: [''],
        comunicacionConstante: [''],
        retroalimentacionProceso: [''],
      }),

      secII_B: this.fb.group({
        interesRol: [''],
        recomendarColaborador: [''],
        comentariosColaborador: [''],
      }),

      secIII_A: this.fb.group({
        planEvacuacion: [''],
        proyectoEducativo: [''],
        reglamentoConvivencia: [''],
        planMejoramiento: [''],
      }),

      secIII_B: this.fb.group({
        reunionesDepartamento: [''],
        reunionesApoderados: [''],
        fiestasPatrias: [''],
        diaLibro: [''],
        aniversarios: [''],
        diaFamilia: [''],
        graduaciones: [''],
      }),

      secIII_C: this.fb.group({
        gratoAmbiente: [''],
        recomendarCentro: [''],
        comentariosCentro: [''],
      }),

      secIV_T: this.fb.group({
        presentacionCentro: [''],
        facilitaComprension: [''],
        planificaVisitas: [''],
        sesionesSemanales: [''],
        evaluaPermanente: [''],
        orientaDesempeno: [''],
        organizaActividades: [''],
      }),

      secIV_S: this.fb.group({
        presentacionCentro: [''],
        orientaGestion: [''],
        comunicacionConstante: [''],
        orientaComportamiento: [''],
        sesionesRetro: [''],
        evaluaGlobal: [''],
        resuelveProblemas: [''],
        orientaGestionDos: [''],
        mejoraRolTallerista: [''],
      }),

      secV: this.fb.group({
        induccionesAcordes: [''],
        informacionClara: [''],
        respuestaDudas: [''],
        infoAcordeCentros: [''],
        gestionesMejora: [''],
        mejoraCoordinacion: [''],
      }),

      comentariosAdicionales: [''],
    });
  }

  // Construye formulario para encuesta de colaboradores / jefes UTP
  private buildColaboradoresForm(): FormGroup {
    return this.fb.group({
      nombreColaborador: ['', Validators.required],
      nombreEstudiantePractica: [''],
      centroEducativo: [''],
      fechaEvaluacion: [null],

      secI: this.fb.group({
        e1_planificacion: [''],
        e2_estructuraClase: [''],
        e3_secuenciaActividades: [''],
        e4_preguntasAplicacion: [''],
        e5_estrategiasAtencion: [''],
        e6_retroalimentacion: [''],
        e7_normasClase: [''],
        e8_usoTecnologia: [''],
      }),

      secII: this.fb.group({
        i1_vinculacionPares: [''],
        i2_capacidadGrupoTrabajo: [''],
        i3_presentacionPersonal: [''],
        i4_autoaprendizaje: [''],
        i5_formacionSuficiente: [''],
      }),

      secIII: this.fb.group({
        v1_flujoInformacionSupervisor: [''],
        v2_claridadRoles: [''],
        v3_verificacionAvance: [''],
        v4_satisfaccionGeneral: [''],
      }),

      sugerencias: [''],
      cumplePerfilEgreso: [''],
      comentariosAdicionales: [''],
    });
  }

  // ---------- UI / FORM CONTROL ----------
  // Inicializa el formulario según el tipo de encuesta
  iniciarRegistro(tipo: TipoEncuesta): void {
    this.requestCloseSidenav();
    this.tipoRegistroActivo = tipo;
    this.selectedEncuesta = null;

    if (tipo === 'ESTUDIANTIL') {
      this.registroForm = this.buildEstudiantilForm();

      // Valores por defecto opcionales
      if (this.estudiantes.length) {
        this.registroForm.patchValue({
          nombreEstudiante: this.estudiantes[0].rut,
        });
      }
      if (this.centros.length) {
        this.registroForm.patchValue({ establecimiento: this.centros[0].id });
      }
    } else {
      this.registroForm = this.buildColaboradoresForm();
      if (this.colaboradores.length) {
        this.registroForm.patchValue({
          nombreColaborador: this.colaboradores[0].id,
        });
      }
      if (this.centros.length) {
        this.registroForm.patchValue({
          centroEducativo: this.centros[0].id,
        });
      }
    }

    if (this.readOnlySelects) {
      this.disableSelectControls();
    }
  }

  // Deshabilita controles select cuando se requiere modo solo lectura
  private disableSelectControls(): void {
    const controls = [
      'nombreEstudiante',
      'establecimiento',
      'nombreTalleristaSupervisor',
      'nombreDocenteColaborador',
      'nombreColaborador',
      'nombreEstudiantePractica',
      'centroEducativo',
    ];
    controls.forEach((c) => {
      const ctrl = this.registroForm.get(c);
      if (ctrl) ctrl.disable();
    });
  }

  private requestCloseSidenav(): void {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('app:close-sidenav'));
    }
  }

  // Cierra modal de registro y resetea formulario
  cerrarRegistro(): void {
    this.tipoRegistroActivo = null;
    if (this.registroForm) this.registroForm.reset();
  }

  // Abre modal de detalle de una encuesta
  verDetalles(encuesta: EncuestaRegistro): void {
    this.selectedEncuesta = encuesta;
    this.tipoRegistroActivo = null;
  }

  // Abre modal de edición de preguntas abiertas (clonando objeto)
  editarEncuesta(encuesta: EncuestaRegistro): void {
    this.encuestaEnEdicion = JSON.parse(JSON.stringify(encuesta));
    this.selectedEncuesta = null;
  }

  // Cierra edición sin guardar
  cancelarEdicion(): void {
    this.encuestaEnEdicion = null;
  }

  // Cierra modal de detalles
  cerrarDetalles(): void {
    this.selectedEncuesta = null;
  }

  // Guarda solo respuestas abiertas editables para la encuesta seleccionada
  guardarEdicionAbiertas(): void {
    if (!this.encuestaEnEdicion) return;

    const respuestas = this.respuestasAbiertasEditables.map((r) => ({
      preguntaId: r.preguntaId,
      respuestaAbierta: r.respuestaAbierta ?? '',
    }));

    this.isLoading = true;

    this.encuestasApi
      .actualizarRespuestasAbiertas(this.encuestaEnEdicion.id, { respuestas })
      .subscribe({
        next: () => {
          this.mostrarOk('Respuestas abiertas actualizadas correctamente.');
          this.encuestaEnEdicion = null;
          this.loadEncuestas();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error al actualizar respuestas abiertas', err);
          const msg =
            err?.error?.message ??
            `Error ${err.status} al actualizar respuestas.`;
          this.mostrarError(msg);
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
  }

  // Devuelve etiqueta legible para el tipo de encuesta
  mapTipoLabel(tipo: TipoEncuesta | string): string {
    const found = this.tiposEncuesta.find((t) => t.value === tipo);
    return found ? found.label : (tipo as string);
  }

  // Obtiene nombre del estudiante a partir del rut (para mostrar en lista)
  getNombreEstudiantePorRut(rut: string | null | undefined): string {
    if (!rut) return '';
    const est = this.estudiantes.find((e) => e.rut === rut);
    return est ? est.nombre : '';
  }

  terminoBusqueda: string = '';

  // Configuración de orden actual en tabla de encuestas
  orden = {
    campo: 'fecha' as 'fecha' | 'nombre' | 'tipo',
    asc: false,
  };

  // Cambia campo y dirección de orden
  ordenarPor(campo: 'fecha' | 'nombre' | 'tipo') {
    if (this.orden.campo === campo) {
      this.orden.asc = !this.orden.asc;
    } else {
      this.orden.campo = campo;
      this.orden.asc = true;
    }
  }

  // ===== FILTRO + ORDEN =====
  // Retorna lista filtrada y ordenada, usada directamente en el template
  get encuestasFiltradas(): EncuestaRegistro[] {
    let lista = [...this.encuestas];

    // --- FILTRO ---
    if (this.terminoBusqueda && this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.trim().toLowerCase();

      lista = lista.filter((e) => {
        const meta = e.metadata || {};

        // Para encuestas estudiantiles
        const rutEstudiante = (meta['nombre_estudiante'] || '')
          .toString()
          .toLowerCase();
        const nombreEstudiante = (
          this.getNombreEstudiantePorRut(meta['nombre_estudiante']) || ''
        )
          .toString()
          .toLowerCase();

        // Para encuestas de colaboradores
        const nombreColaborador = (meta['nombre_colaborador'] || '')
          .toString()
          .toLowerCase();

        // Nombre del centro
        const nombreCentro = (
          meta['nombre_centro'] ||
          meta['nombre_colegio'] ||
          ''
        )
          .toString()
          .toLowerCase();

        // Tipo de encuesta en texto
        const tipoLabel = (this.mapTipoLabel(e.tipo) || '').toLowerCase();

        // Fecha de la encuesta
        const fechaStr = e.fecha
          ? new Date(e.fecha).toISOString().slice(0, 10).toLowerCase()
          : '';

        return (
          rutEstudiante.includes(termino) ||
          nombreEstudiante.includes(termino) ||
          nombreColaborador.includes(termino) ||
          nombreCentro.includes(termino) ||
          tipoLabel.includes(termino) ||
          fechaStr.includes(termino)
        );
      });
    }

    // --- ORDEN ---
    lista.sort((a, b) => {
      const asc = this.orden.asc ? 1 : -1;

      switch (this.orden.campo) {
        case 'fecha': {
          const fa = a.fecha ? a.fecha.getTime() : 0;
          const fb = b.fecha ? b.fecha.getTime() : 0;
          return asc * (fa - fb);
        }

        case 'nombre': {
          const metaA = a.metadata || {};
          const metaB = b.metadata || {};

          const nombreA =
            this.getNombreEstudiantePorRut(metaA['nombre_estudiante']) ||
            metaA['nombre_colaborador'] ||
            '';
          const nombreB =
            this.getNombreEstudiantePorRut(metaB['nombre_estudiante']) ||
            metaB['nombre_colaborador'] ||
            '';

          return asc * nombreA.localeCompare(nombreB);
        }

        case 'tipo': {
          const tipoA = this.mapTipoLabel(a.tipo);
          const tipoB = this.mapTipoLabel(b.tipo);
          return asc * tipoA.localeCompare(tipoB);
        }
      }

      return 0;
    });

    return lista;
  }

  // Hook para cambios de filtro (extensible si se usa paginación, etc.)
  onFiltersChange() {
    // Si quisieras, podrías resetear página o algo aquí. Por ahora no hace falta.
  }

  // Columnas de metadatos a mostrar en tabla de detalle (oculta campos técnicos)
  getDetailColumns(encuesta: EncuestaRegistro | null): string[] {
    if (!encuesta || !encuesta.metadata) return [];
    const ocultar = new Set(['respuestas', 'tipo', 'id', 'semestreId']);
    return Object.keys(encuesta.metadata).filter((k) => !ocultar.has(k));
  }

  // Retorna solo respuestas abiertas que son editables según configuración
  get respuestasAbiertasEditables() {
    if (!this.encuestaEnEdicion) return [];

    return this.encuestaEnEdicion.respuestas.filter((r) => {
      if (r.respuestaAbierta === undefined || r.respuestaAbierta === null) {
        return false;
      }

      const key = r.pregunta?.descripcion;
      if (!key) return false;

      return this.preguntasAbiertasEditablesKeys.includes(key);
    });
  }

  // Calcula semestre (1 o 2) según la fecha de la encuesta
  private computeSemestre(fecha: Date | null | undefined): number | '' {
    if (!fecha || isNaN(fecha.getTime())) return '';
    const month = fecha.getMonth(); // 0-based
    return month <= 6 ? 1 : 2; // enero (0) a julio (6) es semestre 1
  }

  // ---------- ENVÍO ----------
  // Envía el formulario a la API según el tipo de encuesta
  onSubmitRegistro(): void {
    if (!this.registroForm) return;
    if (!this.tipoRegistroActivo) {
      this.mostrarError('No hay tipo de encuesta activo.');
      return;
    }

    const form = this.registroForm;
    const raw = form.getRawValue ? form.getRawValue() : form.value;

    if (form.invalid) {
      form.markAllAsTouched();
      this.mostrarError('Por favor completa los campos requeridos.');
      return;
    }

    this.isLoading = true;

    let payload: any = { tipo: this.tipoRegistroActivo, data: {} };

    if (this.tipoRegistroActivo === 'ESTUDIANTIL') {
      const data = raw;

      const estudianteRut: string = data.nombreEstudiante;
      const estudianteNombre =
        this.estudiantes.find((s) => s.rut === estudianteRut)?.nombre ?? null;
      const centroId = data.establecimiento;
      const centroNombre =
        this.centros.find((c) => c.id === centroId)?.nombre ?? null;
      const tutorId = data.nombreTalleristaSupervisor;
      const tutorNombre =
        this.tutores.find((t) => t.id === tutorId)?.nombre ?? null;
      const colaboradorId = data.nombreDocenteColaborador;
      const colaboradorNombre =
        this.colaboradores.find((c) => c.id === colaboradorId)?.nombre ?? null;

      payload.data = {
        nombreEstudiante: estudianteRut,
        nombreEstudianteLabel: estudianteNombre,
        establecimiento: centroNombre,
        establecimientoId: centroId,
        fechaEvaluacion: data.fechaEvaluacion
          ? new Date(data.fechaEvaluacion).toISOString()
          : new Date().toISOString(),

        nombreTalleristaSupervisor: tutorNombre,
        nombreTalleristaSupervisorId: tutorId,

        nombreDocenteColaborador: colaboradorNombre,
        nombreDocenteColaboradorId: colaboradorId,

        secI: data.secI,
        secII_A: data.secII_A,
        secII_B: data.secII_B,
        secIII_A: data.secIII_A,
        secIII_B: data.secIII_B,
        secIII_C: data.secIII_C,
        secIV_T: data.secIV_T,
        secIV_S: data.secIV_S,
        secV: data.secV,

        mejoraRolTallerista: data.secIV_S.mejoraRolTallerista,
        mejoraCoordinacion: data.comentariosAdicionales,

        comentariosAdicionales: data.comentariosAdicionales,
        observacion: data.comentariosAdicionales,
      };
    } else {
      // COLABORADORES_JEFES
      const data = raw;

      const colaboradorId = data.nombreColaborador;
      const colaboradorNombre =
        this.colaboradores.find((c) => c.id === colaboradorId)?.nombre ?? null;
      const estudianteRut = data.nombreEstudiantePractica;
      const estudianteNombre =
        this.estudiantes.find((s) => s.rut === estudianteRut)?.nombre ?? null;
      const centroId = data.centroEducativo;
      const centroNombre =
        this.centros.find((c) => c.id === centroId)?.nombre ?? null;

      payload.data = {
        nombreColaborador: colaboradorNombre,
        nombreColaboradorId: colaboradorId,
        nombreEstudiantePractica: estudianteRut,
        nombreEstudiantePracticaLabel: estudianteNombre,
        centroEducativo: centroNombre,
        centroEducativoId: centroId,
        fechaEvaluacion: data.fechaEvaluacion
          ? new Date(data.fechaEvaluacion).toISOString()
          : new Date().toISOString(),
        secI: data.secI,
        secII: data.secII,
        secIII: data.secIII,
        sugerencias: data.sugerencias,
        cumplePerfilEgreso: data.cumplePerfilEgreso,
        comentariosAdicionales: data.comentariosAdicionales ?? null,
      };
    }

    this.encuestasApi.createEncuesta(payload).subscribe({
      next: () => {
        this.mostrarOk('Encuesta registrada exitosamente.');
        this.loadEncuestas();
        this.cerrarRegistro();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al crear encuesta', err);
        const msg =
          err?.error?.message ??
          `Error ${err.status} al guardar la encuesta.`;
        this.mostrarError(msg);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  // ---------- EXPORT ----------
  // Descarga Excel con todas las encuestas
  downloadExcel() {
    this.isLoading = true;
    this.encuestasApi.exportEncuestasExcel().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'encuestas_estudiantes.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar Excel', err);
        this.mostrarError('Error al descargar Excel');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  // ---------- SNACKBARS ----------
  // Mensaje informativo de éxito
  private mostrarOk(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-success'],
    });
  }

  // Mensaje de error
  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['snackbar-error'],
    });
  }
}
