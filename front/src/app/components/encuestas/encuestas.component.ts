import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import {
  EncuestasApiService,
  ApiEncuesta,
} from '../../services/encuestas-api.service';

// Angular Material
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

export type TipoEncuesta = 'ESTUDIANTIL' | 'COLABORADORES_JEFES';

export interface EncuestaRegistro {
  id: string;
  tipo: TipoEncuesta;
  fecha: Date;
  origenArchivo: string;
  respuestas: { [key: string]: any }[];
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
  // Inyección moderna
  private fb = inject(FormBuilder);

  constructor(
    private snackBar: MatSnackBar,
    private encuestasApi: EncuestasApiService
  ) {}

  // UI / estado
  public tipoRegistroActivo: TipoEncuesta | null = null;
  public selectedEncuesta: EncuestaRegistro | null = null;
  public isLoading: boolean = false;

  registroForm!: FormGroup;
  encuestas: EncuestaRegistro[] = [];

  // Catálogos (para selects)
  estudiantes: { rut: string; nombre: string }[] = [];
  centros: { id: number; nombre: string; comuna?: string; region?: string }[] =
    [];
  colaboradores: { id: number; nombre: string }[] = [];
  tutores: { id: number; nombre: string }[] = [];

  // Por si quieres bloquear selects
  public readOnlySelects = false;

  // Opciones para escalas
  opcionesEscala5 = [
    { value: 'NA', label: 'NA' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
  ];

  opcionesSiNo = [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ];

  opcionesNormativas = [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
    { value: 'NS', label: 'No existe/no sabe' },
  ];

  opcionesParticipacion = [
    { value: 'A_P', label: 'Asistí y pude participar' },
    { value: 'A_N', label: 'Asistí, pero no intervine' },
    { value: 'R_NA', label: 'Se realizó, pero no asistí' },
    { value: 'R_NI', label: 'Se realizó, pero no fui invitado' },
    { value: 'NR', label: 'No se realizó' },
  ];

  tiposEncuesta = [
    { value: 'ESTUDIANTIL' as TipoEncuesta, label: 'Percepción estudiantil' },
    {
      value: 'COLABORADORES_JEFES' as TipoEncuesta,
      label: 'Colaboradores / Jefes UTP',
    },
  ];

  ngOnInit(): void {
    this.registroForm = this.fb.group({});
    this.loadEncuestas();
    this.loadCatalogos();
  }

  // ---------- CARGA ENCUESTAS ----------
  loadEncuestas(): void {
    this.isLoading = true;
    this.encuestasApi.getEncuestasRegistradas().subscribe({
      next: (data: ApiEncuesta[]) => {
        this.encuestas = data.map((item) => ({
          id: (item.id ?? Math.random()).toString(),
          // acceso con ['nombre_estudiante'] para evitar error TS
          tipo: (item.tipo ??
            (item['nombre_estudiante']
              ? 'ESTUDIANTIL'
              : 'COLABORADORES_JEFES')) as TipoEncuesta,
          fecha: item.fecha ? new Date(item.fecha) : new Date(),
          origenArchivo: item.origenArchivo ?? 'API (BD)',
          // guardamos la fila completa dentro de respuestas[0]
          respuestas: [item as any],
        }));
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
  private buildEstudiantilForm(): FormGroup {
    return this.fb.group({
      nombreEstudiante: ['', Validators.required],
      establecimiento: [''],
      fechaEvaluacion: [null],
      nivelCursado: [''],
      anio: [''],
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
        mejoraRolTallerista: [''], // aquí dentro del grupo
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

  private buildColaboradoresForm(): FormGroup {
    return this.fb.group({
      nombreColaborador: ['', Validators.required],
      nombreEstudiantePractica: [''],
      centroEducativo: [''],
      tipoPractica: [''],
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
  iniciarRegistro(tipo: TipoEncuesta): void {
    this.tipoRegistroActivo = tipo;
    this.selectedEncuesta = null;

    if (tipo === 'ESTUDIANTIL') {
      this.registroForm = this.buildEstudiantilForm();

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

  cerrarRegistro(): void {
    this.tipoRegistroActivo = null;
    if (this.registroForm) this.registroForm.reset();
  }

  verDetalles(encuesta: EncuestaRegistro): void {
    this.selectedEncuesta = encuesta;
    this.tipoRegistroActivo = null;
  }

  cerrarDetalles(): void {
    this.selectedEncuesta = null;
  }

  mapTipoLabel(tipo: TipoEncuesta | string): string {
    const found = this.tiposEncuesta.find((t) => t.value === tipo);
    return found ? found.label : (tipo as string);
  }

  getDetailColumns(encuesta: EncuestaRegistro | null): string[] {
    if (!encuesta || !encuesta.respuestas || !encuesta.respuestas.length)
      return [];
    return Object.keys(encuesta.respuestas[0]);
  }

  // ---------- ENVÍO ----------
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
         nivelCursado: data.nivelCursado,
        anio: data.anio,

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
        tipoPractica: data.tipoPractica,
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
  private mostrarOk(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-success'],
    });
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['snackbar-error'],
    });
  }
}
