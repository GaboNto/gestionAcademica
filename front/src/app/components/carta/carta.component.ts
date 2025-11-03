// carta.component.ts
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
// --- LÍNEA CORREGIDA ---
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
// -------------------------

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Servicios y Tipos de Datos
import {
  CartaDataService,
  ApiCentro,
  ApiEstudiante,
  ApiSupervisor,
  CreateCartaDto,
} from '../../services/carta-data.service';

// PDF
import { jsPDF } from 'jspdf';
import { PdfDialogComponent } from './pdf-dialog.component'; // Asegúrate que la ruta sea correcta

@Component({
  selector: 'app-carta',
  standalone: true,
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    
    // --- Módulos añadidos para PDF y Notificaciones ---
    MatDialogModule,
    MatSnackBarModule,
    PdfDialogComponent,
    // -------------------------------------------------
  ],
})
export class CartaComponent {
  // --- Inyecciones de servicio ---
  private fb = inject(FormBuilder);
  private data = inject(CartaDataService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  // --- Listas de datos ---
  tiposPractica: string[] = [];
  centros: ApiCentro[] = [];
  estudiantes: ApiEstudiante[] = [];
  supervisores: ApiSupervisor[] = [];

  // --- Filtros ---
  studentFilter = '';
  supervisorFilter = '';
  filteredStudents: ApiEstudiante[] = [];
  filteredSupervisores: ApiSupervisor[] = [];

  // --- Estado ---
  centroSeleccionado: ApiCentro | null = null;

  // --- Formulario ---
  form = this.fb.group(
    {
      tipoPractica: ['', Validators.required],
      centroId: [null as number | null, Validators.required],
      // Se guardan los RUTs (string[])
      estudiantesIds: this.fb.control<string[]>([], {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(1)], // Añadido minLength
      }),
      supervisorId: [null as number | null, Validators.required],
      periodoInicio: [null as Date | null, Validators.required],
      periodoFin: [null as Date | null, Validators.required],
    },
    { validators: [this.periodoValidator] } // Pasamos la función
  );

  // ===============================================
  // ===== INICIO: LÓGICA DE PDF (FUSIONADA) =====
  // ===============================================

  private readonly JEFATURA_NOMBRE = 'Dr. IGNACIO JARA PARRA';
  private readonly JEFATURA_CARGO = 'Jefe de Carrera';

  // --- Helpers de selección (Adaptados a ApiTypes) ---

  get alumnosSeleccionados(): ApiEstudiante[] {
    const ids = this.form.value.estudiantesIds ?? [];
    // Filtramos la lista completa de estudiantes por los RUTs seleccionados
    return this.estudiantes.filter((e) => ids.includes(e.rut));
  }

  get supervisorSeleccionado(): ApiSupervisor | undefined {
    const id = this.form.value.supervisorId ?? null;
    return this.supervisores.find((s) => s.id === id!);
  }

  get plural(): boolean {
    return this.alumnosSeleccionados.length > 1;
  }

