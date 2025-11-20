import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RouterLink } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';

// Definiciones de tipos
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
})
export class EncuestasComponent implements OnInit {
  // --- ESTADOS Y DATOS PRINCIPALES ---
  public tipoRegistroActivo: TipoEncuesta | null = null;
  public selectedEncuesta: EncuestaRegistro | null = null;
  public isLoading: boolean = false;

  registroForm!: FormGroup;

  // Opciones comunes para Selects (escala de 5 puntos)
  opcionesEscala5 = [
    { value: 1, label: '1 (Muy insatisfecho / Totalmente en desacuerdo)' },
    { value: 2, label: '2' },
    { value: 3, label: '3 (Ni en acuerdo, ni en desacuerdo)' },
    { value: 4, label: '4' },
    { value: 5, label: '5 (Muy satisfecho / Totalmente de acuerdo)' },
    { value: 'NA', label: 'No aplica / N/O' },
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
  
  // Datos de encuestas simuladas para el listado inferior
  encuestas: EncuestaRegistro[] = [
    { id: '1', tipo: 'ESTUDIANTIL', fecha: new Date('2024-03-15'), origenArchivo: 'MariaGonzalez.xlsx', respuestas: [{ 'Estudiante': 'Maria González', 'Colegio': 'San Patricio' }] },
    { id: '2', tipo: 'COLABORADORES_JEFES', fecha: new Date('2024-03-14'), origenArchivo: 'AnaMartinez.xlsx', respuestas: [{ 'Colaborador': 'Prof. Ana Martínez', 'Establecimiento': 'Los Aromos' }] },
  ];
  
  tiposEncuesta = [
    { value: 'ESTUDIANTIL' as TipoEncuesta, label: 'Percepción estudiantil' },
    { value: 'COLABORADORES_JEFES' as TipoEncuesta, label: 'Colaboradores / Jefes UTP' },
  ];

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.registroForm = this.fb.group({});
  }

  // ----------------- CONTROL DE UI Y FORMULARIO -----------------

  iniciarRegistro(tipo: TipoEncuesta): void {
    this.tipoRegistroActivo = tipo;
    this.selectedEncuesta = null; // Cierra detalles si está abierto

    if (tipo === 'ESTUDIANTIL') {
      this.registroForm = this.buildEstudiantilForm();
    } else {
      this.registroForm = this.buildColaboradoresForm();
    }
  }

  cerrarRegistro(): void {
    this.tipoRegistroActivo = null;
    this.registroForm.reset();
  }
  
  mapTipoLabel(tipo: TipoEncuesta): string {
    const found = this.tiposEncuesta.find((t) => t.value === tipo);
    return found ? found.label : tipo;
  }

  // ----------------- CONSTRUCCIÓN DE FORMULARIOS DINÁMICOS -----------------