  // --- Helpers de Fechas ---
  private fechaLarga(d: Date | null | undefined): string {
    if (!d) return '';
    // Aseguramos que 'd' sea un objeto Date
    const f = d instanceof Date ? d : new Date(d);
    return f.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  private fechaHoy(): string {
    return this.fechaLarga(new Date());
  }

  // --- Helpers de Texto de Carta (Adaptados a ApiTypes) ---
  private listaEstudiantes(): string {
    return this.alumnosSeleccionados
      .map((s) => `• ${s.nombre}, Rut ${s.rut}`)
      .join('\n');
  }

  // (Simplificado, ya que ApiCentro no tiene 'director')
  private destinatario(): { linea: string; cargo: string } {
    const c = this.centroSeleccionado;
    if (!c) return { linea: 'Señor(a)', cargo: '' };
    
    // Usamos el nombre del centro
    return { linea: `Director(a) ${c.nombre}`, cargo: 'Director(a)' };
  }

  private encabezado(refConFolio: boolean, folio?: string): string {
    const ciudad = this.centroSeleccionado?.comuna || 'Arica';
    const fecha = this.fechaHoy();
    const refLabel = 'SOLICITUD DE AUTORIZACIÓN PARA PRÁCTICA';
    const folioTxt = refConFolio && folio ? `\n\nPHG N° ${folio}.-\n` : '\n\n';
    return `REF.: ${refLabel}\n\n${ciudad.toUpperCase()}, ${fecha}.-${folioTxt}`;
  }

  private saludo(): string {
    const c = this.centroSeleccionado;
    const { linea, cargo } = this.destinatario();
    const centro = c?.nombre || '';
    // ApiCentro no tiene 'direccion', así que la omitimos
    
    const cargoLinea = cargo ? `\n${cargo}` : '';
    return `Señor(a)\n${linea}${cargoLinea}\n${centro}\nPresente\n\nDe mi consideración:\n`;
  }

  private cuerpoSegunPDF(): string {
    const tipo = this.form.value.tipoPractica;
    const pi = this.fechaLarga(this.form.value.periodoInicio);
    const pf = this.fechaLarga(this.form.value.periodoFin);
    const periodoTxt = pi && pf ? `, entre el ${pi} y el ${pf}` : '';

    const intro =
      `Conforme a lo establecido en el currículo de la Carrera de Pedagogía en Historia y Geografía, ` +
      `solicitamos su autorización para que ${this.plural ? 'los siguientes estudiantes realicen' : 'el siguiente estudiante realice'} ` +
      `${this.plural ? 'sus' : 'su'} práctica ${tipo} en ese establecimiento${periodoTxt}:`;

    // Supervisor dinámico
    const sup = this.supervisorSeleccionado;
    const supLinea = sup
      ? `La tutora de práctica responsable es la ${sup.trato ?? ''} ${sup.nombre}.`.replace(/\s+/g, ' ').trim()
      : 'La tutora de práctica responsable es la Srta. Carolina Quintana Talvac.'; // fallback

    const adjuntos = `${supLinea}

Adjuntamos el detalle de la estructura de la práctica solicitada, junto con los siguientes documentos:
• Credencial del profesor en práctica.
• Perfiles de egreso.
• Ficha de seguro escolar (Decreto Ley N.º 16.774) de cada estudiante.
• Responsabilidades del docente colaborador en el aula.

Agradecemos de antemano las facilidades y quedamos atentos a su respuesta.
`;

    const firma = `Se despide atentamente,

${this.JEFATURA_NOMBRE}
${this.JEFATURA_CARGO}
Facultad de Educación y Humanidades
Universidad de Tarapacá`;

    return `${intro}\n\n${this.listaEstudiantes()}\n\n${adjuntos}\n${firma}`;
  }

  private documentoPlano(refConFolio: boolean, folio?: string): string {
    return `${this.encabezado(refConFolio, folio)}\n${this.saludo()}${this.cuerpoSegunPDF()}\n\nAdj.: Lo indicado.\nc.c.: Archivo`;
  }

  // --- Generación PDF con jsPDF (Copiado 1:1 de tu mock) ---
  private crearYMostrarPDF(texto: string, titulo: string) {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' }); // 612 x 792 pt
    const margin = { left: 56, top: 64, right: 56, bottom: 64 };
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin.left - margin.right;
    let y = margin.top;

    // Encabezado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Carrera de Pedagogía en Historia y Geografía', margin.left, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(
      'Facultad de Educación y Humanidades — Universidad de Tarapacá',
      margin.left,
      y
    );
    y += 12;
    doc.setTextColor(100);
    doc.text(
      'Av. 18 de Septiembre N°2222 · Arica · pedhg@gestion.uta.cl · +56 58 2205253',
      margin.left,
      y
    );
    doc.setTextColor(0);
    y += 14;
    // Separador
    doc.setDrawColor(180);
    doc.setLineWidth(0.5);
    doc.line(margin.left, y, pageWidth - margin.right, y);
    y += 16;

    // Cuerpo (párrafos)
    const paragraphs = texto.split('\n\n');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setLineHeightFactor(1.25);

    for (const p of paragraphs) {
      const lines = doc.splitTextToSize(p, contentWidth);
      const height = lines.length * 14; // 11pt * 1.25 line-height = ~14pt
      if (y + height > pageHeight - margin.bottom) {
        doc.addPage();
        y = margin.top;
      }
      doc.text(lines, margin.left, y);
      y += height + 8; // (height + espaciado entre párrafos)
    }

    const dataUrl = doc.output('datauristring');
    this.dialog.open(PdfDialogComponent, {
      data: { dataUrl, title: titulo },
      width: '980px',
      maxHeight: '95vh',
    });
  }