  private buildEstudiantilForm(): FormGroup {
    return this.fb.group({
      // IDENTIFICACIÓN
      nombreEstudiante: ['', Validators.required],
      establecimiento: [''],
      fechaEvaluacion: [null],
      nivelCursado: [''],
      anio: [''],
      nombreTalleristaSupervisor: [''],
      nombreDocenteColaborador: [''],

      // SECCIÓN I: DESARROLLO GENERAL DE LA PRÁCTICA (4 preguntas)
      secI: this.fb.group({
        objetivos: ['', Validators.required],
        accionesEstablecimiento: [''],
        accionesTaller: [''],
        satisfaccionGeneral: [''],
      }),
      
      // SECCIÓN II.A: PERCEPCIÓN SOBRE LOS COLABORADORES/AS (5 preguntas)
      secII_A: this.fb.group({
        apoyoInsercion: [''],
        apoyoGestion: [''],
        orientacionComportamiento: [''],
        comunicacionConstante: [''],
        retroalimentacionProceso: [''],
      }),

      // SECCIÓN II.B: EXPERIENCIA CON COLABORADOR (2 preguntas SI/NO + Comentarios)
      secII_B: this.fb.group({
        interesRol: [''],
        recomendarColaborador: [''],
        comentariosColaborador: [''],
      }),
      
      // SECCIÓN III.A: PERCEPCIÓN SOBRE CENTRO EDUCATIVO - NORMATIVAS (4 preguntas)
      secIII_A: this.fb.group({
        planEvacuacion: [''],
        proyectoEducativo: [''],
        reglamentoConvivencia: [''],
        planMejoramiento: [''],
      }),
      
      // SECCIÓN III.B: PERCEPCIÓN SOBRE CENTRO EDUCATIVO - PARTICIPACIÓN (7 actividades)
      secIII_B: this.fb.group({
        reunionesDepartamento: [''],
        reunionesApoderados: [''],
        fiestasPatrias: [''],
        diaLibro: [''],
        aniversarios: [''],
        diaFamilia: [''],
        graduaciones: [''],
      }),
      
      // SECCIÓN III.C: CENTRO EDUCATIVO - AMBIENTE (2 preguntas SI/NO + Comentarios)
      secIII_C: this.fb.group({
        gratoAmbiente: [''],
        recomendarCentro: [''],
        comentariosCentro: [''],
      }),

      // SECCIÓN IV.A: PERCEPCIÓN SOBRE EL TALLERISTA (7 preguntas)
      secIV_T: this.fb.group({
        presentacionCentro: [''],
        facilitaComprension: [''],
        planificaVisitas: [''],
        sesionesSemanales: [''],
        evaluaPermanente: [''],
        orientaDesempeno: [''],
        organizaActividades: [''],
      }),
      
      // SECCIÓN IV.B: PERCEPCIÓN SOBRE EL SUPERVISOR/A (8 preguntas)
      secIV_S: this.fb.group({
        presentacionCentro: [''],
        orientaGestion: [''],
        comunicacionConstante: [''],
        orientaComportamiento: [''],
        sesionesRetro: [''],
        evaluaGlobal: [''],
        resuelveProblemas: [''],
        orientaGestionDos: [''],
      }),
      
      // RESPUESTA ABIERTA (Mejoras Tallerista/Supervisor)
      mejoraRolTallerista: [''],
      
      // SECCIÓN V: SOBRE LA COORDINACIÓN DE PRÁCTICA (5 preguntas)
      secV: this.fb.group({
        induccionesAcordes: [''],
        informacionClara: [''],
        respuestaDudas: [''],
        infoAcordeCentros: [''],
        gestionesMejora: [''],
      }),
      
      // RESPUESTA ABIERTA (Mejoras Coordinación)
      mejoraCoordinacion: [''],
    });
  }

  private buildColaboradoresForm(): FormGroup {
    return this.fb.group({
      // IDENTIFICACIÓN
      nombreColaborador: ['', Validators.required],
      nombreEstudiantePractica: [''],
      centroEducativo: [''],
      tipoPractica: [''], 
      fechaEvaluacion: [null],

      // SECCIÓN I: EVALUACIÓN AL DOCENTE EN PRÁCTICA (8 preguntas)
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

      // SECCIÓN II: INTEGRACIÓN A LA COMUNIDAD EDUCATIVA (5 preguntas)
      secII: this.fb.group({
        i1_vinculacionPares: [''],
        i2_capacidadGrupoTrabajo: [''],
        i3_presentacionPersonal: [''],
        i4_autoaprendizaje: [''],
        i5_formacionSuficiente: [''],
      }),

      // SECCIÓN III: VINCULACIÓN CON LA COORDINACIÓN DE LAS PRÁCTICAS (4 preguntas)
      secIII: this.fb.group({
        v1_flujoInformacionSupervisor: [''],
        v2_claridadRoles: [''],
        v3_verificacionAvance: [''],
        v4_satisfaccionGeneral: [''],
      }),

      // RESPUESTAS ABIERTAS
      sugerencias: [''], 
      cumplePerfilEgreso: [''], 
    });
  }

  // ----------------- ENVÍO DE FORMULARIO -----------------

  onSubmitRegistro(): void {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      this.mostrarError('Por favor, completa los campos requeridos y verifica las secciones.');
      return;
    }

    const data = this.registroForm.value;

    const nuevaEncuesta: EncuestaRegistro = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      tipo: this.tipoRegistroActivo!,
      fecha: new Date(),
      origenArchivo: 'Formulario Web',
      respuestas: [data],
    };
    
    this.encuestas = [nuevaEncuesta, ...this.encuestas]; // Simulación local
    this.mostrarOk('Encuesta registrada exitosamente mediante formulario.');
    this.cerrarRegistro();
  }

  // ----------------- DETALLES Y UTILIDADES -----------------

  verDetalles(encuesta: EncuestaRegistro): void {
    this.selectedEncuesta = encuesta;
    this.tipoRegistroActivo = null;
  }

  cerrarDetalles(): void {
    this.selectedEncuesta = null;
  }

  getDetailColumns(encuesta: EncuestaRegistro | null): string[] {
    if (!encuesta || !encuesta.respuestas || !encuesta.respuestas.length) {
      return [];
    }
    return Object.keys(encuesta.respuestas[0]);
  }

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