  // ===========================================
  // ===== FIN: LÓGICA DE PDF (FUSIONADA) =====
  // ===========================================

  // --- Ciclo de Vida y Carga de Datos ---
  ngOnInit(): void {
    this.data.getTiposPractica().subscribe((t) => (this.tiposPractica = t));
    this.data.getCentros('').subscribe((cs) => (this.centros = cs));

    this.data.getEstudiantes('').subscribe((es) => {
      this.estudiantes = es;
      this.filteredStudents = es;
    });

    this.data.getSupervisores('').subscribe((ss) => {
      this.supervisores = ss;
      this.filteredSupervisores = ss;
    });

    // Actualiza 'centroSeleccionado' cuando el ID cambia
    this.form.get('centroId')!.valueChanges.subscribe((id: number | null) => { // Tipado explícito
      this.centroSeleccionado = this.centros.find((c) => c.id === id) ?? null;
      this.cdr.markForCheck();
    });
  }

  // --- Filtros (UI) ---
  _markForCheck() {
    this.cdr.markForCheck();
    this.applyFilters();
  }

  applyFilters() {
    const fS = this.studentFilter.toLowerCase();
    const fP = this.supervisorFilter.toLowerCase();

    this.filteredStudents = this.estudiantes.filter((e) =>
      `${e.nombre} ${e.rut}`.toLowerCase().includes(fS)
    );
    this.filteredSupervisores = this.supervisores.filter((s) =>
      `${s.nombre} ${s.correo ?? ''}`.toLowerCase().includes(fP)
    );
  }

  // --- Acciones de Botones (Actualizadas) ---
  
  /** Muestra una vista previa del PDF sin guardar */
  previa(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open(
        'Completa los campos requeridos (centro, estudiantes, supervisor y periodo).',
        'OK',
        { duration: 2200 }
      );
      return;
    }
    this.crearYMostrarPDF(this.documentoPlano(false), 'Vista previa de carta');
  }

  /** Guarda en la BD y (si es exitoso) genera el PDF con folio */
  grabar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Completa los campos requeridos.', 'OK', {
        duration: 2200,
      });
      return;
    }

    const v = this.form.value;
    const dto: CreateCartaDto = {
      tipoPractica: v.tipoPractica!,
      centroId: v.centroId!,
      estudiantesIds: v.estudiantesIds!, // string[] (RUTs)
      supervisorId: v.supervisorId!,
      periodoInicio: this.toISO(v.periodoInicio),
      periodoFin: this.toISO(v.periodoFin),
    };

    // 1. Llamar al backend para guardar
    this.data.crearCarta(dto).subscribe({
      next: (respuesta: any) => {
        // 2. Si es exitoso, usar el 'folio' devuelto para generar el PDF
        const folio = respuesta.folio || 'S/F'; // Tomamos el folio del backend

        this.crearYMostrarPDF(
          this.documentoPlano(true, folio),
          `Carta folio ${folio}`
        );

        this.snack.open(`Carta guardada con folio ${folio} `, 'OK', {
          duration: 2400,
        });
        this.limpiar();
      },
      error: (err) => {
        console.error(err);
        // Usamos SnackBar en lugar de alert
        this.snack.open('Error al crear la carta ', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

  /** Limpia el formulario */
  limpiar(): void {
    this.form.reset({
      tipoPractica: '',
      centroId: null,
      estudiantesIds: [], // string[] (no null)
      supervisorId: null,
      periodoInicio: null,
      periodoFin: null,
    });
    this.studentFilter = '';
    this.supervisorFilter = '';
    this.filteredStudents = this.estudiantes;
    this.filteredSupervisores = this.supervisores;
  }

  // --- Helpers de Formulario ---
  
  private periodoValidator(group: AbstractControl): ValidationErrors | null {
    const i = group.get('periodoInicio')?.value as Date | null;
    const f = group.get('periodoFin')?.value as Date | null;
    if (i && f && new Date(f).getTime() <= new Date(i).getTime()) {
      return { periodoInvalido: true };
    }
    return null;
  }

  private toISO(d: any): string {
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().slice(0, 10);
  }
}